"use client";

import { BellRing, Check, Volume2, X } from "lucide-react";
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

function playSakuraChime(audioContext: AudioContext) {
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
  gain.connect(audioContext.destination);

  [[659.25, 0], [987.77, 0.18], [1318.51, 0.38]].forEach(([frequency, delay]) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + delay);
    oscillator.connect(gain);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + 0.62);
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

export function ReservationLiveAlerts() {
  const router = useRouter();
  const audioContext = useRef<AudioContext | null>(null);
  const soundEnabled = useRef(false);
  const [alert, setAlert] = useState<NewReservationAlert | null>(null);
  const [connection, setConnection] = useState<"connecting" | "live" | "error">("connecting");
  const [sound, setSound] = useState<"off" | "on">("off");

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
        if (soundEnabled.current && typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
          new Notification("New Sakura reservation", { body: `${nextAlert.reservationDate} at ${nextAlert.reservationTime} · ${nextAlert.guestCount} guests`, tag: nextAlert.id });
        }
        router.refresh();
      })
      .subscribe((status) => setConnection(status === "SUBSCRIBED" ? "live" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "error" : "connecting"));

    return () => {
      void client?.removeChannel(channel);
      void audioContext.current?.close();
      audioContext.current = null;
    };
  }, [router]);

  const enableSound = async () => {
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (AudioContextClass) {
      audioContext.current ??= new AudioContextClass();
      if (audioContext.current.state === "suspended") await audioContext.current.resume();
      playSakuraChime(audioContext.current);
      soundEnabled.current = true;
      setSound("on");
    }
    if (typeof Notification !== "undefined" && Notification.permission === "default") await Notification.requestPermission();
  };

  return (
    <div className="reservation-live-alerts">
      <span className={`reservation-live-status is-${connection}`}><span aria-hidden="true" />{connection === "live" ? "Live reservations" : connection === "error" ? "Live alerts offline" : "Connecting alerts"}</span>
      <button className="button button-outline reservation-alert-toggle" type="button" onClick={enableSound} disabled={sound === "on"}>
        {sound === "on" ? <Check /> : <Volume2 />}{sound === "on" ? "Sound enabled" : "Enable reservation sound"}
      </button>
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
