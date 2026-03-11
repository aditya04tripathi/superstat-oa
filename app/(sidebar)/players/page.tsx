import { Metadata } from "next"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import PlayersManager, { PlayerInsight } from "@/components/PlayersManager"

export const metadata: Metadata = {
  title: "Players",
  description: "Manage roster, player profiles, and team insights.",
}

export default async function PlayersPage() {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value

  if (!clubId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please log in to view players.</p>
      </div>
    )
  }

  const supabase = createServerClient(cookieStore)

  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .eq("club_id", clubId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error loading players:", error)
    return <p className="text-destructive">Error loading players.</p>
  }

  const playerIds = (players ?? []).map((player) => player.id)
  const { data: events } =
    playerIds.length > 0
      ? await supabase
          .from("events")
          .select("player_id, created_at")
          .in("player_id", playerIds)
      : { data: [] as Array<{ player_id: string | null; created_at: string }> }

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const referenceTime =
    (events ?? []).reduce((max, event) => {
      const timestamp = new Date(event.created_at).getTime()
      return timestamp > max ? timestamp : max
    }, 0) || new Date("2024-01-01T00:00:00.000Z").getTime()

  const grouped = new Map<
    string,
    { totalEvents: number; recentEvents: number; previousEvents: number }
  >()
  for (const player of players ?? []) {
    grouped.set(player.id, {
      totalEvents: 0,
      recentEvents: 0,
      previousEvents: 0,
    })
  }

  for (const event of events ?? []) {
    if (!event.player_id) continue
    const bucket = grouped.get(event.player_id)
    if (!bucket) continue
    bucket.totalEvents += 1
    const created = new Date(event.created_at).getTime()
    const delta = referenceTime - created
    if (delta <= sevenDaysMs) {
      bucket.recentEvents += 1
    } else if (delta <= sevenDaysMs * 2) {
      bucket.previousEvents += 1
    }
  }

  const insights: PlayerInsight[] = Array.from(grouped.entries()).map(
    ([playerId, value]) => ({
      playerId,
      totalEvents: value.totalEvents,
      recentEvents: value.recentEvents,
      trendDelta: value.recentEvents - value.previousEvents,
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Players</h1>
        <p className="text-sm text-muted-foreground">
          Manage roster operations, analytics, and player development tracking.
        </p>
      </div>
      <PlayersManager
        clubId={clubId}
        initialPlayers={players ?? []}
        insights={insights}
      />
    </div>
  )
}
