import { Metadata } from "next"
import { cookies } from "next/headers"
import EventTypeManager from "@/features/event-types/EventTypeManager"
import { createServerClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Event Types",
  description: "Manage event taxonomy for player tagging and analytics.",
}

export default async function EventTypesPage() {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value || null
  const supabase = createServerClient(cookieStore)
  const { data: initialEventTypes } = clubId
    ? await supabase.from("event_types").select("*").eq("club_id", clubId)
    : { data: [] }
  const { data: events } =
    clubId && (initialEventTypes?.length ?? 0) > 0
      ? await supabase
          .from("events")
          .select("event_type_id, created_at")
          .in(
            "event_type_id",
            (initialEventTypes ?? []).map((item) => item.id)
          )
      : {
          data: [] as Array<{
            event_type_id: string | null
            created_at: string
          }>,
        }

  const activationMap = new Map<
    string,
    { count: number; lastActivatedAt: string | null }
  >()
  for (const eventType of initialEventTypes ?? []) {
    activationMap.set(eventType.id, { count: 0, lastActivatedAt: null })
  }

  for (const event of events ?? []) {
    if (!event.event_type_id) continue
    const existing = activationMap.get(event.event_type_id)
    if (!existing) continue
    const previousTs = existing.lastActivatedAt
      ? new Date(existing.lastActivatedAt).getTime()
      : 0
    const currentTs = new Date(event.created_at).getTime()
    activationMap.set(event.event_type_id, {
      count: existing.count + 1,
      lastActivatedAt:
        currentTs > previousTs ? event.created_at : existing.lastActivatedAt,
    })
  }

  const analyticsRows = (initialEventTypes ?? [])
    .map((eventType) => {
      const metrics = activationMap.get(eventType.id) ?? {
        count: 0,
        lastActivatedAt: null,
      }
      return {
        id: eventType.id,
        name: eventType.name,
        activations: metrics.count,
        lastActivatedAt: metrics.lastActivatedAt,
      }
    })
    .sort(
      (a, b) => b.activations - a.activations || a.name.localeCompare(b.name)
    )

  const totalActivations = analyticsRows.reduce(
    (sum, row) => sum + row.activations,
    0
  )
  const topEvent = analyticsRows[0]
  const activeEventTypes = analyticsRows.filter(
    (row) => row.activations > 0
  ).length
  const activationCounts = Object.fromEntries(
    analyticsRows.map((row) => [row.id, row.activations])
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Event Types</h1>
        <p className="text-sm text-muted-foreground">
          Configure event categories used by coaches during tagging.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Activations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalActivations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Used Event Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {topEvent?.name ?? "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {topEvent
                ? `${topEvent.activations} activations`
                : "No event data yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Event Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activeEventTypes}</div>
            <p className="text-xs text-muted-foreground">
              {(initialEventTypes ?? []).length} configured total
            </p>
          </CardContent>
        </Card>
      </div>

      <EventTypeManager
        clubId={clubId}
        initialEventTypes={initialEventTypes ?? []}
        activationCounts={activationCounts}
      />
    </div>
  )
}
