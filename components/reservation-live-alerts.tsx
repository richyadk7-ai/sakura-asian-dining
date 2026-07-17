"use client";

import { BellRing, Check, Smartphone, Volume2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NewReservationAlert = {
  id: string;
  reservationReference: string;
  customerName: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
};

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
type NavigatorWithStandalone = Navigator & { standalone?: boolean };

type PushState = "checking" | "off" | "on" | "denied" | "unavailable" | "error";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function playSakuraChime(audioContext: AudioContext) {
  const now = audioContext.currentTime;
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-20, now);
  compressor.knee.setValueAtTime(12, now);
  compressor.ratio.setValueAtTime(8, now);
  compressor.attack.setValueAtTime(0.003, now);
  compressor.release.setValueAtTime(0.32, now);
  compressor.connect(audioContext.destination);

  const master = audioContext.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.9, now + 0.025);
  master.gain.setValueAtTime(0.9, now + 1.08);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
  master.connect(compressor);

  const notes = [
    [523.25, 0, 0.62],
    [659.25, 0.16, 0.68],
    [783.99, 0.32, 0.72],
    [1046.5, 0.54, 0.92],
    [1318.51, 0.72, 1.02],
  ] as const;
  notes.forEach(([frequency, delay, duration]) => {
    (["sine", "triangle"] as const).forEach((waveform, layer) => {
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      const start = now + delay;
      const peak = layer === 0 ? 0.32 : 0.12;
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(layer === 0 ? frequency : frequency * 2, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  });
}

function parseAlert(payload: Record<string, unknown>): NewReservationAlert | null {
  const id = typeof payload.id === "string" ? payload.id : "";
  const reservationReference = typeof payload.reservation_reference === "string" ? payload.reservation_reference : "";
  const customerName = typeof payload.customer_name === "string" ? payload.customer_name : "";
  const reservationDate = typeof payload.reservation_date === "string" ? payload.reservation_date : "";
  const reservationTime = typeof payload.reservation_time === "string" ? payload.reservation_time.slice(0, 5) : "";
  const guestCount = typeof payload.guest_count === "number" ? payload.guest_count : Number(payload.guest_count);
  if (!id || !reservationReference || !customerName || !/^\d{4}-\d{2}-\d{2}$/.test(reservationDate) || !/^\d{2}:\d{2}$/.test(reservationTime) || !Number.isInteger(guestCount)) return null;
  return { id, reservationReference, customerName, reservationDate, reservationTime, guestCount };
}

export function ReservationLiveAlerts({ pushPublicKey = "" }: { pushPublicKey?: string }) {
  const router = useRouter();
  const audioContext = useRef<AudioContext | null>(null);
  const soundEnabled = useRef(false);
  const [alert, setAlert] = useState<NewReservationAlert | null>(null);
  const [connection, setConnection] = useState<"connecting" | "live" | "error">("connecting");
  const [sound, setSound] = useState<"off" | "on" | "error">("off");
  const [pushState, setPushState] = useState<PushState>("checking");
  const [pushMessage, setPushMessage] = useState("");

  useEffect(() => {
    let client: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      queueMicrotask(() => setConnection("error"));
      return;
    }

    const channel = client
      .channel("owner-reservation-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservations" }, (event) => {
        const nextAlert = parseAlert(event.new as Record<string, unknown>);
        if (!nextAlert) return;
        setAlert(nextAlert);
        if (soundEnabled.current && audioContext.current) playSakuraChime(audioContext.current);
        router.refresh();
      })
      .subscribe((status) => setConnection(status === "SUBSCRIBED" ? "live" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "error" : "connecting"));

    return () => {
      void client?.removeChannel(channel);
      void audioContext.current?.close();
      audioContext.current = null;
    };
  }, [router]);

  useEffect(() => {
    if (!pushPublicKey || !("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      queueMicrotask(() => setPushState("unavailable"));
      return;
    }
    if (Notification.permission === "denied") {
      queueMicrotask(() => setPushState("denied"));
      return;
    }
    void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      setPushState((await registration.pushManager.getSubscription()) ? "on" : "off");
    }).catch(() => setPushState("error"));
  }, [pushPublicKey]);

  const enableSound = async () => {
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) {
      setSound("error");
      return;
    }
    try {
      audioContext.current ??= new AudioContextClass();
      if (audioContext.current.state === "suspended") await audioContext.current.resume();
      playSakuraChime(audioContext.current);
      soundEnabled.current = true;
      setSound("on");
    } catch {
      setSound("error");
    }
  };

  const enablePush = async () => {
    setPushMessage("");
    const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const installed = (navigator as NavigatorWithStandalone).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    if (isAppleMobile && !installed) {
      setPushMessage("On iPad, add this site to the Home Screen, then open that icon and try again.");
      setPushState("unavailable");
      return;
    }
    if (!pushPublicKey || !("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setPushMessage(isAppleMobile && !installed ? "On iPad, add this site to the Home Screen, then open that icon and try again." : "This browser does not support lock-screen web alerts.");
      setPushState("unavailable");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState("denied");
        setPushMessage("Notifications are blocked. Allow Sakura notifications in the device settings.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const ready = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(pushPublicKey) });
      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("subscription_save_failed");
      setPushState("on");
      setPushMessage("Lock-screen alerts are active on this device.");
    } catch {
      setPushState("error");
      setPushMessage("Could not activate lock-screen alerts. Keep this page open and try again.");
    }
  };

  return (
    <div className="reservation-live-alerts">
      <span className={`reservation-live-status is-${connection}`}><span aria-hidden="true" />{connection === "live" ? "Live reservations" : connection === "error" ? "Live alerts offline" : "Connecting alerts"}</span>
      <button className={`button button-outline reservation-alert-toggle${sound === "on" ? " is-active" : ""}`} type="button" onClick={enableSound}>
        {sound === "on" ? <Check /> : <Volume2 />}{sound === "on" ? "Test loud chime" : sound === "error" ? "Sound unavailable" : "Enable loud chime"}
      </button>
      <button className={`button button-outline reservation-alert-toggle${pushState === "on" ? " is-active" : ""}`} type="button" onClick={enablePush} disabled={pushState === "checking" || pushState === "on"}>
        {pushState === "on" ? <Check /> : <Smartphone />}{pushState === "on" ? "Lock-screen alerts on" : pushState === "checking" ? "Checking alerts" : "Enable lock-screen alerts"}
      </button>
      {pushMessage ? <p className={`reservation-alert-message is-${pushState}`} role="status">{pushMessage}</p> : null}
      {alert ? (
        <aside className="reservation-live-toast" role="status" aria-live="polite">
          <div className="reservation-live-toast-icon"><BellRing aria-hidden="true" /></div>
          <div><p>New reservation request</p><strong>{alert.customerName}</strong><span>{alert.reservationDate} · {alert.reservationTime} · {alert.guestCount} guests</span><a href={`#reservation-${alert.id}`}>{alert.reservationReference} · Open request</a></div>
          <button type="button" onClick={() => setAlert(null)} aria-label="Dismiss new reservation notification"><X /></button>
        </aside>
      ) : null}
    </div>
  );
}
