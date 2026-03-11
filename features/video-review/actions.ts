"use server"

import { getServerClient, getClubId } from "@/lib/supabase"
import { Event, EventType, Player, Video } from "@/lib/types"

type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function createEvent(payload: {
  video_id: string
  player_id: string | null
  event_type_id: string
  timestamp_seconds: number
}): Promise<ActionResult<Event>> {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getVideoPageData(videoId: string): Promise<
  ActionResult<{
    video: Video
    events: Event[]
    players: Player[]
    eventTypes: EventType[]
  }>
> {
  const supabase = await getServerClient()
  const clubId = await getClubId()
  if (!clubId) return { data: null, error: "No club selected." }

  const [
    { data: video, error: videoError },
    { data: events },
    { data: players },
    { data: eventTypes },
  ] = await Promise.all([
    supabase.from("videos").select("*").eq("id", videoId).single(),
    supabase
      .from("events")
      .select("*")
      .eq("video_id", videoId)
      .order("timestamp_seconds", { ascending: true }),
    supabase.from("players").select("*").order("name", { ascending: true }),
    supabase.from("event_types").select("*").order("name", { ascending: true }),
  ])

  if (videoError || !video) {
    return { data: null, error: videoError?.message ?? "Video not found." }
  }

  return {
    data: {
      video,
      events: events ?? [],
      players: players ?? [],
      eventTypes: eventTypes ?? [],
    },
    error: null,
  }
}
