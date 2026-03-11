"use client"

import { create } from "zustand"
import type { Player } from "@/lib/types"

type PlayerDialogMode = "create" | "edit"

interface UiShellState {
  playerDialogOpen: boolean
  playerDialogMode: PlayerDialogMode
  playerDialogPlayer: Player | null
  playerDialogKey: number
  openPlayerCreate: () => void
  openPlayerEdit: (player: Player) => void
  closePlayerDialog: () => void
  clubEditOpen: boolean
  openClubEdit: () => void
  closeClubEdit: () => void
}

export const titleFromPath = (pathname: string) => {
  if (pathname.startsWith("/players/")) return "Player Details"
  if (pathname.startsWith("/players")) return "Players"
  if (pathname.startsWith("/club-profile")) return "Club Profile"
  if (pathname.startsWith("/event-types")) return "Event Types"
  if (pathname.startsWith("/training-sessions")) return "Training Sessions"
  if (pathname.startsWith("/training-attendance")) return "Training Attendance"
  if (pathname.startsWith("/videos/")) return "Video Tagging"
  if (pathname.startsWith("/videos")) return "Videos"
  if (pathname.startsWith("/upload")) return "Upload Video"
  if (pathname.startsWith("/audit")) return "Audit"
  if (pathname.startsWith("/dashboard")) return "Dashboard"
  return "Superstat"
}

export const useUiShellStore = create<UiShellState>((set) => ({
  playerDialogOpen: false,
  playerDialogMode: "create",
  playerDialogPlayer: null,
  playerDialogKey: 0,
  clubEditOpen: false,
  openPlayerCreate: () =>
    set((state) => ({
      playerDialogOpen: true,
      playerDialogMode: "create",
      playerDialogPlayer: null,
      playerDialogKey: state.playerDialogKey + 1,
    })),
  openPlayerEdit: (player) =>
    set((state) => ({
      playerDialogOpen: true,
      playerDialogMode: "edit",
      playerDialogPlayer: player,
      playerDialogKey: state.playerDialogKey + 1,
    })),
  closePlayerDialog: () =>
    set({
      playerDialogOpen: false,
      playerDialogPlayer: null,
    }),
  openClubEdit: () => set({ clubEditOpen: true }),
  closeClubEdit: () => set({ clubEditOpen: false }),
}))
