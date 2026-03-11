"use server"

import { getServerClient, getClubId } from "@/lib/supabase"
import { TrainingSession } from "@/lib/types"

type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function createTrainingSession(payload: {
  title: string
  session_type: string
  starts_at: string
}): Promise<ActionResult<TrainingSession>> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const { data, error } = await supabase
    .from("training_sessions")
    .insert({ ...payload, club_id: clubId })
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateTrainingSession(
  sessionId: string,
  payload: {
    title?: string
    session_type?: string
    starts_at?: string
  }
): Promise<ActionResult<TrainingSession>> {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from("training_sessions")
    .update(payload)
    .eq("id", sessionId)
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteTrainingSession(
  sessionId: string
): Promise<ActionResult> {
  const supabase = await getServerClient()

  const { error } = await supabase
    .from("training_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}
