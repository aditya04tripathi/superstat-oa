"use client"

import { useState } from "react"
import Cookies from "js-cookie"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { createBrowserClient } from "@/lib/supabase"
import { Player, EventType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import PlayerSelector from "@/components/PlayerSelector"

const formSchema = z.object({
  event_type_id: z.string().min(1, "Select an event type."),
  player_id: z.string().nullable(),
  timestamp_seconds: z.number().min(0, "Capture a timestamp."),
})

type FormValues = z.infer<typeof formSchema>

export default function EventTagForm({
  videoId,
  players,
  eventTypes,
  getCurrentTime,
  onEventSaved,
}: {
  videoId: string
  players: Player[]
  eventTypes: EventType[]
  getCurrentTime: () => number
  onEventSaved: () => void
}) {
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      event_type_id: "",
      player_id: null,
      timestamp_seconds: 0,
    },
  })

  const handleCaptureTimestamp = () => {
    const time = getCurrentTime()
    setTimestamp(time)
    form.setValue("timestamp_seconds", time, { shouldValidate: true })
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    const clubId = Cookies.get("selected_club_id") || null

    try {
      const supabase = createBrowserClient(clubId)
      const { error } = await supabase.from("events").insert({
        video_id: videoId,
        player_id: values.player_id,
        event_type_id: values.event_type_id,
        timestamp_seconds: values.timestamp_seconds,
      })

      if (error) throw error

      toast.success("Event saved.")
      form.reset({ event_type_id: "", player_id: null, timestamp_seconds: 0 })
      setTimestamp(null)
      onEventSaved()
    } catch {
      toast.error("Failed to save event.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.event_type_id}>
          <FieldLabel>Event Type</FieldLabel>
          <Select
            value={form.watch("event_type_id")}
            onValueChange={(value) => form.setValue("event_type_id", value, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[form.formState.errors.event_type_id]} />
        </Field>

        <Field>
          <FieldLabel>Player (Optional)</FieldLabel>
          <PlayerSelector
            players={players}
            value={form.watch("player_id")}
            onChange={(playerId) => form.setValue("player_id", playerId)}
          />
        </Field>

        <Field data-invalid={!!form.formState.errors.timestamp_seconds}>
          <FieldLabel>Timestamp</FieldLabel>
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleCaptureTimestamp}>
              Capture
            </Button>
            <span className="min-w-20 text-right font-mono text-sm text-muted-foreground">
              {(timestamp ?? form.watch("timestamp_seconds") ?? 0).toFixed(2)}s
            </span>
          </div>
          <FieldError errors={[form.formState.errors.timestamp_seconds]} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Spinner data-icon="inline-start" />}
        Save Event
      </Button>
    </form>
  )
}
