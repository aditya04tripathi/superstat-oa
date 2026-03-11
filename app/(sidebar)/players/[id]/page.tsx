import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { notFound } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import PlayerTagManager from "@/components/PlayerTagManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface PageProps {
  params: Promise<{ id: string }>
}

const PlayerCharts = dynamic(() => import("@/components/PlayerCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-70 w-full" />
      <Skeleton className="h-70 w-full" />
      <Skeleton className="h-75 w-full md:col-span-2" />
    </div>
  ),
})

async function PlayerAnalytics({ id }: { id: string }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single()

  if (playerError || !player) {
    notFound()
  }

  const playerClubId = player.club_id
  if (!playerClubId) {
    notFound()
  }

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, player_id, event_type_id, timestamp_seconds, created_at, event_types(name)"
    )
    .eq("player_id", id)
    .order("created_at", { ascending: false })

  if (eventsError) {
    console.error("Error fetching player events:", eventsError)
  }

  const distributionMap = new Map<string, number>()
  for (const event of events ?? []) {
    const typeName =
      typeof event.event_types === "object" &&
      event.event_types &&
      "name" in event.event_types &&
      typeof event.event_types.name === "string"
        ? event.event_types.name
        : "Unknown"
    distributionMap.set(typeName, (distributionMap.get(typeName) ?? 0) + 1)
  }

  const distributionData = Array.from(distributionMap.entries()).map(
    ([name, value]) => ({
      name,
      value,
    })
  )

  const now =
    (events ?? []).reduce((max, event) => {
      const timestamp = new Date(event.created_at).getTime()
      return timestamp > max ? timestamp : max
    }, 0) || new Date("2024-01-01T00:00:00.000Z").getTime()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const trendData = Array.from({ length: 6 }).map((_, index) => {
    const end = now - weekMs * (5 - index)
    const start = end - weekMs
    const value = (events ?? []).filter((event) => {
      const createdAt = new Date(event.created_at).getTime()
      return createdAt >= start && createdAt < end
    }).length
    return { label: `W${index + 1}`, value }
  })

  const { data: clubPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("club_id", playerClubId)

  const clubPlayerIds = (clubPlayers ?? []).map((clubPlayer) => clubPlayer.id)

  const { data: clubEvents } =
    clubPlayerIds.length > 0
      ? await supabase
          .from("events")
          .select("player_id, event_type_id, created_at")
          .in("player_id", clubPlayerIds)
      : {
          data: [] as Array<{
            player_id: string | null
            event_type_id: string | null
            created_at: string
          }>,
        }

  const totalEvents = (events ?? []).length
  const teamAvgEvents =
    clubPlayerIds.length > 0
      ? (clubEvents?.length ?? 0) / clubPlayerIds.length
      : 0

  const recentPlayerEvents = (events ?? []).filter(
    (event) => now - new Date(event.created_at).getTime() <= weekMs
  ).length
  const recentTeamEvents = (clubEvents ?? []).filter(
    (event) => now - new Date(event.created_at).getTime() <= weekMs
  ).length
  const teamAvgRecent =
    clubPlayerIds.length > 0 ? recentTeamEvents / clubPlayerIds.length : 0

  const playerEventTypeCount = new Map<string, number>()
  const teamEventTypeCount = new Map<string, number>()
  for (const event of events ?? []) {
    if (!event.event_type_id) continue
    playerEventTypeCount.set(
      event.event_type_id,
      (playerEventTypeCount.get(event.event_type_id) ?? 0) + 1
    )
  }
  for (const event of clubEvents ?? []) {
    if (!event.event_type_id) continue
    teamEventTypeCount.set(
      event.event_type_id,
      (teamEventTypeCount.get(event.event_type_id) ?? 0) + 1
    )
  }

  const { data: eventTypes } = await supabase
    .from("event_types")
    .select("id, name")
    .eq("club_id", playerClubId)

  const comparisonData = (eventTypes ?? []).slice(0, 6).map((eventType) => ({
    metric: eventType.name,
    player: playerEventTypeCount.get(eventType.id) ?? 0,
    teamAverage:
      clubPlayerIds.length > 0
        ? (teamEventTypeCount.get(eventType.id) ?? 0) / clubPlayerIds.length
        : 0,
  }))

  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, category")
    .eq("club_id", playerClubId)
    .order("name", { ascending: true })

  const { data: playerTags } = await supabase
    .from("player_tags")
    .select("id, player_id, tag_id, club_id")
    .eq("player_id", player.id)

  const { data: sessions } = await supabase
    .from("training_attendance")
    .select(
      "id, status, notes, created_at, training_sessions(title, starts_at)"
    )
    .eq("player_id", player.id)
    .order("created_at", { ascending: false })
    .limit(20)

  const attendanceSummary = (sessions ?? []).reduce(
    (acc, session) => {
      const status = session.status.toLowerCase()
      if (status === "present") acc.present += 1
      if (status === "absent") acc.absent += 1
      if (status === "late") acc.late += 1
      return acc
    },
    { present: 0, absent: 0, late: 0 }
  )

  const recentActivity = (events ?? []).slice(0, 12)

  const position = player.position ?? "Unassigned"
  const primarySkill = player.primary_skill ?? "Unspecified"
  const dominantHand = player.dominant_hand ?? "Unspecified"

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
        <p className="text-muted-foreground">
          Position {position} · Primary Skill {primarySkill} · Dominant Hand{" "}
          {dominantHand}
        </p>
      </div>
      <div className="flex items-center justify-between gap-5">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Avg Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamAvgEvents.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPlayerEvents}</div>
            <p className="text-xs text-muted-foreground">
              Team avg {teamAvgRecent.toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceSummary.present}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceSummary.absent} absent · {attendanceSummary.late} late
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs className="flex flex-col" defaultValue="insights">
        <TabsList className="flex w-full gap-5">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <PlayerCharts
            distributionData={distributionData}
            trendData={trendData}
            comparisonData={comparisonData}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Event Participation</CardTitle>
              <CardDescription>
                Latest tagged events and timestamps.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          {event.timestamp_seconds.toFixed(2)}s
                        </TableCell>
                        <TableCell>
                          {typeof event.event_types === "object" &&
                          event.event_types &&
                          "name" in event.event_types
                            ? String(event.event_types.name)
                            : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {new Date(event.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No activity yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Training Participation</CardTitle>
              <CardDescription>
                Attendance records across training sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sessions ?? []).length > 0 ? (
                    (sessions ?? []).map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {typeof session.training_sessions === "object" &&
                          session.training_sessions &&
                          "title" in session.training_sessions
                            ? String(session.training_sessions.title)
                            : "Training Session"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              session.status === "present"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(session.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No attendance records yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tagging and Classification</CardTitle>
              <CardDescription>
                Organize players by strengths, role fit, and coaching focus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlayerTagManager
                clubId={playerClubId}
                playerId={player.id}
                allTags={tags ?? []}
                playerTags={playerTags ?? []}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PlayerAnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="h-75">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="mx-auto py-10">
      <Suspense fallback={<PlayerAnalyticsSkeleton />}>
        <PlayerAnalytics id={id} />
      </Suspense>
    </div>
  )
}
