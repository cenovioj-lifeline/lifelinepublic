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
      ballot_items: {
        Row: {
          created_at: string
          election_id: string
          id: string
          order_index: number
          prompt: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          election_id: string
          id?: string
          order_index?: number
          prompt: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          election_id?: string
          id?: string
          order_index?: number
          prompt?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_items_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "mock_elections"
            referencedColumns: ["id"]
          },
        ]
      }
      ballot_options: {
        Row: {
          ballot_item_id: string
          created_at: string
          description: string | null
          id: string
          image_id: string | null
          label: string
          lifeline_ref: string | null
          order_index: number
          profile_ref: string | null
        }
        Insert: {
          ballot_item_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_id?: string | null
          label: string
          lifeline_ref?: string | null
          order_index?: number
          profile_ref?: string | null
        }
        Update: {
          ballot_item_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_id?: string | null
          label?: string
          lifeline_ref?: string | null
          order_index?: number
          profile_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ballot_options_ballot_item_id_fkey"
            columns: ["ballot_item_id"]
            isOneToOne: false
            referencedRelation: "ballot_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_options_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_options_lifeline_ref_fkey"
            columns: ["lifeline_ref"]
            isOneToOne: false
            referencedRelation: "lifelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_options_profile_ref_fkey"
            columns: ["profile_ref"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_quotes: {
        Row: {
          author: string | null
          collection_id: string
          context: string | null
          created_at: string
          id: string
          quote: string
        }
        Insert: {
          author?: string | null
          collection_id: string
          context?: string | null
          created_at?: string
          id?: string
          quote: string
        }
        Update: {
          author?: string | null
          collection_id?: string
          context?: string | null
          created_at?: string
          id?: string
          quote?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_quotes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_tags: {
        Row: {
          collection_id: string
          tag_id: string
        }
        Insert: {
          collection_id: string
          tag_id: string
        }
        Update: {
          collection_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_tags_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          hero_image_id: string | null
          id: string
          is_featured: boolean | null
          menu_active_color: string | null
          menu_hover_color: string | null
          menu_text_color: string | null
          primary_color: string | null
          quote_frequency: number | null
          quotes_enabled: boolean | null
          secondary_color: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          style_notes: string | null
          title: string
          updated_at: string
          web_primary: string | null
          web_secondary: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hero_image_id?: string | null
          id?: string
          is_featured?: boolean | null
          menu_active_color?: string | null
          menu_hover_color?: string | null
          menu_text_color?: string | null
          primary_color?: string | null
          quote_frequency?: number | null
          quotes_enabled?: boolean | null
          secondary_color?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          style_notes?: string | null
          title: string
          updated_at?: string
          web_primary?: string | null
          web_secondary?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hero_image_id?: string | null
          id?: string
          is_featured?: boolean | null
          menu_active_color?: string | null
          menu_hover_color?: string | null
          menu_text_color?: string | null
          primary_color?: string | null
          quote_frequency?: number | null
          quotes_enabled?: boolean | null
          secondary_color?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          style_notes?: string | null
          title?: string
          updated_at?: string
          web_primary?: string | null
          web_secondary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_hero_image_id_fkey"
            columns: ["hero_image_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      election_category_order: {
        Row: {
          category: string
          created_at: string
          display_order: number
          id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number
          id?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      election_results: {
        Row: {
          category: string
          created_at: string
          election_id: string
          id: string
          media_ids: string[] | null
          notes: string | null
          percentage: number | null
          superlative_category: string | null
          updated_at: string
          vote_count: number | null
          winner_name: string | null
          winner_profile_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          election_id: string
          id?: string
          media_ids?: string[] | null
          notes?: string | null
          percentage?: number | null
          superlative_category?: string | null
          updated_at?: string
          vote_count?: number | null
          winner_name?: string | null
          winner_profile_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          election_id?: string
          id?: string
          media_ids?: string[] | null
          notes?: string | null
          percentage?: number | null
          superlative_category?: string | null
          updated_at?: string
          vote_count?: number | null
          winner_name?: string | null
          winner_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "election_results_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "mock_elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_results_winner_profile_id_fkey"
            columns: ["winner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      election_tags: {
        Row: {
          election_id: string
          tag_id: string
        }
        Insert: {
          election_id: string
          tag_id: string
        }
        Update: {
          election_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "election_tags_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "mock_elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "election_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          age_at_event: number | null
          collection_id: string | null
          created_at: string
          details: string | null
          id: string
          lifeline_id: string
          media_suggestion: string | null
          occurred_on: string | null
          order_index: number
          related_lifelines: string | null
          score: number | null
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          summary: string | null
          tags: string | null
          title: string
          updated_at: string
        }
        Insert: {
          age_at_event?: number | null
          collection_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          lifeline_id: string
          media_suggestion?: string | null
          occurred_on?: string | null
          order_index?: number
          related_lifelines?: string | null
          score?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          summary?: string | null
          tags?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          age_at_event?: number | null
          collection_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          lifeline_id?: string
          media_suggestion?: string | null
          occurred_on?: string | null
          order_index?: number
          related_lifelines?: string | null
          score?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          summary?: string | null
          tags?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_lifeline_id_fkey"
            columns: ["lifeline_id"]
            isOneToOne: false
            referencedRelation: "lifelines"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_media: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          media_id: string
          order_index: number | null
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          media_id: string
          order_index?: number | null
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          media_id?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_media_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_votes: {
        Row: {
          entry_id: string
          id: string
          user_id: string
          user_order: number | null
          user_score: number | null
          voted_at: string
        }
        Insert: {
          entry_id: string
          id?: string
          user_id: string
          user_order?: number | null
          user_score?: number | null
          voted_at?: string
        }
        Update: {
          entry_id?: string
          id?: string
          user_id?: string
          user_order?: number | null
          user_score?: number | null
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeline_tags: {
        Row: {
          lifeline_id: string
          tag_id: string
        }
        Insert: {
          lifeline_id: string
          tag_id: string
        }
        Update: {
          lifeline_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifeline_tags_lifeline_id_fkey"
            columns: ["lifeline_id"]
            isOneToOne: false
            referencedRelation: "lifelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeline_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lifelines: {
        Row: {
          collection_id: string | null
          conclusion: string | null
          cover_image_id: string | null
          created_at: string
          created_by: string | null
          id: string
          intro: string | null
          lifeline_type: Database["public"]["Enums"]["lifeline_type"]
          profile_id: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subtitle: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          collection_id?: string | null
          conclusion?: string | null
          cover_image_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intro?: string | null
          lifeline_type?: Database["public"]["Enums"]["lifeline_type"]
          profile_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          collection_id?: string | null
          conclusion?: string | null
          cover_image_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intro?: string | null
          lifeline_type?: Database["public"]["Enums"]["lifeline_type"]
          profile_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lifelines_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifelines_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifelines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          credit: string | null
          filename: string
          height: number | null
          id: string
          source_url: string | null
          type: string
          updated_at: string
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          credit?: string | null
          filename: string
          height?: number | null
          id?: string
          source_url?: string | null
          type: string
          updated_at?: string
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          credit?: string | null
          filename?: string
          height?: number | null
          id?: string
          source_url?: string | null
          type?: string
          updated_at?: string
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      mock_elections: {
        Row: {
          closes_at: string | null
          collection_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          opens_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          closes_at?: string | null
          collection_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          opens_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          closes_at?: string | null
          collection_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          opens_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "mock_elections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_collections: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          profile_id: string
          role_in_collection: string | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          profile_id: string
          role_in_collection?: string | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          role_in_collection?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_collections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_lifelines: {
        Row: {
          created_at: string
          id: string
          lifeline_id: string
          profile_id: string
          relationship_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lifeline_id: string
          profile_id: string
          relationship_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lifeline_id?: string
          profile_id?: string
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_lifelines_lifeline_id_fkey"
            columns: ["lifeline_id"]
            isOneToOne: false
            referencedRelation: "lifelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_lifelines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_tags: {
        Row: {
          profile_id: string
          tag_id: string
        }
        Insert: {
          profile_id: string
          tag_id: string
        }
        Update: {
          profile_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_image_id: string | null
          birth_date: string | null
          created_at: string
          created_by: string | null
          death_date: string | null
          demographics: Json | null
          display_name: string
          external_links: Json | null
          id: string
          long_bio: string | null
          nationality: string | null
          occupation: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          type: Database["public"]["Enums"]["profile_type"]
          updated_at: string
        }
        Insert: {
          avatar_image_id?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          death_date?: string | null
          demographics?: Json | null
          display_name: string
          external_links?: Json | null
          id?: string
          long_bio?: string | null
          nationality?: string | null
          occupation?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          type: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
        }
        Update: {
          avatar_image_id?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          death_date?: string | null
          demographics?: Json | null
          display_name?: string
          external_links?: Json | null
          id?: string
          long_bio?: string | null
          nationality?: string | null
          occupation?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_image_id_fkey"
            columns: ["avatar_image_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_entry_average_score: {
        Args: { entry_uuid: string }
        Returns: number
      }
      get_entry_vote_count: {
        Args: { entry_uuid: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      content_status: "draft" | "published"
      lifeline_type: "person" | "list" | "voting"
      profile_type:
        | "person_real"
        | "person_fictional"
        | "entity"
        | "organization"
      sentiment_type: "positive" | "negative" | "neutral" | "mixed"
      user_role: "admin" | "editor" | "viewer" | "public_user"
      visibility_type: "public" | "unlisted" | "private"
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
      content_status: ["draft", "published"],
      lifeline_type: ["person", "list", "voting"],
      profile_type: [
        "person_real",
        "person_fictional",
        "entity",
        "organization",
      ],
      sentiment_type: ["positive", "negative", "neutral", "mixed"],
      user_role: ["admin", "editor", "viewer", "public_user"],
      visibility_type: ["public", "unlisted", "private"],
    },
  },
} as const
