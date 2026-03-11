"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createPlayer, updatePlayer, deletePlayer } from "./actions"
import { Player } from "@/lib/types"
import { useUiShellStore } from "@/lib/ui-shell-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

const playerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Player name must have at least 2 characters."),
  position: z.string().optional(),
  primary_skill: z.string().optional(),
  jersey_number: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : null))
    .refine(
      (value) =>
        value === null ||
        (Number.isInteger(value) && value >= 0 && value <= 99),
      "Jersey number must be between 0 and 99."
    ),
  dominant_hand: z.string().optional(),
})

type PlayerFormInput = z.input<typeof playerFormSchema>
type PlayerFormOutput = z.output<typeof playerFormSchema>

export interface PlayerInsight {
  playerId: string
  totalEvents: number
  recentEvents: number
  trendDelta: number
}

interface PlayersManagerProps {
  clubId: string
  initialPlayers: Player[]
  insights: PlayerInsight[]
}

const POSITIONS = ["PG", "SG", "SF", "PF", "C"]
const DOMINANT_HANDS = ["Right", "Left", "Ambidextrous"]

function PlayerDialogForm({
  clubId,
  mode,
  player,
  onSaved,
  onClose,
}: {
  clubId: string
  mode: "create" | "edit"
  player: Player | null
  onSaved: () => Promise<void>
  onClose: () => void
}) {
  const [isSaving, setIsSaving] = useState(false)
  const form = useForm<PlayerFormInput, unknown, PlayerFormOutput>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: player?.name ?? "",
      position: player?.position ?? "",
      primary_skill: player?.primary_skill ?? "",
      jersey_number:
        player?.jersey_number !== null && player?.jersey_number !== undefined
          ? String(player.jersey_number)
          : "",
      dominant_hand: player?.dominant_hand ?? "",
    },
  })

  const onSubmit = async (values: PlayerFormOutput) => {
    setIsSaving(true)
    const payload = {
      name: values.name,
      position: values.position || null,
      primary_skill: values.primary_skill || null,
      jersey_number: values.jersey_number,
      dominant_hand: values.dominant_hand || null,
    }

    if (mode === "edit" && player) {
      const { error } = await updatePlayer(player.id, payload)

      if (error) {
        setIsSaving(false)
        toast.error(error)
        return
      }
      toast.success("Player updated.")
    } else {
      const { error } = await createPlayer(payload)

      if (error) {
        setIsSaving(false)
        toast.error(error)
        return
      }

      toast.success("Player created.")
    }

    setIsSaving(false)
    await onSaved()
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === "edit" ? "Update player" : "Add player"}
        </DialogTitle>
        <DialogDescription>
          Capture role, skill, and profile data for analytics and training
          workflows.
        </DialogDescription>
      </DialogHeader>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel htmlFor="name">Player Name</FieldLabel>
            <Input
              id="name"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="position">Position</FieldLabel>
            <Select
              value={form.watch("position") || ""}
              onValueChange={(value) => form.setValue("position", value)}
            >
              <SelectTrigger id="position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="primary_skill">Primary Skill</FieldLabel>
            <Input id="primary_skill" {...form.register("primary_skill")} />
          </Field>
          <Field data-invalid={!!form.formState.errors.jersey_number}>
            <FieldLabel htmlFor="jersey_number">Jersey Number</FieldLabel>
            <Input
              id="jersey_number"
              type="number"
              min={0}
              max={99}
              {...form.register("jersey_number")}
            />
            <FieldError errors={[form.formState.errors.jersey_number]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="dominant_hand">Dominant Hand</FieldLabel>
            <Select
              value={form.watch("dominant_hand") || ""}
              onValueChange={(value) => form.setValue("dominant_hand", value)}
            >
              <SelectTrigger id="dominant_hand">
                <SelectValue placeholder="Select dominant hand" />
              </SelectTrigger>
              <SelectContent>
                {DOMINANT_HANDS.map((hand) => (
                  <SelectItem key={hand} value={hand}>
                    {hand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Spinner data-icon="inline-start" />}
            {mode === "edit" ? "Save changes" : "Create player"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export default function PlayersManager({
  clubId,
  initialPlayers,
  insights,
}: PlayersManagerProps) {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const playerDialogOpen = useUiShellStore((state) => state.playerDialogOpen)
  const playerDialogMode = useUiShellStore((state) => state.playerDialogMode)
  const playerDialogPlayer = useUiShellStore(
    (state) => state.playerDialogPlayer
  )
  const playerDialogKey = useUiShellStore((state) => state.playerDialogKey)
  const openPlayerCreate = useUiShellStore((state) => state.openPlayerCreate)
  const openPlayerEdit = useUiShellStore((state) => state.openPlayerEdit)
  const closePlayerDialog = useUiShellStore((state) => state.closePlayerDialog)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const insightByPlayer = useMemo(() => {
    return new Map(insights.map((item) => [item.playerId, item]))
  }, [insights])

  const totalPlayers = players.length
  const totalEvents = insights.reduce((sum, item) => sum + item.totalEvents, 0)
  const avgEvents = totalPlayers > 0 ? totalEvents / totalPlayers : 0
  const mostActive = insights.reduce<PlayerInsight | null>((current, next) => {
    if (!current || next.totalEvents > current.totalEvents) return next
    return current
  }, null)
  const activePlayers = players.filter((player) => player.is_active).length

  const refreshData = async () => {
    router.refresh()
  }

  const onDelete = async () => {
    if (!deletingPlayer) return
    setIsDeleting(true)

    const { error } = await deletePlayer(deletingPlayer.id)

    if (error) {
      setIsDeleting(false)
      toast.error(error)
      return
    }

    setIsDeleting(false)
    setIsDeleteOpen(false)
    setDeletingPlayer(null)
    toast.success("Player removed.")
    await refreshData()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalPlayers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Events / Player</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{avgEvents.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most Active Player</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {mostActive
                ? (players.find((player) => player.id === mostActive.playerId)
                    ?.name ?? "N/A")
                : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              {mostActive
                ? `${mostActive.totalEvents} tracked events`
                : "No data yet"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activePlayers}</div>
            <div className="text-xs text-muted-foreground">
              {totalPlayers > 0
                ? `${Math.round((activePlayers / totalPlayers) * 100)}% active`
                : "No roster"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roster</h2>
        <Button onClick={openPlayerCreate}>Add Player</Button>
      </div>

      {players.length === 0 ? (
        <Empty className="border border-border">
          <EmptyHeader>
            <EmptyTitle>No players yet</EmptyTitle>
            <EmptyDescription>
              Add your first player to start analytics and participation
              tracking.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-none border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Primary Skill</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead className="w-55">Team Average Comparison</TableHead>
                <TableHead className="w-45 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => {
                const insight = insightByPlayer.get(player.id)
                const playerEvents = insight?.totalEvents ?? 0
                const progressValue =
                  totalEvents > 0 ? (playerEvents / totalEvents) * 100 : 0
                const trend = insight?.trendDelta ?? 0

                return (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="text-primary hover:underline"
                        href={`/players/${player.id}`}
                      >
                        {player.name}
                      </Link>
                    </TableCell>
                    <TableCell>{player.position ?? "—"}</TableCell>
                    <TableCell>{player.primary_skill ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          trend >= 0 ? "text-primary" : "text-destructive"
                        }
                      >
                        {trend >= 0 ? `+${trend}` : trend}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Progress value={progressValue} />
                        <span className="text-[11px] text-muted-foreground">
                          {playerEvents.toFixed(0)} events · Avg{" "}
                          {avgEvents.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            router.push(`/players/${player.id}`)
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPlayerEdit(player)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDeletingPlayer(player)
                            setIsDeleteOpen(true)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={playerDialogOpen}
        onOpenChange={(open) => !open && closePlayerDialog()}
      >
        <DialogContent>
          <PlayerDialogForm
            key={playerDialogKey}
            clubId={clubId}
            mode={playerDialogMode}
            player={playerDialogMode === "edit" ? playerDialogPlayer : null}
            onSaved={refreshData}
            onClose={closePlayerDialog}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove player</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deletingPlayer?.name ?? "this player"}{" "}
              and related references.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Spinner data-icon="inline-start" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
