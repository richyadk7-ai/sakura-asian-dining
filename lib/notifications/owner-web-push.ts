import "server-only";
import { createClient } from "@supabase/supabase-js";
import webPush from "web-push";
import { z } from "zod";
import { supabaseEnvironment } from "@/lib/supabase/config";
import type { ReservationConfirmation } from "@/types";

const targetSchema = z.array(z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
}));

function configuration() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT;
  const dispatchSecret = process.env.PUSH_DISPATCH_SECRET;
  if (!publicKey || !privateKey || !subject || !dispatchSecret) return null;
  if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) return null;
  return { publicKey, privateKey, subject, dispatchSecret };
}

export async function sendOwnerReservationPush(reservation: ReservationConfirmation) {
  const config = configuration();
  if (!config) return { sent: 0, reason: "Web Push is not configured." };

  const { url, key } = supabaseEnvironment();
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.rpc("get_owner_push_targets", { p_dispatch_secret: config.dispatchSecret });
  if (error) {
    console.error("Owner Web Push target lookup failed", { code: error.code, message: error.message });
    return { sent: 0, reason: "Push targets unavailable." };
  }
  const targets = targetSchema.safeParse(data);
  if (!targets.success || targets.data.length === 0) return { sent: 0, reason: "No subscribed owner devices." };

  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const payload = JSON.stringify({
    title: "New Sakura reservation",
    body: `${reservation.reservationDate} at ${reservation.reservationTime} · ${reservation.guestCount} guests · ${reservation.reservationReference}`,
    tag: reservation.reservationReference,
  });
  const results = await Promise.allSettled(targets.data.map(async (target) => {
    try {
      await webPush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, payload, {
        TTL: 300,
        urgency: "high",
        topic: reservation.reservationReference.slice(-32),
      });
      return true;
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        await client.rpc("delete_stale_push_target", { p_dispatch_secret: config.dispatchSecret, p_endpoint: target.endpoint });
      } else {
        console.error("Owner Web Push delivery failed", { statusCode });
      }
      return false;
    }
  }));
  return { sent: results.filter((result) => result.status === "fulfilled" && result.value).length };
}
