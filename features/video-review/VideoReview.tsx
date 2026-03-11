"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Video, Event, Player, EventType } from "@/lib/types"
import { getVideoPageData } from "./actions"
import VideoPlayer from "./VideoPlayer"
import EventTagForm from "./EventTagForm"
import EventTimeline from "./EventTimeline"
import PlayerCreateForm from "./PlayerCreateForm"
import logger from "@/lib/logger"
import { toast } from "sonner"
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
    const { data, error } = await getVideoPageData(video.id)

    if (error || !data) {
      logger.error("Error refreshing video data:", { error })
      toast.error("Failed to refresh video data")
      return
    }

    setVideo(data.video)
    setEvents(data.events)
    setPlayers(data.players)
    setEventTypes(data.eventTypes)
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
