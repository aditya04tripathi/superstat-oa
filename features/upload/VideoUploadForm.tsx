"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getSignedVideoUploadUrl, createVideoRecord } from "./actions"
import logger from "@/lib/logger"
import { FileUp, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  videoFile: z
    .custom<File[]>()
    .refine(
      (file): file is File[] => Array.isArray(file) && file.length > 0,
      "Video file is required."
    ),
})

export default function VideoUploadForm({ clubId }: { clubId: string | null }) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      videoFile: [],
    },
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setValue("videoFile", acceptedFiles)
    },
    [setValue]
  )

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: {
        "video/*": [".mp4", ".mov", ".avi", ".mkv"],
      },
      multiple: false,
    })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsUploading(true)
    setUploadProgress(0)

    if (!clubId) {
      logger.error("No club ID found. Please log in.")
      toast.error("Please select a club first")
      setIsUploading(false)
      return
    }

    const videoFile = values.videoFile[0]
    setUploadProgress(10)

    // Get a signed upload URL from the server action
    const { data: uploadData, error: urlError } = await getSignedVideoUploadUrl(
      videoFile.name
    )

    if (urlError || !uploadData) {
      logger.error("Error getting signed upload URL:", urlError)
      toast.error(`Upload failed: ${urlError ?? "Could not get upload URL"}`)
      setIsUploading(false)
      setUploadProgress(0)
      return
    }

    setUploadProgress(18)

    // Upload directly to the signed URL using XHR for progress tracking
    const uploadSuccess = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 54) + 18
          setUploadProgress(pct)
        }
      })
      xhr.addEventListener("load", () =>
        resolve(xhr.status >= 200 && xhr.status < 300)
      )
      xhr.addEventListener("error", () => resolve(false))
      xhr.open("PUT", uploadData.signedUrl)
      xhr.setRequestHeader("Content-Type", videoFile.type || "video/mp4")
      xhr.send(videoFile)
    })

    if (!uploadSuccess) {
      logger.error("Error uploading video to storage.")
      toast.error("Upload failed: Could not upload to storage")
      setIsUploading(false)
      setUploadProgress(0)
      return
    }

    setUploadProgress(72)

    // Create the video record via server action
    const { data: createdVideo, error: insertError } = await createVideoRecord(
      values.title,
      uploadData.path
    )

    if (insertError || !createdVideo) {
      logger.error("Error saving video to database:", insertError)
      toast.error("Failed to save video metadata")
      setIsUploading(false)
      setUploadProgress(0)
      return
    }

    logger.success("Video uploaded and saved successfully!")
    toast.success("Video uploaded successfully!")
    reset()
    setUploadProgress(100)
    setIsUploading(false)
    router.push(`/videos/${createdVideo.id}`)
  }

  const files = acceptedFiles.map((file: File) => (
    <div
      key={file.name}
      className="mt-2 flex items-center justify-between rounded-md border p-2"
    >
      <span className="max-w-50 truncate">{file.name}</span>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => {
          setValue("videoFile", [])
        }}
      >
        <XCircle className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  ))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="title">Video Title</FieldLabel>
        <Input
          id="title"
          placeholder="Enter video title"
          {...register("title")}
        />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field>
        <FieldLabel>Video File</FieldLabel>
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25"
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p className="text-muted-foreground">
              Drag and drop a video file here, or click to select one
            </p>
          )}
          <FileUp className="mt-4 h-8 w-8 text-muted-foreground" />
        </div>
        <div className="mt-2">{files}</div>
        <FieldError errors={[errors.videoFile]} />
      </Field>

      {isUploading && <Progress value={uploadProgress} className="w-full" />}

      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Upload Video"}
      </Button>
    </form>
  )
}
