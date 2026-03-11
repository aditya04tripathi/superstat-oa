"use server"

import { getServerClient, getClubId } from "@/lib/supabase"
import { EventType } from "@/lib/types"

type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function createEventType(
  name: string
): Promise<ActionResult<EventType>> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const { data, error } = await supabase
    .from("event_types")
    .insert({ name, club_id: clubId })
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateEventType(
  eventTypeId: string,
  name: string
): Promise<ActionResult<EventType>> {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from("event_types")
    .update({ name })
    .eq("id", eventTypeId)
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteEventType(
  eventTypeId: string
): Promise<ActionResult> {
  const supabase = await getServerClient()

  const { error } = await supabase
    .from("event_types")
    .delete()
    .eq("id", eventTypeId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}
