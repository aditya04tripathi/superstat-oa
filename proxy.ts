import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const selectedClubId = request.cookies.get("selected_club_id")?.value
  const { pathname } = request.nextUrl

  const protectedRoutes = [
    "/dashboard",
    "/club-profile",
    "/players",
    "/training-sessions",
    "/training-attendance",
    "/videos",
    "/upload",
    "/event-types",
    "/audit",
  ]

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !selectedClubId) {
    const loginUrl = new URL("/", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
