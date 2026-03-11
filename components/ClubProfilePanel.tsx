"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"

import { Club } from "@/lib/types"
import { createBrowserClient } from "@/lib/supabase"
import { useUiShellStore } from "@/lib/ui-shell-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

interface ClubProfilePanelProps {
  club: Club
}

const formSchema = z.object({
  name: z.string().trim().min(2, "Club name must have at least 2 characters."),
  description: z.string().optional(),
  contact_email: z.union([
    z.literal(""),
    z.string().email("Invalid email address."),
  ]),
  logo: z.custom<FileList | undefined>().optional(),
})

type FormInput = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export default function ClubProfilePanel({ club }: ClubProfilePanelProps) {
  const router = useRouter()
  const clubEditOpen = useUiShellStore((state) => state.clubEditOpen)
  const openClubEdit = useUiShellStore((state) => state.openClubEdit)
  const closeClubEdit = useUiShellStore((state) => state.closeClubEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [videoTitle, setVideoTitle] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  const initials = useMemo(() => {
    return club.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  }, [club.name])

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    }
  }, [videoPreviewUrl])

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: club.name,
      description: club.description ?? "",
      contact_email: club.contact_email ?? "",
    },
  })

  const onSubmit = async (values: FormOutput) => {
    setIsSaving(true)
    const supabase = createBrowserClient(club.id)
    let logoUrl = club.logo_url

    const upload = values.logo?.item(0)
    if (upload) {
      const filePath = `${club.id}/${crypto.randomUUID()}-${upload.name}`
      const { error: uploadError } = await supabase.storage
        .from("club-logos")
        .upload(filePath, upload, { upsert: true })

      if (uploadError) {
        setIsSaving(false)
        toast.error(uploadError.message)
        return
      }

      const { data } = supabase.storage
        .from("club-logos")
        .getPublicUrl(filePath)
      logoUrl = data.publicUrl
    }

    const { error } = await supabase
      .from("clubs")
      .update({
        name: values.name,
        description: values.description || null,
        contact_email: values.contact_email || null,
        logo_url: logoUrl,
      })
      .eq("id", club.id)

    if (error) {
      setIsSaving(false)
      toast.error(error.message)
      return
    }

    setIsSaving(false)
    closeClubEdit()
    toast.success("Club profile updated.")
    router.refresh()
  }

  const onVideoFileChange = (file: File | null) => {
    setVideoFile(file)
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
      setVideoPreviewUrl(null)
    }
    if (file) {
      setVideoPreviewUrl(URL.createObjectURL(file))
    }
  }

  const uploadVideo = async () => {
    if (!videoTitle.trim()) {
      toast.error("Video title is required.")
      return
    }
    if (!videoFile) {
      toast.error("Please select a video file.")
      return
    }

    setIsUploadingVideo(true)
    setUploadProgress(12)
    const supabase = createBrowserClient(club.id)
    const filePath = `${club.id}/${crypto.randomUUID()}-${videoFile.name}`

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, videoFile, { cacheControl: "3600", upsert: false })

    if (uploadError) {
      setIsUploadingVideo(false)
      setUploadProgress(0)
      toast.error(uploadError.message)
      return
    }

    setUploadProgress(76)
    const { data } = supabase.storage.from("videos").getPublicUrl(filePath)

    const { error: insertError } = await supabase.from("videos").insert({
      title: videoTitle.trim(),
      file_url: data.publicUrl,
      club_id: club.id,
    })

    if (insertError) {
      setIsUploadingVideo(false)
      setUploadProgress(0)
      toast.error(insertError.message)
      return
    }

    setUploadProgress(100)
    setIsUploadingVideo(false)
    setVideoTitle("")
    onVideoFileChange(null)
    toast.success("Video uploaded successfully.")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-20">
            <AvatarImage
              src={club.logo_url ?? undefined}
              alt={`${club.name} logo`}
            />
            <AvatarFallback>{initials || "CL"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-semibold">{club.name}</p>
            <p className="text-sm text-muted-foreground">
              {club.contact_email || "No contact email set."}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={openClubEdit}>
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-2">
          <p className="text-sm font-medium">Description</p>
          <p className="text-sm text-muted-foreground">
            {club.description || "No description yet."}
          </p>
          <p className="pt-3 text-xs text-muted-foreground">
            Club ID: {club.id}
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Upload Club Video</h3>
            <p className="text-xs text-muted-foreground">
              Supported formats: MP4, MOV, AVI, MKV, WEBM.
            </p>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="video-title">Video Title</FieldLabel>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(event) => setVideoTitle(event.target.value)}
                placeholder="e.g. Weekly Scrimmage"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="video-file">Video File</FieldLabel>
              <Input
                id="video-file"
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                onChange={(event) =>
                  onVideoFileChange(event.target.files?.item(0) ?? null)
                }
              />
            </Field>
          </FieldGroup>
          {videoPreviewUrl && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Preview</p>
              <video
                src={videoPreviewUrl}
                controls
                className="max-h-56 w-full rounded-md border border-border"
              />
            </div>
          )}
          {isUploadingVideo && (
            <Progress value={uploadProgress} className="w-full" />
          )}
          <Button
            onClick={uploadVideo}
            disabled={isUploadingVideo}
            className="w-full"
          >
            {isUploadingVideo && <Spinner data-icon="inline-start" />}
            Upload Video
          </Button>
        </div>
      </div>

      <Dialog
        open={clubEditOpen}
        onOpenChange={(open) => !open && closeClubEdit()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit club profile</DialogTitle>
            <DialogDescription>
              Update branding and contact details for your club workspace.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="name">Club Name</FieldLabel>
                <Input
                  id="name"
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.contact_email}>
                <FieldLabel htmlFor="contact_email">Contact Email</FieldLabel>
                <Input
                  id="contact_email"
                  type="email"
                  aria-invalid={!!form.formState.errors.contact_email}
                  {...form.register("contact_email")}
                />
                <FieldError errors={[form.formState.errors.contact_email]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  rows={3}
                  {...form.register("description")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="logo">Profile Picture</FieldLabel>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  {...form.register("logo")}
                />
              </Field>
              {club.logo_url && (
                <Field>
                  <FieldLabel>Current Logo</FieldLabel>
                  <Image
                    src={club.logo_url}
                    alt={`${club.name} logo`}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                </Field>
              )}
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeClubEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Spinner data-icon="inline-start" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
