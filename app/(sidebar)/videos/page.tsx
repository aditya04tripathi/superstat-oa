import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"

import { createServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Videos",
  description: "Browse uploaded videos and tag events by timestamp.",
}

export default async function VideosPage() {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value

  if (!clubId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please log in to view videos.</p>
      </div>
    )
  }

  const supabase = createServerClient(cookieStore)
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, created_at")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          <p className="text-sm text-muted-foreground">
            Open a video to tag events by timestamp.
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">Upload Video</Link>
        </Button>
      </div>

      <div className="rounded-none border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-40">Uploaded</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(videos ?? []).length > 0 ? (
              (videos ?? []).map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>
                    {new Date(video.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" asChild>
                      <Link href={`/videos/${video.id}`}>Tag</Link>
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
                  No videos yet. Upload one to start tagging.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
