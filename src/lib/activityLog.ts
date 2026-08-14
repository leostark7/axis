import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type ActivityEntityType = "item" | "demanda" | "cliente";

export async function logActivity(
  verb: string,
  entityType: ActivityEntityType,
  entityTitle: string,
  entityId?: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("activity_log").insert({
    actor_id: user?.id ?? null,
    verb,
    entity_type: entityType,
    entity_title: entityTitle,
    entity_id: entityId ?? null,
  });
}
