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
      action_cards: {
        Row: {
          behavior_description: string | null
          behavior_type: string | null
          created_at: string
          default_order: number | null
          description: string | null
          icon_name: string | null
          icon_url: string | null
          id: string
          implementation_notes: string | null
          is_default: boolean | null
          is_implemented: boolean | null
          name: string
          slug: string
          static_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          behavior_description?: string | null
          behavior_type?: string | null
          created_at?: string
          default_order?: number | null
          description?: string | null
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          implementation_notes?: string | null
          is_default?: boolean | null
          is_implemented?: boolean | null
          name: string
          slug: string
          static_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          behavior_description?: string | null
          behavior_type?: string | null
          created_at?: string
          default_order?: number | null
          description?: string | null
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          implementation_notes?: string | null
          is_default?: boolean | null
          is_implemented?: boolean | null
          name?: string
          slug?: string
          static_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
        ]
      }
      book_content: {
        Row: {
          book_id: string
          chapter_reference: string | null
          comments: number | null
          content: string
          content_type: string
          created_at: string | null
          extended_data: Json | null
          id: string
          likes: number | null
          order_index: number | null
          rating: number | null
          related_to: string[] | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          visual_type: string | null
        }
        Insert: {
          book_id: string
          chapter_reference?: string | null
          comments?: number | null
          content: string
          content_type: string
          created_at?: string | null
          extended_data?: Json | null
          id?: string
          likes?: number | null
          order_index?: number | null
          rating?: number | null
          related_to?: string[] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          visual_type?: string | null
        }
        Update: {
          book_id?: string
          chapter_reference?: string | null
          comments?: number | null
          content?: string
          content_type?: string
          created_at?: string | null
          extended_data?: Json | null
          id?: string
          likes?: number | null
          order_index?: number | null
          rating?: number | null
          related_to?: string[] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          visual_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_content_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author_name: string
          author_profile_id: string | null
          core_thesis: string | null
          cover_image_id: string | null
          cover_image_path: string | null
          cover_image_url: string | null
          created_at: string | null
          genre: string | null
          id: string
          isbn: string | null
          key_themes: string[] | null
          one_sentence_summary: string | null
          page_count: number | null
          publication_year: number | null
          slug: string
          status: string | null
          subtitle: string | null
          theme_color: string | null
          title: string
          updated_at: string | null
          who_should_read: string | null
        }
        Insert: {
          author_name: string
          author_profile_id?: string | null
          core_thesis?: string | null
          cover_image_id?: string | null
          cover_image_path?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          genre?: string | null
          id?: string
          isbn?: string | null
          key_themes?: string[] | null
          one_sentence_summary?: string | null
          page_count?: number | null
          publication_year?: number | null
          slug: string
          status?: string | null
          subtitle?: string | null
          theme_color?: string | null
          title: string
          updated_at?: string | null
          who_should_read?: string | null
        }
        Update: {
          author_name?: string
          author_profile_id?: string | null
          core_thesis?: string | null
          cover_image_id?: string | null
          cover_image_path?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          genre?: string | null
          id?: string
          isbn?: string | null
          key_themes?: string[] | null
          one_sentence_summary?: string | null
          page_count?: number | null
          publication_year?: number | null
          slug?: string
          status?: string | null
          subtitle?: string | null
          theme_color?: string | null
          title?: string
          updated_at?: string | null
          who_should_read?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_action_cards: {
        Row: {
          action_card_id: string
          collection_id: string
          created_at: string
          display_order: number | null
          id: string
          is_enabled: boolean | null
          label_override: string | null
          updated_at: string
        }
        Insert: {
          action_card_id: string
          collection_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          label_override?: string | null
          updated_at?: string
        }
        Update: {
          action_card_id?: string
          collection_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          label_override?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_action_cards_action_card_id_fkey"
            columns: ["action_card_id"]
            isOneToOne: false
            referencedRelation: "action_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_action_cards_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_custom_section_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          order_index: number
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          order_index?: number
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_custom_section_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_featured_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          order_index: number
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          order_index?: number
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_featured_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_invites: {
        Row: {
          accepted_at: string | null
          collection_id: string
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          collection_id: string
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          collection_id?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_invites_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_members: {
        Row: {
          collection_id: string
          hidden_from_list: boolean
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          collection_id: string
          hidden_from_list?: boolean
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          collection_id?: string
          hidden_from_list?: boolean
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_members_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_ownership_requests: {
        Row: {
          admin_notes: string | null
          claim_reason: string
          collection_id: string
          created_at: string
          email: string
          id: string
          proof_links: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          claim_reason: string
          collection_id: string
          created_at?: string
          email: string
          id?: string
          proof_links?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          claim_reason?: string
          collection_id?: string
          created_at?: string
          email?: string
          id?: string
          proof_links?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_ownership_requests_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_quotes: {
        Row: {
          admin_message: string | null
          author: string | null
          author_profile_id: string | null
          author_profile_ids: string[] | null
          collection_id: string
          context: string | null
          contributed_by_user_id: string | null
          contribution_status: string | null
          created_at: string
          id: string
          quote: string
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string | null
        }
        Insert: {
          admin_message?: string | null
          author?: string | null
          author_profile_id?: string | null
          author_profile_ids?: string[] | null
          collection_id: string
          context?: string | null
          contributed_by_user_id?: string | null
          contribution_status?: string | null
          created_at?: string
          id?: string
          quote: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
        }
        Update: {
          admin_message?: string | null
          author?: string | null
          author_profile_id?: string | null
          author_profile_ids?: string[] | null
          collection_id?: string
          context?: string | null
          contributed_by_user_id?: string | null
          contribution_status?: string | null
          created_at?: string
          id?: string
          quote?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_quotes_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_quotes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_roles: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_roles_collection_id_fkey"
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
          actions_bg_color: string | null
          actions_border_color: string | null
          actions_icon_color: string | null
          actions_text_color: string | null
          award_bg_color: string | null
          award_border_color: string | null
          award_heading_icon: string | null
          award_heading_tag: string | null
          award_heading_text: string | null
          award_icon_color: string | null
          award_title_text: string | null
          banner_text_color: string | null
          card_image_path: string | null
          card_image_position_x: number | null
          card_image_position_y: number | null
          card_image_url: string | null
          card_text_color: string | null
          category: string | null
          collection_accent_color: string | null
          collection_badge_color: string | null
          collection_bg_color: string | null
          collection_border_color: string | null
          collection_card_bg: string | null
          collection_heading_color: string | null
          collection_muted_text: string | null
          collection_text_color: string | null
          color_scheme_id: string | null
          created_at: string
          created_by: string | null
          custom_section_name: string | null
          default_color: string | null
          description: string | null
          entry_bg_color: string | null
          entry_button_color: string | null
          entry_contributor_button: string | null
          entry_header_bg: string | null
          entry_header_text: string | null
          entry_title_text: string | null
          graph_bg_color: string | null
          graph_highlight_color: string | null
          graph_line_color: string | null
          hero_image_id: string | null
          hero_image_path: string | null
          hero_image_position_x: number | null
          hero_image_position_y: number | null
          hero_image_url: string | null
          home_hidden: boolean | null
          id: string
          is_featured: boolean | null
          last_monitored_at: string | null
          lifeline_display_bg: string | null
          lifeline_display_border: string | null
          lifeline_display_title_text: string | null
          link_color: string | null
          link_hover_color: string | null
          media_enabled: boolean
          menu_active_color: string | null
          menu_hover_color: string | null
          menu_text_color: string | null
          monitoring_enabled: boolean | null
          monitoring_interval: string | null
          nav_button_color: string | null
          pitch_enabled: boolean | null
          primary_color: string | null
          profile_card_bg: string | null
          profile_card_border: string | null
          profile_header_bg: string | null
          profile_header_text: string | null
          quote_frequency: number | null
          quotes_enabled: boolean | null
          secondary_color: string | null
          show_action_cards: boolean | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          style_notes: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
          web_primary: string | null
          web_secondary: string | null
        }
        Insert: {
          actions_bg_color?: string | null
          actions_border_color?: string | null
          actions_icon_color?: string | null
          actions_text_color?: string | null
          award_bg_color?: string | null
          award_border_color?: string | null
          award_heading_icon?: string | null
          award_heading_tag?: string | null
          award_heading_text?: string | null
          award_icon_color?: string | null
          award_title_text?: string | null
          banner_text_color?: string | null
          card_image_path?: string | null
          card_image_position_x?: number | null
          card_image_position_y?: number | null
          card_image_url?: string | null
          card_text_color?: string | null
          category?: string | null
          collection_accent_color?: string | null
          collection_badge_color?: string | null
          collection_bg_color?: string | null
          collection_border_color?: string | null
          collection_card_bg?: string | null
          collection_heading_color?: string | null
          collection_muted_text?: string | null
          collection_text_color?: string | null
          color_scheme_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_section_name?: string | null
          default_color?: string | null
          description?: string | null
          entry_bg_color?: string | null
          entry_button_color?: string | null
          entry_contributor_button?: string | null
          entry_header_bg?: string | null
          entry_header_text?: string | null
          entry_title_text?: string | null
          graph_bg_color?: string | null
          graph_highlight_color?: string | null
          graph_line_color?: string | null
          hero_image_id?: string | null
          hero_image_path?: string | null
          hero_image_position_x?: number | null
          hero_image_position_y?: number | null
          hero_image_url?: string | null
          home_hidden?: boolean | null
          id?: string
          is_featured?: boolean | null
          last_monitored_at?: string | null
          lifeline_display_bg?: string | null
          lifeline_display_border?: string | null
          lifeline_display_title_text?: string | null
          link_color?: string | null
          link_hover_color?: string | null
          media_enabled?: boolean
          menu_active_color?: string | null
          menu_hover_color?: string | null
          menu_text_color?: string | null
          monitoring_enabled?: boolean | null
          monitoring_interval?: string | null
          nav_button_color?: string | null
          pitch_enabled?: boolean | null
          primary_color?: string | null
          profile_card_bg?: string | null
          profile_card_border?: string | null
          profile_header_bg?: string | null
          profile_header_text?: string | null
          quote_frequency?: number | null
          quotes_enabled?: boolean | null
          secondary_color?: string | null
          show_action_cards?: boolean | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          style_notes?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          web_primary?: string | null
          web_secondary?: string | null
        }
        Update: {
          actions_bg_color?: string | null
          actions_border_color?: string | null
          actions_icon_color?: string | null
          actions_text_color?: string | null
          award_bg_color?: string | null
          award_border_color?: string | null
          award_heading_icon?: string | null
          award_heading_tag?: string | null
          award_heading_text?: string | null
          award_icon_color?: string | null
          award_title_text?: string | null
          banner_text_color?: string | null
          card_image_path?: string | null
          card_image_position_x?: number | null
          card_image_position_y?: number | null
          card_image_url?: string | null
          card_text_color?: string | null
          category?: string | null
          collection_accent_color?: string | null
          collection_badge_color?: string | null
          collection_bg_color?: string | null
          collection_border_color?: string | null
          collection_card_bg?: string | null
          collection_heading_color?: string | null
          collection_muted_text?: string | null
          collection_text_color?: string | null
          color_scheme_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_section_name?: string | null
          default_color?: string | null
          description?: string | null
          entry_bg_color?: string | null
          entry_button_color?: string | null
          entry_contributor_button?: string | null
          entry_header_bg?: string | null
          entry_header_text?: string | null
          entry_title_text?: string | null
          graph_bg_color?: string | null
          graph_highlight_color?: string | null
          graph_line_color?: string | null
          hero_image_id?: string | null
          hero_image_path?: string | null
          hero_image_position_x?: number | null
          hero_image_position_y?: number | null
          hero_image_url?: string | null
          home_hidden?: boolean | null
          id?: string
          is_featured?: boolean | null
          last_monitored_at?: string | null
          lifeline_display_bg?: string | null
          lifeline_display_border?: string | null
          lifeline_display_title_text?: string | null
          link_color?: string | null
          link_hover_color?: string | null
          media_enabled?: boolean
          menu_active_color?: string | null
          menu_hover_color?: string | null
          menu_text_color?: string | null
          monitoring_enabled?: boolean | null
          monitoring_interval?: string | null
          nav_button_color?: string | null
          pitch_enabled?: boolean | null
          primary_color?: string | null
          profile_card_bg?: string | null
          profile_card_border?: string | null
          profile_header_bg?: string | null
          profile_header_text?: string | null
          quote_frequency?: number | null
          quotes_enabled?: boolean | null
          secondary_color?: string | null
          show_action_cards?: boolean | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          style_notes?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
          web_primary?: string | null
          web_secondary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_color_scheme_id_fkey"
            columns: ["color_scheme_id"]
            isOneToOne: false
            referencedRelation: "color_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_hero_image_id_fkey"
            columns: ["hero_image_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      color_schemes: {
        Row: {
          award_bg: string | null
          award_border: string | null
          award_category_bg: string | null
          award_item_bg: string | null
          award_text: string | null
          cards_bg: string | null
          cards_border: string | null
          cards_text: string | null
          ch_actions_bg: string | null
          ch_actions_border: string | null
          ch_actions_icon: string | null
          ch_actions_text: string | null
          ch_banner_text: string | null
          created_at: string | null
          dark_text_color: string | null
          description: string | null
          filter_controls_text: string | null
          id: string
          is_default: boolean | null
          light_text_color: string | null
          ll_display_bg: string
          ll_display_title_text: string
          ll_entry_contributor_button: string
          ll_entry_title_text: string | null
          ll_graph_bg: string | null
          ll_graph_negative: string
          ll_graph_positive: string
          name: string
          nav_bg_color: string
          nav_button_color: string
          nav_text_color: string
          page_bg: string | null
          person_name_accent: string | null
          profile_label_text: string | null
          profile_text: string | null
          title_text: string | null
          updated_at: string | null
        }
        Insert: {
          award_bg?: string | null
          award_border?: string | null
          award_category_bg?: string | null
          award_item_bg?: string | null
          award_text?: string | null
          cards_bg?: string | null
          cards_border?: string | null
          cards_text?: string | null
          ch_actions_bg?: string | null
          ch_actions_border?: string | null
          ch_actions_icon?: string | null
          ch_actions_text?: string | null
          ch_banner_text?: string | null
          created_at?: string | null
          dark_text_color?: string | null
          description?: string | null
          filter_controls_text?: string | null
          id?: string
          is_default?: boolean | null
          light_text_color?: string | null
          ll_display_bg?: string
          ll_display_title_text?: string
          ll_entry_contributor_button?: string
          ll_entry_title_text?: string | null
          ll_graph_bg?: string | null
          ll_graph_negative?: string
          ll_graph_positive?: string
          name: string
          nav_bg_color?: string
          nav_button_color?: string
          nav_text_color?: string
          page_bg?: string | null
          person_name_accent?: string | null
          profile_label_text?: string | null
          profile_text?: string | null
          title_text?: string | null
          updated_at?: string | null
        }
        Update: {
          award_bg?: string | null
          award_border?: string | null
          award_category_bg?: string | null
          award_item_bg?: string | null
          award_text?: string | null
          cards_bg?: string | null
          cards_border?: string | null
          cards_text?: string | null
          ch_actions_bg?: string | null
          ch_actions_border?: string | null
          ch_actions_icon?: string | null
          ch_actions_text?: string | null
          ch_banner_text?: string | null
          created_at?: string | null
          dark_text_color?: string | null
          description?: string | null
          filter_controls_text?: string | null
          id?: string
          is_default?: boolean | null
          light_text_color?: string | null
          ll_display_bg?: string
          ll_display_title_text?: string
          ll_entry_contributor_button?: string
          ll_entry_title_text?: string | null
          ll_graph_bg?: string | null
          ll_graph_negative?: string
          ll_graph_positive?: string
          name?: string
          nav_bg_color?: string
          nav_button_color?: string
          nav_text_color?: string
          page_bg?: string | null
          person_name_accent?: string | null
          profile_label_text?: string | null
          profile_text?: string | null
          title_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          winner_profile_ids: string[] | null
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
          winner_profile_ids?: string[] | null
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
          winner_profile_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "election_results_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "mock_elections"
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
      entities: {
        Row: {
          alternate_names: string[] | null
          canonical_slug: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          primary_name: string
          updated_at: string | null
        }
        Insert: {
          alternate_names?: string[] | null
          canonical_slug?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          primary_name: string
          updated_at?: string | null
        }
        Update: {
          alternate_names?: string[] | null
          canonical_slug?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          primary_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      entity_appearances: {
        Row: {
          appearance_type: string
          collection_id: string | null
          created_at: string | null
          entity_id: string
          entry_id: string | null
          id: string
          lifeline_id: string | null
          profile_id: string | null
          quote_id: string | null
        }
        Insert: {
          appearance_type: string
          collection_id?: string | null
          created_at?: string | null
          entity_id: string
          entry_id?: string | null
          id?: string
          lifeline_id?: string | null
          profile_id?: string | null
          quote_id?: string | null
        }
        Update: {
          appearance_type?: string
          collection_id?: string | null
          created_at?: string | null
          entity_id?: string
          entry_id?: string | null
          id?: string
          lifeline_id?: string | null
          profile_id?: string | null
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_appearances_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_appearances_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "entity_appearances_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entity_registry"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "entity_appearances_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_appearances_lifeline_id_fkey"
            columns: ["lifeline_id"]
            isOneToOne: false
            referencedRelation: "lifelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_appearances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_appearances_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "collection_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          age_at_event: number | null
          collection_id: string | null
          contributed_by_user_id: string | null
          contribution_status: string | null
          created_at: string
          date_precision: string | null
          details: string | null
          id: string
          is_fan_contributed: boolean | null
          lifeline_id: string
          media_suggestion: string | null
          occurred_on: string | null
          order_index: number
          origin: string | null
          related_lifelines: string | null
          score: number | null
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          sequence_label: string | null
          serpapi_query: string | null
          summary: string | null
          tags: string | null
          title: string
          updated_at: string
        }
        Insert: {
          age_at_event?: number | null
          collection_id?: string | null
          contributed_by_user_id?: string | null
          contribution_status?: string | null
          created_at?: string
          date_precision?: string | null
          details?: string | null
          id?: string
          is_fan_contributed?: boolean | null
          lifeline_id: string
          media_suggestion?: string | null
          occurred_on?: string | null
          order_index?: number
          origin?: string | null
          related_lifelines?: string | null
          score?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          sequence_label?: string | null
          serpapi_query?: string | null
          summary?: string | null
          tags?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          age_at_event?: number | null
          collection_id?: string | null
          contributed_by_user_id?: string | null
          contribution_status?: string | null
          created_at?: string
          date_precision?: string | null
          details?: string | null
          id?: string
          is_fan_contributed?: boolean | null
          lifeline_id?: string
          media_suggestion?: string | null
          occurred_on?: string | null
          order_index?: number
          origin?: string | null
          related_lifelines?: string | null
          score?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          sequence_label?: string | null
          serpapi_query?: string | null
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
      entry_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          entry_id: string
          id: string
          image_path: string
          image_url: string
          locked: boolean
          order_index: number | null
          position_x: number | null
          position_y: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          entry_id: string
          id?: string
          image_path: string
          image_url: string
          locked?: boolean
          order_index?: number | null
          position_x?: number | null
          position_y?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          entry_id?: string
          id?: string
          image_path?: string
          image_url?: string
          locked?: boolean
          order_index?: number | null
          position_x?: number | null
          position_y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_images_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_media: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          locked: boolean
          media_id: string
          order_index: number | null
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          locked?: boolean
          media_id: string
          order_index?: number | null
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          locked?: boolean
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
      fan_contributions: {
        Row: {
          admin_message: string | null
          contribution_type: string
          created_at: string | null
          description: string | null
          entry_id: string | null
          entry_ref: string | null
          id: string
          lifeline_id: string
          media_id: string | null
          quote_author: string | null
          quote_author_profile_id: string | null
          quote_context: string | null
          quote_text: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          admin_message?: string | null
          contribution_type?: string
          created_at?: string | null
          description?: string | null
          entry_id?: string | null
          entry_ref?: string | null
          id?: string
          lifeline_id: string
          media_id?: string | null
          quote_author?: string | null
          quote_author_profile_id?: string | null
          quote_context?: string | null
          quote_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          admin_message?: string | null
          contribution_type?: string
          created_at?: string | null
          description?: string | null
          entry_id?: string | null
          entry_ref?: string | null
          id?: string
          lifeline_id?: string
          media_id?: string | null
          quote_author?: string | null
          quote_author_profile_id?: string | null
          quote_context?: string | null
          quote_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_contributions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_contributions_entry_ref_fkey"
            columns: ["entry_ref"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_contributions_lifeline_id_fkey"
            columns: ["lifeline_id"]
            isOneToOne: false
            referencedRelation: "lifelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_contributions_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_contributions_quote_author_profile_id_fkey"
            columns: ["quote_author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      home_page_featured_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          order_index?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          order_index?: number
        }
        Relationships: []
      }
      home_page_new_content_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          order_index?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          order_index?: number
        }
        Relationships: []
      }
      home_page_settings: {
        Row: {
          created_at: string
          custom_section_name: string | null
          hero_image_id: string | null
          hero_image_path: string | null
          hero_image_position_x: number | null
          hero_image_position_y: number | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_section_name?: string | null
          hero_image_id?: string | null
          hero_image_path?: string | null
          hero_image_position_x?: number | null
          hero_image_position_y?: number | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_section_name?: string | null
          hero_image_id?: string | null
          hero_image_path?: string | null
          hero_image_position_x?: number | null
          hero_image_position_y?: number | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_page_settings_hero_image_id_fkey"
            columns: ["hero_image_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeline_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          chronological_mode: string | null
          collection_id: string | null
          conclusion: string | null
          cover_image_id: string | null
          cover_image_path: string | null
          cover_image_position_x: number | null
          cover_image_position_y: number | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          id: string
          intro: string | null
          is_featured: boolean | null
          lifeline_type: Database["public"]["Enums"]["lifeline_type"]
          profile_id: string | null
          serpapi_query: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subject: string | null
          subtitle: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          chronological_mode?: string | null
          collection_id?: string | null
          conclusion?: string | null
          cover_image_id?: string | null
          cover_image_path?: string | null
          cover_image_position_x?: number | null
          cover_image_position_y?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          intro?: string | null
          is_featured?: boolean | null
          lifeline_type?: Database["public"]["Enums"]["lifeline_type"]
          profile_id?: string | null
          serpapi_query?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subject?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          chronological_mode?: string | null
          collection_id?: string | null
          conclusion?: string | null
          cover_image_id?: string | null
          cover_image_path?: string | null
          cover_image_position_x?: number | null
          cover_image_position_y?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          intro?: string | null
          is_featured?: boolean | null
          lifeline_type?: Database["public"]["Enums"]["lifeline_type"]
          profile_id?: string | null
          serpapi_query?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subject?: string | null
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
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          card_position_x: number | null
          card_position_y: number | null
          card_scale: number | null
          collection_tags: string[] | null
          created_at: string
          created_by: string | null
          credit: string | null
          filename: string
          height: number | null
          id: string
          position_x: number | null
          position_y: number | null
          scale: number | null
          source_url: string | null
          type: string
          updated_at: string
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          card_position_x?: number | null
          card_position_y?: number | null
          card_scale?: number | null
          collection_tags?: string[] | null
          created_at?: string
          created_by?: string | null
          credit?: string | null
          filename: string
          height?: number | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          scale?: number | null
          source_url?: string | null
          type: string
          updated_at?: string
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          card_position_x?: number | null
          card_position_y?: number | null
          card_scale?: number | null
          collection_tags?: string[] | null
          created_at?: string
          created_by?: string | null
          credit?: string | null
          filename?: string
          height?: number | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          scale?: number | null
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
          hero_image_path: string | null
          hero_image_position_x: number | null
          hero_image_position_y: number | null
          hero_image_url: string | null
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
          hero_image_path?: string | null
          hero_image_position_x?: number | null
          hero_image_position_y?: number | null
          hero_image_url?: string | null
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
          hero_image_path?: string | null
          hero_image_position_x?: number | null
          hero_image_position_y?: number | null
          hero_image_url?: string | null
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
      monitoring_runs: {
        Row: {
          collection_id: string | null
          collection_slug: string
          completed_at: string | null
          error_message: string | null
          events_found: number | null
          events_published: number | null
          events_skipped: number | null
          id: string
          run_log: Json | null
          started_at: string | null
          status: string | null
          subjects_checked: Json | null
        }
        Insert: {
          collection_id?: string | null
          collection_slug: string
          completed_at?: string | null
          error_message?: string | null
          events_found?: number | null
          events_published?: number | null
          events_skipped?: number | null
          id?: string
          run_log?: Json | null
          started_at?: string | null
          status?: string | null
          subjects_checked?: Json | null
        }
        Update: {
          collection_id?: string | null
          collection_slug?: string
          completed_at?: string | null
          error_message?: string | null
          events_found?: number | null
          events_published?: number | null
          events_skipped?: number | null
          id?: string
          run_log?: Json | null
          started_at?: string | null
          status?: string | null
          subjects_checked?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_runs_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_layout_items: {
        Row: {
          created_at: string
          custom_image_position_x: number | null
          custom_image_position_y: number | null
          custom_image_url: string | null
          custom_link: string | null
          custom_subtitle: string | null
          custom_title: string | null
          display_order: number
          id: string
          item_id: string
          item_type: string
          layout_id: string
          section_id: string | null
        }
        Insert: {
          created_at?: string
          custom_image_position_x?: number | null
          custom_image_position_y?: number | null
          custom_image_url?: string | null
          custom_link?: string | null
          custom_subtitle?: string | null
          custom_title?: string | null
          display_order?: number
          id?: string
          item_id: string
          item_type: string
          layout_id: string
          section_id?: string | null
        }
        Update: {
          created_at?: string
          custom_image_position_x?: number | null
          custom_image_position_y?: number | null
          custom_image_url?: string | null
          custom_link?: string | null
          custom_subtitle?: string | null
          custom_title?: string | null
          display_order?: number
          id?: string
          item_id?: string
          item_type?: string
          layout_id?: string
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_layout_items_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "page_layouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_layout_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "page_layout_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      page_layout_sections: {
        Row: {
          columns_count: number
          created_at: string
          display_order: number
          id: string
          layout_id: string
          section_title: string | null
        }
        Insert: {
          columns_count?: number
          created_at?: string
          display_order?: number
          id?: string
          layout_id: string
          section_title?: string | null
        }
        Update: {
          columns_count?: number
          created_at?: string
          display_order?: number
          id?: string
          layout_id?: string
          section_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_layout_sections_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "page_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      page_layouts: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          page_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          page_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          page_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_books: {
        Row: {
          book_id: string
          created_at: string | null
          display_order: number | null
          id: string
          profile_id: string
          relationship_type: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          profile_id: string
          relationship_type?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          profile_id?: string
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_books_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_collections: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          is_featured: boolean | null
          profile_id: string
          role_in_collection: string | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          profile_id: string
          role_in_collection?: string | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
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
      profile_relationships: {
        Row: {
          context: string | null
          created_at: string
          id: string
          profile_id: string
          related_profile_id: string | null
          relationship_type: string
          target_name: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          profile_id: string
          related_profile_id?: string | null
          relationship_type: string
          target_name?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          related_profile_id?: string | null
          relationship_type?: string
          target_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_relationships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_relationships_related_profile_id_fkey"
            columns: ["related_profile_id"]
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
      profile_works: {
        Row: {
          additional_info: Json | null
          created_at: string
          id: string
          profile_id: string
          significance: string | null
          title: string
          updated_at: string
          work_category: string
          work_type: string | null
          year: string | null
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string
          id?: string
          profile_id: string
          significance?: string | null
          title: string
          updated_at?: string
          work_category: string
          work_type?: string | null
          year?: string | null
        }
        Update: {
          additional_info?: Json | null
          created_at?: string
          id?: string
          profile_id?: string
          significance?: string | null
          title?: string
          updated_at?: string
          work_category?: string
          work_type?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_works_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_image_id: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          extended_data: Json
          id: string
          image_query: string | null
          known_for: string[]
          long_description: string | null
          name: string
          primary_collection_id: string | null
          primary_image_path: string | null
          primary_image_url: string | null
          primary_lifeline_id: string | null
          prominence_score: number | null
          reality_status: string
          short_description: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subject_status: string | null
          subject_type: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          avatar_image_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          extended_data?: Json
          id?: string
          image_query?: string | null
          known_for?: string[]
          long_description?: string | null
          name: string
          primary_collection_id?: string | null
          primary_image_path?: string | null
          primary_image_url?: string | null
          primary_lifeline_id?: string | null
          prominence_score?: number | null
          reality_status: string
          short_description: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subject_status?: string | null
          subject_type: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          avatar_image_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          extended_data?: Json
          id?: string
          image_query?: string | null
          known_for?: string[]
          long_description?: string | null
          name?: string
          primary_collection_id?: string | null
          primary_image_path?: string | null
          primary_image_url?: string | null
          primary_lifeline_id?: string | null
          prominence_score?: number | null
          reality_status?: string
          short_description?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subject_status?: string | null
          subject_type?: string
          tags?: string[]
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
          {
            foreignKeyName: "profiles_primary_collection_id_fkey"
            columns: ["primary_collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_primary_lifeline_id_fkey"
            columns: ["primary_lifeline_id"]
            isOneToOne: false
            referencedRelation: "lifelines"
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
      user_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feed_seen: {
        Row: {
          entry_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          entry_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          entry_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feed_subscriptions: {
        Row: {
          created_at: string
          id: string
          lifeline_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifeline_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifeline_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feed_subscriptions_lifeline_id_fkey"
            columns: ["lifeline_id"]
            isOneToOne: false
            referencedRelation: "lifelines"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          hide_contribution_button: boolean | null
          hide_person_lifeline_disclaimer: boolean | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hide_contribution_button?: boolean | null
          hide_person_lifeline_disclaimer?: boolean | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hide_contribution_button?: boolean | null
          hide_person_lifeline_disclaimer?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          request_details: string
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          request_details: string
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          request_details?: string
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      entity_registry: {
        Row: {
          alternate_names: string[] | null
          appearances: Json[] | null
          canonical_slug: string | null
          entity_id: string | null
          entity_type: string | null
          metadata: Json | null
          primary_name: string | null
        }
        Relationships: []
      }
      public_contributors: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          last_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          last_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          last_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_collection_invite: { Args: { p_invite_id: string }; Returns: Json }
      calculate_entry_average_score: {
        Args: { entry_uuid: string }
        Returns: number
      }
      can_edit_collection: {
        Args: { p_collection_id: string }
        Returns: boolean
      }
      get_entry_vote_count: { Args: { entry_uuid: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_fan: { Args: { check_user_id: string }; Returns: boolean }
      toggle_super_fan: {
        Args: { is_super_fan: boolean; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      content_status: "draft" | "published"
      lifeline_type: "person" | "list" | "voting" | "event" | "org" | "rating"
      profile_type:
        | "person_real"
        | "person_fictional"
        | "entity"
        | "organization"
      sentiment_type: "positive" | "negative" | "neutral" | "mixed"
      user_role: "admin" | "editor" | "viewer" | "public_user" | "super_fan"
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
      lifeline_type: ["person", "list", "voting", "event", "org", "rating"],
      profile_type: [
        "person_real",
        "person_fictional",
        "entity",
        "organization",
      ],
      sentiment_type: ["positive", "negative", "neutral", "mixed"],
      user_role: ["admin", "editor", "viewer", "public_user", "super_fan"],
      visibility_type: ["public", "unlisted", "private"],
    },
  },
} as const
