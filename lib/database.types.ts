export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          description: string | null
          contact_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          description?: string | null
          contact_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          description?: string | null
          contact_email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          club_id: string
          name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          name: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          name?: string
          category?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          id: string
          name: string
          club_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          club_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          club_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_types_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          id: string
          video_id: string
          player_id: string | null
          event_type_id: string | null
          timestamp_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          player_id?: string | null
          event_type_id?: string | null
          timestamp_seconds: number
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          player_id?: string | null
          event_type_id?: string | null
          timestamp_seconds?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_video_id_fkey"
            columns: ["video_id"]
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      player_tags: {
        Row: {
          id: string
          player_id: string
          tag_id: string
          club_id: string
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          tag_id: string
          club_id: string
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          tag_id?: string
          club_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_tags_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tags_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      player_metric_logs: {
        Row: {
          id: string
          player_id: string
          club_id: string
          metric_name: string
          metric_value: number
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          club_id: string
          metric_name: string
          metric_value: number
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          club_id?: string
          metric_name?: string
          metric_value?: number
          recorded_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_metric_logs_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_metric_logs_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: string
          name: string
          club_id: string | null
          position: string | null
          primary_skill: string | null
          jersey_number: number | null
          dominant_hand: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          club_id?: string | null
          position?: string | null
          primary_skill?: string | null
          jersey_number?: number | null
          dominant_hand?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          club_id?: string | null
          position?: string | null
          primary_skill?: string | null
          jersey_number?: number | null
          dominant_hand?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          id: string
          club_id: string
          title: string
          session_type: string
          starts_at: string
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          title: string
          session_type?: string
          starts_at: string
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          title?: string
          session_type?: string
          starts_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_attendance: {
        Row: {
          id: string
          session_id: string
          player_id: string
          club_id: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          player_id: string
          club_id: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          player_id?: string
          club_id?: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendance_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendance_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          id: string
          title: string
          file_url: string
          club_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          file_url: string
          club_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          file_url?: string
          club_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
