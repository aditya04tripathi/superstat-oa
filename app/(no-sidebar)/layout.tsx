import type { ReactNode } from "react"

export default function NoSidebarLayout({ children }: { children: ReactNode }) {
  return <div className="h-full w-full">{children}</div>
}
