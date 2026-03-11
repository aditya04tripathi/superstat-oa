import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"
import { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export type TypedSupabaseClient = SupabaseClient<Database>

let browserClient: TypedSupabaseClient | null = null
let currentClubId: string | null = null

export const createBrowserClient = (clubId: string | null): TypedSupabaseClient => {
  if (browserClient && currentClubId === clubId) {
    return browserClient
  }

  currentClubId = clubId
  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-club-id": clubId || "",
      },
    },
  })

  return browserClient
}

export const createServerClient = (cookieStore: ReadonlyRequestCookies): TypedSupabaseClient => {
  const clubId = cookieStore.get("selected_club_id")?.value
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-club-id": clubId || "",
      },
    },
  })
}
