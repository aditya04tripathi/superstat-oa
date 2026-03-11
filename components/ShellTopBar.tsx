"use client"

import { usePathname } from "next/navigation"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { titleFromPath } from "@/lib/ui-shell-store"

export default function ShellTopBar() {
  const pathname = usePathname()
  const pageTitle = titleFromPath(pathname)

  return (
    <div className="flex h-14 items-center gap-3 px-3">
      <SidebarTrigger size="lg" />
      <span className="text-sm font-medium text-muted-foreground">
        {pageTitle}
      </span>
    </div>
  )
}
