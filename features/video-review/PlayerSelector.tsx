"use client"

import React from "react"
import { Player } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PlayerSelectorProps {
  players: Player[]
  value: string | null
  onChange: (playerId: string | null) => void
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  value,
  onChange,
}) => {
  return (
    <Select
      onValueChange={(selectedValue) =>
        onChange(selectedValue === "none" ? null : selectedValue)
      }
      value={value || ""}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a player" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {players.map((player) => (
          <SelectItem key={player.id} value={player.id}>
            {player.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default PlayerSelector
