"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"
import { Video, Event, Player, EventType } from "@/lib/types"
import VideoPlayer from "@/components/VideoPlayer"
import EventTagForm from "@/components/EventTagForm"
import EventTimeline from "@/components/EventTimeline"
import PlayerCreateForm from "@/components/PlayerCreateForm"
import logger from "@/lib/logger"
import { toast } from "sonner"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

interface VideoReviewProps {
  initialVideo: Video
  initialEvents: Event[]
  initialPlayers: Player[]
  initialEventTypes: EventType[]
}

export default function VideoReview({
  initialVideo,
  initialEvents,
  initialPlayers,
  initialEventTypes,
}: VideoReviewProps) {
  const [video, setVideo] = useState<Video>(initialVideo)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [eventTypes, setEventTypes] = useState<EventType[]>(initialEventTypes)
  const playerRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const fetchVideoData = async () => {
    const clubId = Cookies.get("selected_club_id") || null
    const supabase = createBrowserClient(clubId)

    const [
      { data: videoData, error: videoError },
      { data: eventsData, error: eventsError },
      { data: playersData, error: playersError },
      { data: eventTypesData, error: eventTypesError },
    ] = await Promise.all([
      supabase.from("videos").select("*").eq("id", video.id).single(),
      supabase
        .from("events")
        .select("*")
        .eq("video_id", video.id)
        .order("timestamp_seconds", { ascending: true }),
      supabase.from("players").select("*").order("name", { ascending: true }),
      supabase
        .from("event_types")
        .select("*")
        .order("name", { ascending: true }),
    ])

    if (videoError) {
      logger.error("Error fetching video:", { error: videoError })
      toast.error("Failed to refresh video")
    } else {
      setVideo(videoData)
    }

    if (eventsError) {
      logger.error("Error fetching events:", { error: eventsError })
      toast.error("Failed to refresh events")
    } else {
      setEvents(eventsData || [])
    }

    if (playersError) {
      logger.error("Error fetching players:", { error: playersError })
      toast.error("Failed to refresh players")
    } else {
      setPlayers(playersData || [])
    }

    if (eventTypesError) {
      logger.error("Error fetching event types:", { error: eventTypesError })
      toast.error("Failed to refresh event types")
    } else {
      setEventTypes(eventTypesData || [])
    }
  }

  const handleEventSaved = () => {
    fetchVideoData()
  }

  const handlePlayerCreated = (player: Player) => {
    setPlayers([...players, player])
  }

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = seconds
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextTime = playerRef.current?.currentTime
      if (typeof nextTime === "number" && !Number.isNaN(nextTime)) {
        setCurrentTime(nextTime)
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/videos">
              <ChevronLeft className="mr-1 size-4" />
              Videos
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {video.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Tag events at exact timestamps. Click timeline rows to seek.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <VideoPlayer
              url={video.file_url}
              playerRef={playerRef as React.RefObject<HTMLVideoElement>}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current</span>
              <span className="font-mono">{currentTime.toFixed(2)}s</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Tag Event</CardTitle>
            </CardHeader>
            <CardContent>
              <EventTagForm
                videoId={video.id}
                players={players}
                eventTypes={eventTypes}
                getCurrentTime={() => playerRef.current?.currentTime || 0}
                onEventSaved={handleEventSaved}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EventTimeline
                events={events}
                players={players}
                eventTypes={eventTypes}
                onSeek={handleSeek}
                currentTime={currentTime}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Quick Add Player</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerCreateForm onPlayerCreated={handlePlayerCreated} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
