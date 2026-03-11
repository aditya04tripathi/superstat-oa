import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { Suspense } from "react"
import VideoReview from "@/components/VideoReview"
import { Skeleton } from "@/components/ui/skeleton"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

async function VideoReviewData({ id }: { id: string }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single()

  if (videoError || !video) {
    notFound()
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("video_id", id)
    .order("timestamp_seconds", { ascending: true })

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true })

  const { data: eventTypes } = await supabase
    .from("event_types")
    .select("*")
    .order("name", { ascending: true })

  return (
    <VideoReview
      initialVideo={video}
      initialEvents={events || []}
      initialPlayers={players || []}
      initialEventTypes={eventTypes || []}
    />
  )
}

function VideoReviewSkeleton() {
  return (
    <div className="mx-auto space-y-4 py-10">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="aspect-video w-full rounded-lg" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-75 w-full" />
          <Skeleton className="h-100 w-full" />
        </div>
      </div>
    </div>
  )
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<VideoReviewSkeleton />}>
      <VideoReviewData id={id} />
    </Suspense>
  )
}
