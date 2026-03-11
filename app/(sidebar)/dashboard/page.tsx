import { Metadata } from "next"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Users, Calendar, Activity, TrendingUp } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your club's statistics",
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value

  if (!clubId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          Please log in to view the dashboard.
        </p>
      </div>
    )
  }

  const supabase = createServerClient(cookieStore)
  const [
    { count: videoCount },
    { count: playerCount },
    { count: eventTypeCount },
    { data: players },
    { data: eventTypes },
    { data: recentVideos },
  ] = await Promise.all([
    supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId),
    supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId),
    supabase
      .from("event_types")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId),
    supabase.from("players").select("id, name").eq("club_id", clubId),
    supabase.from("event_types").select("id, name").eq("club_id", clubId),
    supabase
      .from("videos")
      .select("id, title, created_at")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  const playerIds = (players ?? []).map((player) => player.id)
  const { data: events } =
    playerIds.length > 0
      ? await supabase
          .from("events")
          .select("id, player_id, event_type_id, created_at")
          .in("player_id", playerIds)
      : {
          data: [] as Array<{
            id: string
            player_id: string | null
            event_type_id: string | null
            created_at: string
          }>,
        }

  const totalEvents = (events ?? []).length
  const referenceTime =
    (events ?? []).reduce((max, event) => {
      const timestamp = new Date(event.created_at).getTime()
      return timestamp > max ? timestamp : max
    }, 0) || new Date("2024-01-01T00:00:00.000Z").getTime()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  const recentEvents = (events ?? []).filter(
    (event) => referenceTime - new Date(event.created_at).getTime() <= weekMs
  ).length

  const eventsByPlayer = new Map<string, number>()
  const eventsByType = new Map<string, number>()
  for (const event of events ?? []) {
    if (event.player_id) {
      eventsByPlayer.set(
        event.player_id,
        (eventsByPlayer.get(event.player_id) ?? 0) + 1
      )
    }
    if (event.event_type_id) {
      eventsByType.set(
        event.event_type_id,
        (eventsByType.get(event.event_type_id) ?? 0) + 1
      )
    }
  }

  const topPlayers = (players ?? [])
    .map((player) => ({
      id: player.id,
      name: player.name,
      activations: eventsByPlayer.get(player.id) ?? 0,
    }))
    .sort((a, b) => b.activations - a.activations)
    .slice(0, 5)

  const topEventTypes = (eventTypes ?? [])
    .map((eventType) => ({
      id: eventType.id,
      name: eventType.name,
      activations: eventsByType.get(eventType.id) ?? 0,
    }))
    .sort((a, b) => b.activations - a.activations)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of club activity, usage trends, and top performers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Videos
            </CardTitle>
            <Video className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videoCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Players
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Event Types
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventTypeCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 7 Days
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEvents}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Activations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEventTypes.length > 0 ? (
                  topEventTypes.map((eventType) => (
                    <TableRow key={eventType.id}>
                      <TableCell>{eventType.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            eventType.activations > 0 ? "secondary" : "outline"
                          }
                        >
                          {eventType.activations}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      No event data yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Players by Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPlayers.length > 0 ? (
                  topPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>{player.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            player.activations > 0 ? "secondary" : "outline"
                          }
                        >
                          {player.activations}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      No player activity yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Videos</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/videos">View all videos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-none border-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-40">Uploaded</TableHead>
                  <TableHead className="w-32 text-right">Tag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentVideos ?? []).length > 0 ? (
                  (recentVideos ?? []).map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">
                        {video.title}
                      </TableCell>
                      <TableCell>
                        {new Date(video.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href={`/videos/${video.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No videos yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
