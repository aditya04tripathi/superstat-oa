import { Metadata } from "next"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { Suspense } from "react"

import ClubProfilePanel from "@/features/club-profile/ClubProfilePanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Club Profile",
  description: "Manage profile, branding, and contact details for your club.",
}

async function ClubProfileContent({ clubId }: { clubId: string }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { data: club, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .single()

  if (error) {
    console.error("Error fetching club profile:", error)
    return <p className="text-destructive">Error loading club profile.</p>
  }

  if (!club) {
    return <p className="text-muted-foreground">Club not found.</p>
  }

  return <ClubProfilePanel club={club} />
}

function ClubProfileSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Club Information</CardTitle>
        <Skeleton className="h-8 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ClubProfilePage() {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value

  if (!clubId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          Please log in to view your club profile.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Club Profile</h1>
        <p className="text-sm text-muted-foreground">
          Brand and contact settings for your club workspace.
        </p>
      </div>

      <Suspense fallback={<ClubProfileSkeleton />}>
        <ClubProfileContent clubId={clubId} />
      </Suspense>
    </div>
  )
}
