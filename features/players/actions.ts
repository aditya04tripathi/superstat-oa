"use server"

import { revalidatePath } from "next/cache"

import { getServerClient, getClubId } from "@/lib/supabase"
import { Player } from "@/lib/types"

type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function createPlayer(payload: {
  name: string
  position?: string | null
  primary_skill?: string | null
  jersey_number?: number | null
  dominant_hand?: string | null
}): Promise<ActionResult<Player>> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const { data, error } = await supabase
    .from("players")
    .insert({ ...payload, club_id: clubId, is_active: true })
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/players")
  return { data, error: null }
}

export async function updatePlayer(
  playerId: string,
  payload: {
    name?: string
    position?: string | null
    primary_skill?: string | null
    jersey_number?: number | null
    dominant_hand?: string | null
    is_active?: boolean
  }
): Promise<ActionResult<Player>> {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from("players")
    .update(payload)
    .eq("id", playerId)
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/players")
  return { data, error: null }
}

export async function deletePlayer(playerId: string): Promise<ActionResult> {
  const supabase = await getServerClient()

  const { error } = await supabase.from("players").delete().eq("id", playerId)

  if (error) return { data: null, error: error.message }
  revalidatePath("/players")
  return { data: undefined, error: null }
}

export async function attachTag(
  tagId: string,
  playerId: string
): Promise<ActionResult> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const { error } = await supabase.from("player_tags").insert({
    club_id: clubId,
    player_id: playerId,
    tag_id: tagId,
  })

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}

export async function createAndAttachTag(
  playerId: string,
  tagName: string,
  tagCategory: string | null
): Promise<ActionResult> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .insert({ club_id: clubId, name: tagName, category: tagCategory })
    .select("id")
    .single()

  if (tagError || !tag)
    return { data: null, error: tagError?.message ?? "Could not create tag." }

  const { error: attachError } = await supabase.from("player_tags").insert({
    club_id: clubId,
    player_id: playerId,
    tag_id: tag.id,
  })

  if (attachError) return { data: null, error: attachError.message }
  return { data: undefined, error: null }
}

export async function removeTag(playerTagId: string): Promise<ActionResult> {
  const supabase = await getServerClient()

  const { error } = await supabase
    .from("player_tags")
    .delete()
    .eq("id", playerTagId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}
