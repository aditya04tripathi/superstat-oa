import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import ShellTopBar from "@/components/ShellTopBar"

export default async function SidebarLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieStore = await cookies()
  const clubId = cookieStore.get("selected_club_id")?.value

  if (!clubId) {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <AppSidebar collapsible="offcanvas" />
      <div className="h-full w-full">
        <ShellTopBar />
        <div className="mx-auto max-w-6xl px-3">{children}</div>
      </div>
    </SidebarProvider>
  )
}
