"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { createPlayer } from "@/features/players/actions"
import { Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Player name must have at least 2 characters."),
})

type FormValues = z.infer<typeof formSchema>

export default function PlayerCreateForm({
  onPlayerCreated,
}: {
  onPlayerCreated: (player: Player) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const { data, error } = await createPlayer({ name: values.name })
      if (error || !data) {
        toast.error(error ?? "Failed to create player.")
        return
      }
      onPlayerCreated(data)
      toast.success("Player added.")
      form.reset({ name: "" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.name}>
          <FieldLabel htmlFor="quick-player-name">Player Name</FieldLabel>
          <Input
            id="quick-player-name"
            placeholder="e.g. Alex Johnson"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Spinner data-icon="inline-start" />}
        Add Player
      </Button>
    </form>
  )
}
