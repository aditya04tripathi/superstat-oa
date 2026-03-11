import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import { Database } from "./database.types"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export type TypedSupabaseClient = SupabaseClient<Database>

export const createServerClient = (
  cookieStore: ReadonlyRequestCookies
): TypedSupabaseClient => {
  const clubId = cookieStore.get("selected_club_id")?.value
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-club-id": clubId || "",
      },
    },
  })
}

export async function getServerClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies()
  return createServerClient(cookieStore)
}

export async function getClubId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("selected_club_id")?.value ?? null
}
