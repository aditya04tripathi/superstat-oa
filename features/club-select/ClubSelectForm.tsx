"use client"

import { useState } from "react"
import { Info } from "lucide-react"

import { setClubSession } from "./actions"

import { Club } from "@/lib/types"
import logger from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ClubSelectFormProps {
  clubs: Pick<Club, "id" | "name">[]
}

export default function ClubSelectForm({ clubs }: ClubSelectFormProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>(
    clubs[0]?.id ?? ""
  )
  const [showInfoDialog, setShowInfoDialog] = useState(false)

  const handleLogin = async () => {
    if (!selectedClubId) {
      logger.warn("Please select a club to log in.")
      return
    }

    logger.success(
      `Logged in as club: ${clubs.find((c) => c.id === selectedClubId)?.name}`
    )
    await setClubSession(selectedClubId)
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-xl items-center justify-center">
      <Card className="w-full">
        <CardHeader className="flex items-center">
          <CardTitle className="text-center">Select Your Club</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfoDialog(true)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedClubId} onValueChange={setSelectedClubId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a club" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleLogin} className="w-full">
            Login
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dummy Login Information</DialogTitle>
            <DialogDescription>
              Select any of the clubs below to simulate logging in as that club.
              The club ID will be stored in your cookies.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {clubs.map((club) => (
              <div key={club.id} className="rounded-md p-2 text-sm">
                <p className="font-semibold">{club.name}</p>
                <p className="break-all text-muted-foreground">{club.id}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
