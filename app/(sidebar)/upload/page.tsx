import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cookies } from "next/headers"
import VideoUploadForm from "@/features/upload/VideoUploadForm"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Upload Video",
  description: "Upload new video content",
}

export default async function UploadPage() {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value || null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload Video</h1>
        <Button asChild variant="outline">
          <Link href="/videos">View all videos</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Video Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoUploadForm clubId={clubId} />
        </CardContent>
      </Card>
    </div>
  )
}
