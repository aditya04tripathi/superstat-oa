"use client"

import { useEffect, useMemo, useRef } from "react"

import { Event, Player, EventType } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

export default function EventTimeline({
  events,
  players,
  eventTypes,
  onSeek,
  currentTime,
}: {
  events: Event[]
  players: Player[]
  eventTypes: EventType[]
  onSeek: (seconds: number) => void
  currentTime: number
}) {
  const rowsRef = useRef(new Map<string, HTMLTableRowElement>())

  const activeId = useMemo(() => {
    if (events.length === 0) return null
    let lo = 0
    let hi = events.length - 1
    let best = -1
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const t = events[mid]?.timestamp_seconds ?? 0
      if (t <= currentTime) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return best >= 0 ? events[best].id : null
  }, [events, currentTime])

  useEffect(() => {
    if (!activeId) return
    const row = rowsRef.current.get(activeId)
    row?.scrollIntoView({ block: "nearest" })
  }, [activeId])

  const playerById = useMemo(
    () => new Map(players.map((player) => [player.id, player.name])),
    [players]
  )
  const eventTypeById = useMemo(
    () => new Map(eventTypes.map((type) => [type.id, type.name])),
    [eventTypes]
  )

  return (
    <div className="max-h-80 overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="w-24">Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="w-20 text-right">Seek</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length > 0 ? (
            events.map((event) => (
              <TableRow
                key={event.id}
                ref={(node) => {
                  if (node) rowsRef.current.set(event.id, node)
                  else rowsRef.current.delete(event.id)
                }}
                className={event.id === activeId ? "bg-muted" : undefined}
              >
                <TableCell className="font-mono text-xs">
                  {formatTime(event.timestamp_seconds)}
                </TableCell>
                <TableCell>
                  {event.event_type_id
                    ? (eventTypeById.get(event.event_type_id) ?? "—")
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {event.player_id
                    ? (playerById.get(event.player_id) ?? "—")
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSeek(event.timestamp_seconds)}
                  >
                    Jump
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No tagged events yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
