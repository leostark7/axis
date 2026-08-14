// Standalone script (run via cron) that pushes reminders for items due soon
// and flags stale demandas, even when no browser tab is open.
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("Missing required env vars for send-push-reminders.mjs");
  process.exit(1);
}

webpush.setVapidDetails("mailto:leonardoadm7@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function sendToAll(title, body, url = "/") {
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title, body, url })
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("push error", err.statusCode, err.body);
        }
      }
    })
  );
}

async function main() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);

  const { data: items } = await supabase
    .from("items")
    .select("id, title, date, time, done")
    .eq("date", now.toISOString().slice(0, 10))
    .not("time", "is", null)
    .eq("done", false);

  for (const item of items ?? []) {
    const due = new Date(`${item.date}T${item.time}:00`);
    if (due > now && due <= windowEnd) {
      await sendToAll("Axis — daqui a pouco", `${item.title} às ${item.time}`, "/");
      console.log(`Sent reminder for item ${item.id}`);
    }
  }

  const { data: demandas } = await supabase
    .from("demandas")
    .select("id, title, due_date, status")
    .neq("status", "concluida")
    .not("due_date", "is", null)
    .eq("due_date", now.toISOString().slice(0, 10));

  for (const d of demandas ?? []) {
    await sendToAll("Axis — demanda vence hoje", d.title, "/demandas");
    console.log(`Sent due-today alert for demanda ${d.id}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
