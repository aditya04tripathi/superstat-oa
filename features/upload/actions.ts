"use server"

import { getServerClient, getClubId } from "@/lib/supabase"

type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function getSignedVideoUploadUrl(
  fileName: string
): Promise<ActionResult<{ signedUrl: string; path: string }>> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  const filePath = `${clubId}/${crypto.randomUUID()}-${safeName}`

  const { data, error } = await supabase.storage
    .from("videos")
    .createSignedUploadUrl(filePath)

  if (error) return { data: null, error: error.message }
  return { data: { signedUrl: data.signedUrl, path: filePath }, error: null }
}

export async function createVideoRecord(
  title: string,
  filePath: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const { data: urlData } = supabase.storage
    .from("videos")
    .getPublicUrl(filePath)

  const { data, error } = await supabase
    .from("videos")
    .insert({ title, file_url: urlData.publicUrl, club_id: clubId })
    .select("id")
    .single()

  if (error) return { data: null, error: error.message }
  return { data: { id: data.id }, error: null }
}
