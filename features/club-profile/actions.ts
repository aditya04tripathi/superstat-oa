"use server"

import { cookies } from "next/headers"
import { getServerClient, getClubId } from "@/lib/supabase"

type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function getSignedLogoUploadUrl(
  fileName: string
): Promise<ActionResult<{ signedUrl: string; path: string }>> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  const filePath = `${clubId}/${crypto.randomUUID()}-${safeName}`

  const { data, error } = await supabase.storage
    .from("club-logos")
    .createSignedUploadUrl(filePath)

  if (error) return { data: null, error: error.message }
  return { data: { signedUrl: data.signedUrl, path: filePath }, error: null }
}

export async function getLogoPublicUrl(filePath: string): Promise<string> {
  const supabase = await getServerClient()
  const { data } = supabase.storage.from("club-logos").getPublicUrl(filePath)
  return data.publicUrl
}

export async function updateClub(payload: {
  name: string
  description: string | null
  contact_email: string | null
  logo_url: string | null
}): Promise<ActionResult> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const { error } = await supabase
    .from("clubs")
    .update(payload)
    .eq("id", clubId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}

export async function clearClubCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("selected_club_id")
}
