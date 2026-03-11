"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { createBrowserClient } from "@/lib/supabase"
import { EventType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Spinner } from "@/components/ui/spinner"

const formSchema = z.object({
  name: z.string().trim().min(1, "Event type name is required."),
})
type FormValues = z.infer<typeof formSchema>

export default function EventTypeManager({
  clubId,
  initialEventTypes,
  activationCounts,
}: {
  clubId: string | null
  initialEventTypes: EventType[]
  activationCounts: Record<string, number>
}) {
  const supabase = createBrowserClient(clubId)
  const [eventTypes, setEventTypes] = useState<EventType[]>(initialEventTypes)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEventType, setEditingEventType] = useState<EventType | null>(
    null
  )
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [eventTypeToDelete, setEventTypeToDelete] = useState<EventType | null>(
    null
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  })

  const openCreateDialog = () => {
    setEditingEventType(null)
    form.reset({ name: "" })
    setIsDialogOpen(true)
  }

  const openEditDialog = (eventType: EventType) => {
    setEditingEventType(eventType)
    form.reset({ name: eventType.name })
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    if (!clubId) {
      toast.error("Please select a club first")
      return
    }

    setIsSaving(true)

    if (editingEventType) {
      const { data, error } = await supabase
        .from("event_types")
        .update({ name: values.name })
        .eq("id", editingEventType.id)
        .select("*")
        .single()

      if (error) {
        setIsSaving(false)
        toast.error(error.message)
        return
      }
      if (data) {
        setEventTypes((current) =>
          current
            .map((item) => (item.id === data.id ? data : item))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      }
      toast.success("Event type updated.")
    } else {
      const { data, error } = await supabase
        .from("event_types")
        .insert({ name: values.name, club_id: clubId })
        .select("*")
        .single()

      if (error) {
        setIsSaving(false)
        toast.error(error.message)
        return
      }
      if (data) {
        setEventTypes((current) =>
          [...current, data].sort((a, b) => a.name.localeCompare(b.name))
        )
      }
      toast.success("Event type created.")
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setEditingEventType(null)
    form.reset({ name: "" })
  }

  const deleteEventType = async () => {
    if (!eventTypeToDelete) return
    setIsDeleting(true)

    const { error } = await supabase
      .from("event_types")
      .delete()
      .eq("id", eventTypeToDelete.id)

    if (error) {
      setIsDeleting(false)
      toast.error(error.message)
      return
    }

    setIsDeleting(false)
    setIsConfirmDialogOpen(false)
    setEventTypeToDelete(null)
    setEventTypes((current) =>
      current.filter((item) => item.id !== eventTypeToDelete.id)
    )
    toast.success("Event type deleted.")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Event Types</h2>
        <Button onClick={openCreateDialog}>Add Event Type</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEventType ? "Edit Event Type" : "Add Event Type"}
            </DialogTitle>
            <DialogDescription>
              {editingEventType
                ? "Make changes to the event type here."
                : "Create a new event type for your club."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g. Catch and Shoot"
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
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

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event type</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently removes {eventTypeToDelete?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={deleteEventType}
              disabled={isDeleting}
            >
              {isDeleting && <Spinner data-icon="inline-start" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-none border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Activations</TableHead>
              <TableHead className="w-45 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyTitle>No event types yet</EmptyTitle>
                      <EmptyDescription>
                        Create event types to power player tagging and insights.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              eventTypes.map((eventType) => (
                <TableRow key={eventType.id}>
                  <TableCell>{eventType.name}</TableCell>
                  <TableCell>{activationCounts[eventType.id] ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(eventType)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setEventTypeToDelete(eventType)
                          setIsConfirmDialogOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
