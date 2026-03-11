import type { Metadata } from "next"
import { cookies } from "next/headers"

import { createServerClient } from "@/lib/supabase"
import TrainingAttendanceManager from "@/components/TrainingAttendanceManager"

export const metadata: Metadata = {
  title: "Training Attendance",
  description: "Track attendance logs for training sessions.",
}

export default async function TrainingAttendancePage() {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value

  if (!clubId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please log in to view attendance.</p>
      </div>
    )
  }

  const supabase = createServerClient(cookieStore)
  const [{ data: attendance }, { data: sessions }, { data: players }] =
    await Promise.all([
      supabase
        .from("training_attendance")
        .select(
          "id, club_id, session_id, player_id, status, notes, created_at, training_sessions(id, title, starts_at, session_type, club_id, created_at), players(id, name, club_id, created_at)"
        )
        .eq("club_id", clubId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("training_sessions")
        .select("id, club_id, title, session_type, starts_at, created_at")
        .eq("club_id", clubId)
        .order("starts_at", { ascending: false })
        .limit(200),
      supabase
        .from("players")
        .select("id, club_id, name, created_at")
        .eq("club_id", clubId)
        .order("name", { ascending: true }),
    ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Training Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Track player attendance across sessions.
        </p>
      </div>

      <TrainingAttendanceManager
        clubId={clubId}
        initialAttendance={(attendance ?? []) as []}
        sessions={sessions ?? []}
        players={players ?? []}
      />
    </div>
  )
}
