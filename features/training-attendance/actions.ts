"use server"

import { getServerClient, getClubId } from "@/lib/supabase"
import { TrainingAttendance, TrainingSession } from "@/lib/types"

type PlayerOption = { id: string; name: string }

export type AttendanceWithRelations = TrainingAttendance & {
  training_sessions?: TrainingSession | null
  players?: PlayerOption | null
}

type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function createAttendance(payload: {
  session_id: string
  player_id: string
  status: string
  notes?: string | null
}): Promise<ActionResult<AttendanceWithRelations>> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const { data, error } = await supabase
    .from("training_attendance")
    .insert({ ...payload, notes: payload.notes ?? null, club_id: clubId })
    .select("*, training_sessions(*), players(*)")
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as AttendanceWithRelations, error: null }
}

export async function updateAttendance(
  attendanceId: string,
  payload: {
    session_id?: string
    player_id?: string
    status?: string
    notes?: string | null
  }
): Promise<ActionResult<AttendanceWithRelations>> {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from("training_attendance")
    .update(payload)
    .eq("id", attendanceId)
    .select("*, training_sessions(*), players(*)")
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as AttendanceWithRelations, error: null }
}

export async function deleteAttendance(
  attendanceId: string
): Promise<ActionResult> {
  const supabase = await getServerClient()

  const { error } = await supabase
    .from("training_attendance")
    .delete()
    .eq("id", attendanceId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}
