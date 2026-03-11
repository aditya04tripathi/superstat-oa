"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { attachTag, createAndAttachTag, removeTag } from "./actions"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

interface Tag {
  id: string
  name: string
  category: string | null
}

interface PlayerTag {
  id: string
  player_id: string
  tag_id: string
  club_id: string
}

interface PlayerTagManagerProps {
  clubId: string
  playerId: string
  allTags: Tag[]
  playerTags: PlayerTag[]
}

export default function PlayerTagManager({
  clubId,
  playerId,
  allTags,
  playerTags,
}: PlayerTagManagerProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string>("")
  const [newTagName, setNewTagName] = useState("")
  const [newTagCategory, setNewTagCategory] = useState("")

  const tagsById = useMemo(() => {
    return new Map(allTags.map((tag) => [tag.id, tag]))
  }, [allTags])

  const attachedTags = useMemo(() => {
    return playerTags
      .map((playerTag) => tagsById.get(playerTag.tag_id))
      .filter((tag): tag is Tag => !!tag)
  }, [playerTags, tagsById])

  const unassignedTags = useMemo(() => {
    const attachedIds = new Set(playerTags.map((tag) => tag.tag_id))
    return allTags.filter((tag) => !attachedIds.has(tag.id))
  }, [allTags, playerTags])

  const reload = () => {
    router.refresh()
  }

  const attachExistingTag = async () => {
    if (!selectedTagId) return
    setIsSaving(true)

    const { error } = await attachTag(selectedTagId, playerId)

    if (error) {
      setIsSaving(false)
      toast.error(error)
      return
    }

    setSelectedTagId("")
    setIsSaving(false)
    toast.success("Tag attached.")
    reload()
  }

  const handleCreateAndAttachTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required.")
      return
    }

    setIsSaving(true)

    const { error } = await createAndAttachTag(
      playerId,
      newTagName.trim(),
      newTagCategory.trim() || null
    )

    if (error) {
      setIsSaving(false)
      toast.error(error)
      return
    }

    setNewTagName("")
    setNewTagCategory("")
    setIsSaving(false)
    setIsDialogOpen(false)
    toast.success("Tag created and attached.")
    reload()
  }

  const handleRemoveTag = async (tagId: string) => {
    const toRemove = playerTags.find((tag) => tag.tag_id === tagId)
    if (!toRemove) return

    const { error } = await removeTag(toRemove.id)
    if (error) {
      toast.error(error)
      return
    }

    toast.success("Tag removed.")
    reload()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Player Tags</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
        >
          Manage Tags
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {attachedTags.length > 0 ? (
          attachedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="cursor-pointer"
              onClick={() => handleRemoveTag(tag.id)}
              aria-label={`Remove ${tag.name}`}
            >
              <Badge variant="secondary">{tag.name}</Badge>
            </button>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No tags assigned.</p>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Player Tags</DialogTitle>
            <DialogDescription>
              Attach existing tags or create new tags for this player profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="existing-tag">
                  Attach Existing Tag
                </FieldLabel>
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger id="existing-tag">
                    <SelectValue placeholder="Select a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button
                type="button"
                variant="outline"
                disabled={!selectedTagId || isSaving}
                onClick={attachExistingTag}
              >
                {isSaving && <Spinner data-icon="inline-start" />}
                Attach Selected Tag
              </Button>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-tag-name">Create New Tag</FieldLabel>
                <Input
                  id="new-tag-name"
                  placeholder="e.g. Rim Protector"
                  value={newTagName}
                  onChange={(event) => setNewTagName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-tag-category">Category</FieldLabel>
                <Input
                  id="new-tag-category"
                  placeholder="e.g. Defense"
                  value={newTagCategory}
                  onChange={(event) => setNewTagCategory(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleCreateAndAttachTag} disabled={isSaving}>
              {isSaving && <Spinner data-icon="inline-start" />}
              Create and Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
