import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase"
import VideoReview from "@/components/VideoReview"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VideoTagPage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single()

  if (videoError || !video) notFound()

  const [{ data: events }, { data: players }, { data: eventTypes }] = await Promise.all([
    supabase.from("events").select("*").eq("video_id", id).order("timestamp_seconds", { ascending: true }),
    supabase.from("players").select("*").order("name", { ascending: true }),
    supabase.from("event_types").select("*").order("name", { ascending: true }),
  ])

  return (
    <VideoReview
      initialVideo={video}
      initialEvents={events ?? []}
      initialPlayers={players ?? []}
      initialEventTypes={eventTypes ?? []}
    />
  )
}

