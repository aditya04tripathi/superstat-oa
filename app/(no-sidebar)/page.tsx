import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase"
import logger from "@/lib/logger"
import ClubSelectForm from "./ClubSelectForm"

export const metadata = {
  title: "Login",
  description: "Select your club to access the Superstat dashboard.",
}

export default async function LoginPage() {
  const cookieStore = await cookies()
  const existingClubId = cookieStore.get("selected_club_id")?.value

  if (existingClubId) {
    redirect("/dashboard")
  }

  const supabase = createServerClient(cookieStore)
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("id, name")
    .order("name", { ascending: true })

  if (error) {
    logger.error("Error fetching clubs for login:", error)
  }

  return <ClubSelectForm clubs={clubs ?? []} />
}
