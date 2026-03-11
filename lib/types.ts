import { Database } from "./database.types"

export type Video = Database["public"]["Tables"]["videos"]["Row"]
export type Player = Database["public"]["Tables"]["players"]["Row"]
export type Club = Database["public"]["Tables"]["clubs"]["Row"]
export type EventType = Database["public"]["Tables"]["event_types"]["Row"]
export type Event = Database["public"]["Tables"]["events"]["Row"]
export type Tag = Database["public"]["Tables"]["tags"]["Row"]
export type PlayerTag = Database["public"]["Tables"]["player_tags"]["Row"]
export type TrainingSession =
  Database["public"]["Tables"]["training_sessions"]["Row"]
export type TrainingAttendance =
  Database["public"]["Tables"]["training_attendance"]["Row"]
