"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Upload,
  Video,
  Users,
  Settings,
  Shield,
  LayoutDashboard,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Video Gallery", href: "/", icon: Video },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Players", href: "/players", icon: Users },
  { name: "Event Types", href: "/event-types", icon: Settings },
  { name: "Club Profile", href: "/club-profile", icon: Shield },
]

export default function Sidebar() {
  const pathname = usePathname()

  const navContent = (
    <nav className="grid items-start px-4 text-sm font-medium">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
            {
              "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50":
                pathname === item.href,
            }
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-15 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Shield className="h-6 w-6" />
              <span>Superstat</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">{navContent}</div>
        </div>
      </div>

      <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-6 lg:hidden dark:bg-gray-800/40">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">{navContent}</SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6" />
          <span>Superstat</span>
        </Link>
      </header>
    </>
  )
}
