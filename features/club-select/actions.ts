"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function setClubSession(clubId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("selected_club_id", clubId, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    path: "/",
  })
  redirect("/dashboard")
}

export async function clearClubSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("selected_club_id")
}
