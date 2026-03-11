"use client"

import { useMemo, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
} from "./actions"
import { TrainingSession } from "@/lib/types"
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

const formSchema = z.object({
  title: z.string().trim().min(2, "Session title is required."),
  session_type: z.string().min(1, "Select a session type."),
  starts_at: z.string().min(1, "Start time is required."),
})

type FormValues = z.infer<typeof formSchema>

const SESSION_TYPES = [
  { label: "Training", value: "training" },
  { label: "Match Prep", value: "match-prep" },
  { label: "Recovery", value: "recovery" },
]

const toLocalInputValue = (value: string) => {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export default function TrainingSessionsManager({
  clubId,
  initialSessions,
}: {
  clubId: string | null
  initialSessions: TrainingSession[]
}) {
  const [sessions, setSessions] = useState<TrainingSession[]>(initialSessions)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(
    null
  )
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] =
    useState<TrainingSession | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sessionType, setSessionType] = useState("training")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      session_type: "training",
      starts_at: "",
    },
  })

  const openCreateDialog = () => {
    setEditingSession(null)
    setSessionType("training")
    form.reset({
      title: "",
      session_type: "training",
      starts_at: "",
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (session: TrainingSession) => {
    setEditingSession(session)
    setSessionType(session.session_type ?? "training")
    form.reset({
      title: session.title,
      session_type: session.session_type ?? "training",
      starts_at: toLocalInputValue(session.starts_at),
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    if (!clubId) {
      toast.error("Please select a club first.")
      return
    }

    setIsSaving(true)
    const payload = {
      title: values.title.trim(),
      session_type: values.session_type,
      starts_at: new Date(values.starts_at).toISOString(),
    }

    if (editingSession) {
      const { data, error } = await updateTrainingSession(
        editingSession.id,
        payload
      )

      if (error) {
        setIsSaving(false)
        toast.error(error)
        return
      }

      if (data) {
        setSessions((current) =>
          current.map((item) => (item.id === data.id ? data : item))
        )
      }
      toast.success("Session updated.")
    } else {
      const { data, error } = await createTrainingSession(payload)

      if (error) {
        setIsSaving(false)
        toast.error(error)
        return
      }

      if (data) {
        setSessions((current) => [data, ...current])
      }
      toast.success("Session created.")
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setEditingSession(null)
  }

  const confirmDelete = (session: TrainingSession) => {
    setSessionToDelete(session)
    setIsConfirmOpen(true)
  }

  const deleteSession = async () => {
    if (!sessionToDelete) return
    setIsDeleting(true)

    const { error } = await deleteTrainingSession(sessionToDelete.id)

    if (error) {
      setIsDeleting(false)
      toast.error(error)
      return
    }

    setSessions((current) =>
      current.filter((item) => item.id !== sessionToDelete.id)
    )
    setIsDeleting(false)
    setIsConfirmOpen(false)
    setSessionToDelete(null)
    toast.success("Session removed.")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <Button onClick={openCreateDialog}>Add Session</Button>
      </div>

      <div className="rounded-none border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-40">Type</TableHead>
              <TableHead className="w-40">Starts</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell className="capitalize">
                    {session.session_type ?? "training"}
                  </TableCell>
                  <TableCell>
                    {new Date(session.starts_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(session)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => confirmDelete(session)}
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
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No sessions yet.
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
              {editingSession ? "Edit Session" : "New Session"}
            </DialogTitle>
            <DialogDescription>
              Schedule training or match prep sessions for your club.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.title}>
                <FieldLabel htmlFor="session-title">Title</FieldLabel>
                <Input
                  id="session-title"
                  aria-invalid={!!form.formState.errors.title}
                  {...form.register("title")}
                />
                <FieldError errors={[form.formState.errors.title]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.session_type}>
                <FieldLabel htmlFor="session-type">Type</FieldLabel>
                <Select
                  value={sessionType}
                  onValueChange={(value) => {
                    setSessionType(value)
                    form.setValue("session_type", value, {
                      shouldValidate: true,
                    })
                  }}
                >
                  <SelectTrigger id="session-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SESSION_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.session_type]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.starts_at}>
                <FieldLabel htmlFor="session-starts-at">Starts At</FieldLabel>
                <Input
                  id="session-starts-at"
                  type="datetime-local"
                  aria-invalid={!!form.formState.errors.starts_at}
                  {...form.register("starts_at")}
                />
                <FieldError errors={[form.formState.errors.starts_at]} />
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
            <AlertDialogTitle>Delete session</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {sessionToDelete?.title ?? "this session"} and any
              related attendance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={deleteSession}
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
