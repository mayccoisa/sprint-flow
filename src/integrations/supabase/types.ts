export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      release_tasks: {
        Row: {
          created_at: string
          id: number
          release_id: number
          task_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          release_id: number
          task_id: number
        }
        Update: {
          created_at?: string
          id?: number
          release_id?: number
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "release_tasks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: number
          release_date: string
          release_notes: string | null
          squad_id: number | null
          status: Database["public"]["Enums"]["version_status"]
          version_name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          release_date: string
          release_notes?: string | null
          squad_id?: number | null
          status?: Database["public"]["Enums"]["version_status"]
          version_name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          release_date?: string
          release_notes?: string | null
          squad_id?: number | null
          status?: Database["public"]["Enums"]["version_status"]
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "releases_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_tasks: {
        Row: {
          created_at: string
          id: number
          order_index: number
          sprint_id: number
          task_id: number
          task_status: Database["public"]["Enums"]["task_sprint_status"]
        }
        Insert: {
          created_at?: string
          id?: number
          order_index?: number
          sprint_id: number
          task_id: number
          task_status?: Database["public"]["Enums"]["task_sprint_status"]
        }
        Update: {
          created_at?: string
          id?: number
          order_index?: number
          sprint_id?: number
          task_id?: number
          task_status?: Database["public"]["Enums"]["task_sprint_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sprint_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string
          id: number
          name: string
          squad_id: number
          start_date: string
          status: Database["public"]["Enums"]["sprint_status"]
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: number
          name: string
          squad_id: number
          start_date: string
          status?: Database["public"]["Enums"]["sprint_status"]
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: number
          name?: string
          squad_id?: number
          start_date?: string
          status?: Database["public"]["Enums"]["sprint_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sprints_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          status: Database["public"]["Enums"]["squad_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          status?: Database["public"]["Enums"]["squad_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          status?: Database["public"]["Enums"]["squad_status"]
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          created_at: string
          id: number
          member_id: number
          task_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          member_id: number
          task_id: number
        }
        Update: {
          created_at?: string
          id?: number
          member_id?: number
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          estimate_backend: number | null
          estimate_design: number | null
          estimate_frontend: number | null
          estimate_qa: number | null
          id: number
          order_index: number
          priority: Database["public"]["Enums"]["task_priority"]
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimate_backend?: number | null
          estimate_design?: number | null
          estimate_frontend?: number | null
          estimate_qa?: number | null
          id?: number
          order_index?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimate_backend?: number | null
          estimate_design?: number | null
          estimate_frontend?: number | null
          estimate_qa?: number | null
          id?: number
          order_index?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          capacity: number
          created_at: string
          id: number
          name: string
          specialty: Database["public"]["Enums"]["member_specialty"]
          squad_id: number
          status: Database["public"]["Enums"]["member_status"]
        }
        Insert: {
          avatar_url?: string | null
          capacity?: number
          created_at?: string
          id?: number
          name: string
          specialty: Database["public"]["Enums"]["member_specialty"]
          squad_id: number
          status?: Database["public"]["Enums"]["member_status"]
        }
        Update: {
          avatar_url?: string | null
          capacity?: number
          created_at?: string
          id?: number
          name?: string
          specialty?: Database["public"]["Enums"]["member_specialty"]
          squad_id?: number
          status?: Database["public"]["Enums"]["member_status"]
        }
        Relationships: [
          {
            foreignKeyName: "team_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
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
      member_specialty: "Frontend" | "Backend" | "QA" | "Design"
      member_status: "Active" | "Inactive"
      sprint_status: "Planning" | "Active" | "Completed" | "Cancelled"
      squad_status: "Active" | "Inactive"
      task_priority: "High" | "Medium" | "Low"
      task_sprint_status: "Todo" | "InProgress" | "Done" | "Blocked"
      task_status: "Backlog" | "InSprint" | "Done" | "Archived"
      task_type: "Feature" | "Bug" | "TechDebt" | "Spike"
      version_status: "Planned" | "InProgress" | "Released" | "Cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      member_specialty: ["Frontend", "Backend", "QA", "Design"],
      member_status: ["Active", "Inactive"],
      sprint_status: ["Planning", "Active", "Completed", "Cancelled"],
      squad_status: ["Active", "Inactive"],
      task_priority: ["High", "Medium", "Low"],
      task_sprint_status: ["Todo", "InProgress", "Done", "Blocked"],
      task_status: ["Backlog", "InSprint", "Done", "Archived"],
      task_type: ["Feature", "Bug", "TechDebt", "Spike"],
      version_status: ["Planned", "InProgress", "Released", "Cancelled"],
    },
  },
} as const
