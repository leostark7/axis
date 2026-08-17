import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Defense-in-depth auth check for API routes. Middleware already blocks
 * unauthenticated requests, but routes should not rely solely on that —
 * a future middleware config mistake shouldn't silently expose them.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "não autenticado" }, { status: 401 }) };
  }
  return { user, response: null };
}
