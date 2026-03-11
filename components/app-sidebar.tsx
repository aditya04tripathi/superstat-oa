"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Video,
  Film,
  LogOut,
  Users,
  Building2,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { createBrowserClient } from "@/lib/supabase"
import logger from "@/lib/logger"
import Cookies from "js-cookie"

export function AppSidebar({
  collapsible,
}: {
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const pathname = usePathname()

  const handleLogout = async () => {
    const clubId = Cookies.get("selected_club_id")
    Cookies.remove("selected_club_id")

    await createBrowserClient(clubId || null).auth.signOut()
    logger.info("Logged out successfully.")
    window.location.href = "/"
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Club Profile",
      href: "/club-profile",
      icon: Building2,
      current: pathname === "/club-profile",
    },
    {
      name: "Players",
      href: "/players",
      icon: Users,
      current: pathname === "/players",
    },
    {
      name: "Videos",
      href: "/videos",
      icon: Film,
      current: pathname === "/videos",
    },
    {
      name: "Upload Video",
      href: "/upload",
      icon: Video,
      current: pathname === "/upload",
    },
    {
      name: "Event Types",
      href: "/event-types",
      icon: Calendar,
      current: pathname === "/event-types",
    },
    {
      name: "Training Sessions",
      href: "/training-sessions",
      icon: ClipboardList,
      current: pathname === "/training-sessions",
    },
    {
      name: "Attendance",
      href: "/training-attendance",
      icon: ListChecks,
      current: pathname === "/training-attendance",
    },
    {
      name: "Audit",
      href: "/audit",
      icon: ClipboardCheck,
      current: pathname === "/audit",
    },
  ]

  return (
    <Sidebar collapsible={collapsible} className="bg-sidebar">
      <SidebarHeader className="flex h-14 items-center justify-center">
        <Link
          href="/dashboard"
          className="flex items-center justify-between gap-2 text-center"
        >
          <span className="w-full text-center text-lg font-semibold uppercase">
            SuperStat
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={item.current}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
