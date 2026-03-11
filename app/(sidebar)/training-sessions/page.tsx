import type { Metadata } from "next"
import { cookies } from "next/headers"

import { createServerClient } from "@/lib/supabase"
import TrainingSessionsManager from "@/features/training-sessions/TrainingSessionsManager"

export const metadata: Metadata = {
  title: "Training Sessions",
  description: "Schedule and manage training sessions for the club.",
}

export default async function TrainingSessionsPage() {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value

  if (!clubId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please log in to view sessions.</p>
      </div>
    )
  }

  const supabase = createServerClient(cookieStore)
  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("id, club_id, title, session_type, starts_at, created_at")
    .eq("club_id", clubId)
    .order("starts_at", { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Training Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Plan training and match-prep sessions for your club.
        </p>
      </div>

      <TrainingSessionsManager
        clubId={clubId}
        initialSessions={sessions ?? []}
      />
    </div>
  )
}
