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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      build_logs: {
        Row: {
          created_at: string
          id: string
          lesson_id: string | null
          metadata: Json
          mission_id: string | null
          short_description: string
          title: string
          type: Database["public"]["Enums"]["build_log_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json
          mission_id?: string | null
          short_description?: string
          title: string
          type: Database["public"]["Enums"]["build_log_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json
          mission_id?: string | null
          short_description?: string
          title?: string
          type?: Database["public"]["Enums"]["build_log_type"]
          user_id?: string
        }
        Relationships: []
      }
      client_error_logs: {
        Row: {
          created_at: string
          extra: Json | null
          id: string
          message: string
          release: string | null
          scope: string
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          extra?: Json | null
          id?: string
          message: string
          release?: string | null
          scope?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          extra?: Json | null
          id?: string
          message?: string
          release?: string | null
          scope?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_checksum: string | null
          chunk_position: number | null
          content: string
          content_type: string | null
          content_version: string | null
          created_at: string
          embedding: string | null
          id: string
          index_state: string | null
          index_version: string | null
          indexing_failed: boolean
          lesson_id: string | null
          locale: string | null
          metadata: Json
          module_id: string | null
          package_checksum: string | null
          package_path: string | null
          path_id: string | null
          production_route: string | null
          section_index: number | null
          section_role: string | null
          source_id: string
          source_sha: string | null
          source_type: string
          title: string
          updated_at: string
        }
        Insert: {
          chunk_checksum?: string | null
          chunk_position?: number | null
          content: string
          content_type?: string | null
          content_version?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          index_state?: string | null
          index_version?: string | null
          indexing_failed?: boolean
          lesson_id?: string | null
          locale?: string | null
          metadata?: Json
          module_id?: string | null
          package_checksum?: string | null
          package_path?: string | null
          path_id?: string | null
          production_route?: string | null
          section_index?: number | null
          section_role?: string | null
          source_id: string
          source_sha?: string | null
          source_type: string
          title: string
          updated_at?: string
        }
        Update: {
          chunk_checksum?: string | null
          chunk_position?: number | null
          content?: string
          content_type?: string | null
          content_version?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          index_state?: string | null
          index_version?: string | null
          indexing_failed?: boolean
          lesson_id?: string | null
          locale?: string | null
          metadata?: Json
          module_id?: string | null
          package_checksum?: string | null
          package_path?: string | null
          path_id?: string | null
          production_route?: string | null
          section_index?: number | null
          section_role?: string | null
          source_id?: string
          source_sha?: string | null
          source_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learner_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lesson_id: string | null
          metadata: Json
          mission_id: string | null
          module_id: string | null
          path_id: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lesson_id?: string | null
          metadata?: Json
          mission_id?: string | null
          module_id?: string | null
          path_id?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json
          mission_id?: string | null
          module_id?: string | null
          path_id?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learner_triage: {
        Row: {
          created_at: string
          entry_lesson_id: string
          goal: Database["public"]["Enums"]["learner_goal"]
          level: Database["public"]["Enums"]["learner_level"]
          time_avail: Database["public"]["Enums"]["learner_time"]
          track: Database["public"]["Enums"]["learner_track"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_lesson_id: string
          goal: Database["public"]["Enums"]["learner_goal"]
          level: Database["public"]["Enums"]["learner_level"]
          time_avail: Database["public"]["Enums"]["learner_time"]
          track: Database["public"]["Enums"]["learner_track"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_lesson_id?: string
          goal?: Database["public"]["Enums"]["learner_goal"]
          level?: Database["public"]["Enums"]["learner_level"]
          time_avail?: Database["public"]["Enums"]["learner_time"]
          track?: Database["public"]["Enums"]["learner_track"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_feedback: {
        Row: {
          boring: boolean | null
          comment: string | null
          confusing: boolean | null
          created_at: string
          id: string
          lesson_id: string
          momentum_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          boring?: boolean | null
          comment?: string | null
          confusing?: boolean | null
          created_at?: string
          id?: string
          lesson_id: string
          momentum_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          boring?: boolean | null
          comment?: string | null
          confusing?: boolean | null
          created_at?: string
          id?: string
          lesson_id?: string
          momentum_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          status: Database["public"]["Enums"]["lesson_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          status?: Database["public"]["Enums"]["lesson_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          status?: Database["public"]["Enums"]["lesson_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_quiz_attempts: {
        Row: {
          attempted_at: string
          bloom_level: string | null
          id: string
          is_correct: boolean
          lesson_id: string
          question_id: string
          selected_index: number
          user_id: string
        }
        Insert: {
          attempted_at?: string
          bloom_level?: string | null
          id?: string
          is_correct: boolean
          lesson_id: string
          question_id: string
          selected_index: number
          user_id: string
        }
        Update: {
          attempted_at?: string
          bloom_level?: string | null
          id?: string
          is_correct?: boolean
          lesson_id?: string
          question_id?: string
          selected_index?: number
          user_id?: string
        }
        Relationships: []
      }
      lesson_review_schedule: {
        Row: {
          created_at: string
          ease: number
          interval_days: number
          lapses: number
          last_reviewed_at: string | null
          lesson_id: string
          next_review_at: string
          reviews: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ease?: number
          interval_days?: number
          lapses?: number
          last_reviewed_at?: string | null
          lesson_id: string
          next_review_at?: string
          reviews?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ease?: number
          interval_days?: number
          lapses?: number
          last_reviewed_at?: string | null
          lesson_id?: string
          next_review_at?: string
          reviews?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mission_submissions: {
        Row: {
          attempt_count: number
          created_at: string
          evaluated_at: string | null
          feedback: string | null
          id: string
          lesson_id: string | null
          mission_id: string
          score: number | null
          status: Database["public"]["Enums"]["mission_submission_status"]
          submission_metadata: Json
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          evaluated_at?: string | null
          feedback?: string | null
          id?: string
          lesson_id?: string | null
          mission_id: string
          score?: number | null
          status?: Database["public"]["Enums"]["mission_submission_status"]
          submission_metadata?: Json
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          evaluated_at?: string | null
          feedback?: string | null
          id?: string
          lesson_id?: string | null
          mission_id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["mission_submission_status"]
          submission_metadata?: Json
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rag_import_batches: {
        Row: {
          accepted_row_count: number
          attempt_count: number
          batch_ordinal: number
          chunk_count: number
          chunk_offset: number
          created_at: string
          id: string
          last_error_code: string | null
          lease_expires_at: string | null
          lease_token: string | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_row_count?: number
          attempt_count?: number
          batch_ordinal: number
          chunk_count: number
          chunk_offset: number
          created_at?: string
          id?: string
          last_error_code?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          session_id: string
          status: string
          updated_at?: string
        }
        Update: {
          accepted_row_count?: number
          attempt_count?: number
          batch_ordinal?: number
          chunk_count?: number
          chunk_offset?: number
          created_at?: string
          id?: string
          last_error_code?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_import_batches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rag_import_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_import_sessions: {
        Row: {
          accepted_chunk_count: number
          authoritative_lookup_sha256: string
          chunk_manifest_sha256: string
          chunks_sha256: string
          created_at: string
          embedding_dimensions: number
          embedding_model: string
          execution_id: string
          expected_chunk_count: number
          expected_package_count: number
          id: string
          index_version: string
          last_error_code: string | null
          package_manifest_sha256: string
          planned_batch_count: number
          provider_attempt_total: number
          source_sha: string
          status: string
          updated_at: string
          version_key: string
        }
        Insert: {
          accepted_chunk_count?: number
          authoritative_lookup_sha256: string
          chunk_manifest_sha256: string
          chunks_sha256: string
          created_at?: string
          embedding_dimensions: number
          embedding_model: string
          execution_id: string
          expected_chunk_count: number
          expected_package_count: number
          id?: string
          index_version: string
          last_error_code?: string | null
          package_manifest_sha256: string
          planned_batch_count?: number
          provider_attempt_total?: number
          source_sha: string
          status: string
          updated_at?: string
          version_key: string
        }
        Update: {
          accepted_chunk_count?: number
          authoritative_lookup_sha256?: string
          chunk_manifest_sha256?: string
          chunks_sha256?: string
          created_at?: string
          embedding_dimensions?: number
          embedding_model?: string
          execution_id?: string
          expected_chunk_count?: number
          expected_package_count?: number
          id?: string
          index_version?: string
          last_error_code?: string | null
          package_manifest_sha256?: string
          planned_batch_count?: number
          provider_attempt_total?: number
          source_sha?: string
          status?: string
          updated_at?: string
          version_key?: string
        }
        Relationships: []
      }
      rag_index_versions: {
        Row: {
          activated_at: string | null
          chunk_count: number
          chunk_manifest_checksum: string
          created_at: string
          embedding_model: string
          failure_reason: string | null
          id: string
          package_count: number
          source_sha: string
          status: string
          superseded_at: string | null
          version_key: string
        }
        Insert: {
          activated_at?: string | null
          chunk_count?: number
          chunk_manifest_checksum: string
          created_at?: string
          embedding_model?: string
          failure_reason?: string | null
          id?: string
          package_count?: number
          source_sha: string
          status: string
          superseded_at?: string | null
          version_key: string
        }
        Update: {
          activated_at?: string | null
          chunk_count?: number
          chunk_manifest_checksum?: string
          created_at?: string
          embedding_model?: string
          failure_reason?: string | null
          id?: string
          package_count?: number
          source_sha?: string
          status?: string
          superseded_at?: string | null
          version_key?: string
        }
        Relationships: []
      }
      rate_limit_buckets: {
        Row: {
          bucket_key: string
          count: number
          updated_at: string
          user_id: string
          window_started_at: string
        }
        Insert: {
          bucket_key: string
          count?: number
          updated_at?: string
          user_id: string
          window_started_at?: string
        }
        Update: {
          bucket_key?: string
          count?: number
          updated_at?: string
          user_id?: string
          window_started_at?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          phase: Database["public"]["Enums"]["roadmap_phase"]
          sort_order: number
          status: Database["public"]["Enums"]["roadmap_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          phase?: Database["public"]["Enums"]["roadmap_phase"]
          sort_order?: number
          status?: Database["public"]["Enums"]["roadmap_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          phase?: Database["public"]["Enums"]["roadmap_phase"]
          sort_order?: number
          status?: Database["public"]["Enums"]["roadmap_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shadow_watchlist: {
        Row: {
          enabled: boolean
          notes: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          notes?: string | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          notes?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_active_device: {
        Row: {
          device_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          device_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          device_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_time: {
        Row: {
          created_at: string
          id: string
          total_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_status: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          status: Database["public"]["Enums"]["lesson_status_v2"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          status?: Database["public"]["Enums"]["lesson_status_v2"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          status?: Database["public"]["Enums"]["lesson_status_v2"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mission_state: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          state: Database["public"]["Enums"]["mission_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          state?: Database["public"]["Enums"]["mission_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          state?: Database["public"]["Enums"]["mission_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_shadow_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          element_selector: string | null
          element_text: string | null
          event_type: string
          id: string
          metadata: Json
          path: string | null
          scroll_depth: number | null
          session_id: string
          user_id: string
          viewport_h: number | null
          viewport_w: number | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          element_selector?: string | null
          element_text?: string | null
          event_type: string
          id?: string
          metadata?: Json
          path?: string | null
          scroll_depth?: number | null
          session_id: string
          user_id: string
          viewport_h?: number | null
          viewport_w?: number | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          element_selector?: string | null
          element_text?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          path?: string | null
          scroll_depth?: number | null
          session_id?: string
          user_id?: string
          viewport_h?: number | null
          viewport_w?: number | null
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_validation_sessions: {
        Row: {
          created_at: string
          first_3_lessons_completed: boolean
          id: string
          notes: string | null
          reached_wow_within_7min: boolean | null
          started_at: string
          updated_at: string
          user_id: string | null
          user_label: string | null
          wow_moment_at: string | null
        }
        Insert: {
          created_at?: string
          first_3_lessons_completed?: boolean
          id?: string
          notes?: string | null
          reached_wow_within_7min?: boolean | null
          started_at?: string
          updated_at?: string
          user_id?: string | null
          user_label?: string | null
          wow_moment_at?: string | null
        }
        Update: {
          created_at?: string
          first_3_lessons_completed?: boolean
          id?: string
          notes?: string | null
          reached_wow_within_7min?: boolean | null
          started_at?: string
          updated_at?: string
          user_id?: string | null
          user_label?: string | null
          wow_moment_at?: string | null
        }
        Relationships: []
      }
      v9_apply_decisions: {
        Row: {
          decided_at: string
          decided_by: string | null
          decision: string
          lesson_id: string
          new_order: Json | null
          notes: string | null
        }
        Insert: {
          decided_at?: string
          decided_by?: string | null
          decision: string
          lesson_id: string
          new_order?: Json | null
          notes?: string | null
        }
        Update: {
          decided_at?: string
          decided_by?: string | null
          decision?: string
          lesson_id?: string
          new_order?: Json | null
          notes?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_rag_index_version: {
        Args: { p_version_key: string }
        Returns: Json
      }
      apply_review_outcome: {
        Args: { p_lesson_id: string; p_passed: boolean; p_user_id: string }
        Returns: undefined
      }
      claim_active_device: { Args: { p_device_id: string }; Returns: string }
      consume_rate_limit: {
        Args: {
          p_bucket_key: string
          p_max_calls: number
          p_user_id: string
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      delete_my_account_data: { Args: never; Returns: undefined }
      export_my_data: { Args: never; Returns: Json }
      get_admin_insights: { Args: never; Returns: Json }
      get_admin_overview: { Args: never; Returns: Json }
      get_kpi_funnel: { Args: never; Returns: Json }
      get_my_billing_access_tier: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_activity_time: {
        Args: { p_seconds: number }
        Returns: number
      }
      mark_roadmap_done: { Args: { p_item_id: string }; Returns: undefined }
      match_knowledge_chunks: {
        Args: {
          match_count?: number
          min_similarity?: number
          p_lesson_id?: string
          p_module_id?: string
          p_path_id?: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          lesson_id: string
          metadata: Json
          module_id: string
          path_id: string
          similarity: number
          source_id: string
          source_type: string
          title: string
        }[]
      }
      match_locale_knowledge_chunks: {
        Args: {
          match_count?: number
          min_similarity?: number
          p_allow_module_fallback?: boolean
          p_content_version?: string
          p_lesson_id?: string
          p_locale: string
          p_module_id?: string
          p_path_id?: string
          query_embedding: string
        }
        Returns: {
          chunk_checksum: string
          chunk_position: number
          content: string
          content_type: string
          content_version: string
          id: string
          index_version: string
          lesson_id: string
          locale: string
          metadata: Json
          module_id: string
          package_checksum: string
          package_path: string
          path_id: string
          production_route: string
          same_lesson_rank: number
          section_index: number
          section_role: string
          similarity: number
          source_id: string
          source_sha: string
          source_type: string
          title: string
        }[]
      }
      rag_claim_next_import_batch: { Args: never; Returns: Json }
      rag_commit_import_batch: {
        Args: { p_lease_token: string; p_rows: Json }
        Returns: Json
      }
      rag_deactivate_first_active_version: {
        Args: { p_version_key: string }
        Returns: Json
      }
      rag_fail_import_batch: {
        Args: { p_error_code: string; p_lease_token: string }
        Returns: Json
      }
      rag_get_import_evidence: { Args: never; Returns: Json }
      rag_get_import_status: { Args: never; Returns: Json }
      rag_initialize_or_resume_import: { Args: never; Returns: Json }
      rag_locked_provenance: {
        Args: never
        Returns: {
          authoritative_lookup_sha256: string
          batch_size: number
          chunk_manifest_sha256: string
          chunks_sha256: string
          embedding_dimensions: number
          embedding_model: string
          expected_chunk_count: number
          expected_package_count: number
          index_version: string
          max_provider_attempts: number
          package_manifest_sha256: string
          planned_batch_count: number
          source_sha: string
        }[]
      }
      rag_require_service_role: { Args: never; Returns: undefined }
      rag_validate_staging_import: { Args: never; Returns: Json }
      record_user_activity: { Args: never; Returns: Json }
      rollback_rag_index_version: {
        Args: { p_version_key: string }
        Returns: Json
      }
      skip_mission_for_user: {
        Args: { p_lesson_id: string; p_mission_id: string }
        Returns: {
          attempt_count: number
          created_at: string
          evaluated_at: string | null
          feedback: string | null
          id: string
          lesson_id: string | null
          mission_id: string
          score: number | null
          status: Database["public"]["Enums"]["mission_submission_status"]
          submission_metadata: Json
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "mission_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_mission_for_evaluation: {
        Args: { p_submission_id: string }
        Returns: {
          attempt_count: number
          created_at: string
          evaluated_at: string | null
          feedback: string | null
          id: string
          lesson_id: string | null
          mission_id: string
          score: number | null
          status: Database["public"]["Enums"]["mission_submission_status"]
          submission_metadata: Json
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "mission_submissions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      build_log_type:
        | "mission_started"
        | "mission_completed"
        | "lesson_completed"
        | "milestone"
        | "runtime_realization"
      learner_goal: "career" | "money" | "curiosity" | "skill" | "business"
      learner_level: "zero" | "casual" | "advanced"
      learner_time: "5min" | "15min" | "60min"
      learner_track:
        | "beginner"
        | "builder"
        | "money"
        | "explorer"
        | "creator"
        | "automator"
        | "analyst"
        | "business"
      lesson_status: "not-started" | "in-progress" | "completed"
      lesson_status_v2: "locked" | "available" | "in_progress" | "completed"
      mission_state: "locked" | "available" | "started" | "completed"
      mission_submission_status:
        | "draft"
        | "submitted"
        | "evaluating"
        | "needs_revision"
        | "passed"
        | "failed"
      roadmap_phase: "A" | "B" | "C" | "inbox" | "D"
      roadmap_status: "todo" | "in_progress" | "done" | "deferred"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
      build_log_type: [
        "mission_started",
        "mission_completed",
        "lesson_completed",
        "milestone",
        "runtime_realization",
      ],
      learner_goal: ["career", "money", "curiosity", "skill", "business"],
      learner_level: ["zero", "casual", "advanced"],
      learner_time: ["5min", "15min", "60min"],
      learner_track: [
        "beginner",
        "builder",
        "money",
        "explorer",
        "creator",
        "automator",
        "analyst",
        "business",
      ],
      lesson_status: ["not-started", "in-progress", "completed"],
      lesson_status_v2: ["locked", "available", "in_progress", "completed"],
      mission_state: ["locked", "available", "started", "completed"],
      mission_submission_status: [
        "draft",
        "submitted",
        "evaluating",
        "needs_revision",
        "passed",
        "failed",
      ],
      roadmap_phase: ["A", "B", "C", "inbox", "D"],
      roadmap_status: ["todo", "in_progress", "done", "deferred"],
    },
  },
} as const
