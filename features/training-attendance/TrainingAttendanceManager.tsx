"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  createAttendance,
  updateAttendance,
  deleteAttendance,
  type AttendanceWithRelations,
} from "./actions"
import { TrainingSession } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type PlayerOption = {
  id: string
  name: string
}

const formSchema = z.object({
  session_id: z.string().min(1, "Select a session."),
  player_id: z.string().min(1, "Select a player."),
  status: z.string().min(1, "Select a status."),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
]

export default function TrainingAttendanceManager({
  clubId,
  initialAttendance,
  sessions,
  players,
}: {
  clubId: string | null
  initialAttendance: AttendanceWithRelations[]
  sessions: TrainingSession[]
  players: PlayerOption[]
}) {
  const [attendance, setAttendance] =
    useState<AttendanceWithRelations[]>(initialAttendance)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] =
    useState<AttendanceWithRelations | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] =
    useState<AttendanceWithRelations | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [playerId, setPlayerId] = useState("")
  const [status, setStatus] = useState("present")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      session_id: "",
      player_id: "",
      status: "present",
      notes: "",
    },
  })

  const openCreateDialog = () => {
    setEditingEntry(null)
    setSessionId("")
    setPlayerId("")
    setStatus("present")
    form.reset({
      session_id: "",
      player_id: "",
      status: "present",
      notes: "",
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (entry: AttendanceWithRelations) => {
    setEditingEntry(entry)
    setSessionId(entry.session_id)
    setPlayerId(entry.player_id)
    setStatus(entry.status)
    form.reset({
      session_id: entry.session_id,
      player_id: entry.player_id,
      status: entry.status,
      notes: entry.notes ?? "",
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    if (!clubId) {
      toast.error("Please select a club first.")
      return
    }

    setIsSaving(true)

    if (editingEntry) {
      const { data, error } = await updateAttendance(editingEntry.id, {
        session_id: values.session_id,
        player_id: values.player_id,
        status: values.status,
        notes: values.notes?.trim() || null,
      })

      if (error) {
        setIsSaving(false)
        toast.error(error)
        return
      }

      if (data) {
        setAttendance((current) =>
          current.map((item) => (item.id === data.id ? data : item))
        )
      }
      toast.success("Attendance updated.")
    } else {
      const { data, error } = await createAttendance({
        session_id: values.session_id,
        player_id: values.player_id,
        status: values.status,
        notes: values.notes?.trim() || null,
      })

      if (error) {
        setIsSaving(false)
        toast.error(error)
        return
      }

      if (data) {
        setAttendance((current) => [data, ...current])
      }
      toast.success("Attendance recorded.")
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setEditingEntry(null)
  }

  const confirmDelete = (entry: AttendanceWithRelations) => {
    setEntryToDelete(entry)
    setIsConfirmOpen(true)
  }

  const deleteEntry = async () => {
    if (!entryToDelete) return
    setIsDeleting(true)

    const { error } = await deleteAttendance(entryToDelete.id)

    if (error) {
      setIsDeleting(false)
      toast.error(error)
      return
    }

    setAttendance((current) =>
      current.filter((item) => item.id !== entryToDelete.id)
    )
    setIsDeleting(false)
    setIsConfirmOpen(false)
    setEntryToDelete(null)
    toast.success("Attendance removed.")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Attendance</h2>
        <Button onClick={openCreateDialog}>Add Record</Button>
      </div>

      <div className="rounded-none border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Session</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-40">Logged</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length > 0 ? (
              attendance.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.players?.name ?? "Unknown"}
                  </TableCell>
                  <TableCell>
                    {entry.training_sessions?.title ?? "Training Session"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.status === "present"
                          ? "default"
                          : entry.status === "late"
                            ? "secondary"
                            : "destructive"
                      }
                      className="w-full capitalize"
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(entry)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => confirmDelete(entry)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No attendance records yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Attendance" : "New Attendance"}
            </DialogTitle>
            <DialogDescription>
              Record attendance status for a training session.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.session_id}>
                <FieldLabel htmlFor="attendance-session">Session</FieldLabel>
                <Select
                  value={sessionId}
                  onValueChange={(value) => {
                    setSessionId(value)
                    form.setValue("session_id", value, { shouldValidate: true })
                  }}
                >
                  <SelectTrigger id="attendance-session">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.session_id]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.player_id}>
                <FieldLabel htmlFor="attendance-player">Player</FieldLabel>
                <Select
                  value={playerId}
                  onValueChange={(value) => {
                    setPlayerId(value)
                    form.setValue("player_id", value, { shouldValidate: true })
                  }}
                >
                  <SelectTrigger id="attendance-player">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.player_id]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.status}>
                <FieldLabel htmlFor="attendance-status">Status</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value)
                    form.setValue("status", value, { shouldValidate: true })
                  }}
                >
                  <SelectTrigger id="attendance-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.status]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="attendance-notes">Notes</FieldLabel>
                <Input id="attendance-notes" {...form.register("notes")} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Spinner data-icon="inline-start" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attendance</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the attendance entry permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={deleteEntry}
              disabled={isDeleting}
            >
              {isDeleting && <Spinner data-icon="inline-start" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
