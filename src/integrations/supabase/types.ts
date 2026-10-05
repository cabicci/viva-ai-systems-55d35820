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
      account_welcome_outbox: {
        Row: {
          blocked: boolean
          claim_token: string | null
          created_at: string
          display_name: string | null
          first_attempt_at: string | null
          lease_until: string | null
          preferred_locale: string | null
          provider_email_id: string | null
          recipient: string
          template_version: number
          user_id: string
        }
        Insert: {
          blocked?: boolean
          claim_token?: string | null
          created_at?: string
          display_name?: string | null
          first_attempt_at?: string | null
          lease_until?: string | null
          preferred_locale?: string | null
          provider_email_id?: string | null
          recipient: string
          template_version?: number
          user_id: string
        }
        Update: {
          blocked?: boolean
          claim_token?: string | null
          created_at?: string
          display_name?: string | null
          first_attempt_at?: string | null
          lease_until?: string | null
          preferred_locale?: string | null
          provider_email_id?: string | null
          recipient?: string
          template_version?: number
          user_id?: string
        }
        Relationships: []
      }
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
      contact_acknowledgement_outbox: {
        Row: {
          blocked: boolean
          claim_token: string | null
          created_at: string
          first_attempt_at: string | null
          html_body: string
          id: string
          lease_until: string | null
          locale: string
          provider_email_id: string | null
          receipt_at: string | null
          receipt_type: string | null
          recipient: string
          stream: string
          subject: string
          text_body: string
        }
        Insert: {
          blocked?: boolean
          claim_token?: string | null
          created_at?: string
          first_attempt_at?: string | null
          html_body: string
          id: string
          lease_until?: string | null
          locale: string
          provider_email_id?: string | null
          receipt_at?: string | null
          receipt_type?: string | null
          recipient: string
          stream: string
          subject: string
          text_body: string
        }
        Update: {
          blocked?: boolean
          claim_token?: string | null
          created_at?: string
          first_attempt_at?: string | null
          html_body?: string
          id?: string
          lease_until?: string | null
          locale?: string
          provider_email_id?: string | null
          receipt_at?: string | null
          receipt_type?: string | null
          recipient?: string
          stream?: string
          subject?: string
          text_body?: string
        }
        Relationships: []
      }
      contact_mail_receipts: {
        Row: {
          event_id: string
          event_type: string
          occurred_at: string
          outbox_id: string
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          occurred_at: string
          outbox_id: string
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          occurred_at?: string
          outbox_id?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_mail_receipts_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "contact_acknowledgement_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_consent_policies: {
        Row: {
          consent_text: string
          country_code: string
          enabled: boolean
          id: string
          locale: string
          notice_text: string
          published_at: string
          review_reference: string
          version: string
        }
        Insert: {
          consent_text: string
          country_code: string
          enabled?: boolean
          id?: string
          locale: string
          notice_text: string
          published_at?: string
          review_reference: string
          version: string
        }
        Update: {
          consent_text?: string
          country_code?: string
          enabled?: boolean
          id?: string
          locale?: string
          notice_text?: string
          published_at?: string
          review_reference?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_consent_policies_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "kids_market_release"
            referencedColumns: ["country_code"]
          },
        ]
      }
      kids_content_approvals: {
        Row: {
          approval_reference: string
          approved_at: string
          approved_sha256: string
          lesson_number: number
          level_id: string
          locale: string
        }
        Insert: {
          approval_reference: string
          approved_at: string
          approved_sha256: string
          lesson_number: number
          level_id: string
          locale: string
        }
        Update: {
          approval_reference?: string
          approved_at?: string
          approved_sha256?: string
          lesson_number?: number
          level_id?: string
          locale?: string
        }
        Relationships: []
      }
      kids_family_entitlements: {
        Row: {
          active_from: string
          active_until: string
          entitlement_reference: string
          parent_id: string
        }
        Insert: {
          active_from: string
          active_until: string
          entitlement_reference: string
          parent_id: string
        }
        Update: {
          active_from?: string
          active_until?: string
          entitlement_reference?: string
          parent_id?: string
        }
        Relationships: []
      }
      kids_lesson_progress: {
        Row: {
          lesson_number: number
          level_id: string
          locale: string
          profile_id: string
          recorded_at: string
        }
        Insert: {
          lesson_number: number
          level_id: string
          locale: string
          profile_id: string
          recorded_at?: string
        }
        Update: {
          lesson_number?: number
          level_id?: string
          locale?: string
          profile_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_lesson_progress_profile_id_level_id_fkey"
            columns: ["profile_id", "level_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id", "level_id"]
          },
        ]
      }
      kids_market_release: {
        Row: {
          accepts_child_data: boolean
          country_code: string
          review_reference: string | null
          reviewed_at: string | null
        }
        Insert: {
          accepts_child_data?: boolean
          country_code: string
          review_reference?: string | null
          reviewed_at?: string | null
        }
        Update: {
          accepts_child_data?: boolean
          country_code?: string
          review_reference?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
      kids_media: {
        Row: {
          caption_sha256: string
          lesson_number: number
          level_id: string
          locale: string
          staged_at: string
          video_guid: string
          video_sha256: string
        }
        Insert: {
          caption_sha256: string
          lesson_number: number
          level_id: string
          locale: string
          staged_at?: string
          video_guid: string
          video_sha256: string
        }
        Update: {
          caption_sha256?: string
          lesson_number?: number
          level_id?: string
          locale?: string
          staged_at?: string
          video_guid?: string
          video_sha256?: string
        }
        Relationships: []
      }
      kids_parent_access_requests: {
        Row: {
          adult_confirmed: boolean
          country_code: string | null
          parent_email: string
          parent_id: string
          request_notice_version: string
          requested_at: string
          review_reference: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          adult_confirmed?: boolean
          country_code?: string | null
          parent_email: string
          parent_id: string
          request_notice_version?: string
          requested_at?: string
          review_reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          adult_confirmed?: boolean
          country_code?: string | null
          parent_email?: string
          parent_id?: string
          request_notice_version?: string
          requested_at?: string
          review_reference?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_parent_access_requests_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "kids_market_release"
            referencedColumns: ["country_code"]
          },
        ]
      }
      kids_parent_attestations: {
        Row: {
          attested_at: string
          country_code: string
          parent_id: string
          policy_id: string
        }
        Insert: {
          attested_at?: string
          country_code: string
          parent_id: string
          policy_id: string
        }
        Update: {
          attested_at?: string
          country_code?: string
          parent_id?: string
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_parent_attestations_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "kids_market_release"
            referencedColumns: ["country_code"]
          },
          {
            foreignKeyName: "kids_parent_attestations_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "kids_consent_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_parent_verifications: {
        Row: {
          parent_id: string
          verification_reference: string
          verified_at: string
        }
        Insert: {
          parent_id: string
          verification_reference: string
          verified_at: string
        }
        Update: {
          parent_id?: string
          verification_reference?: string
          verified_at?: string
        }
        Relationships: []
      }
      kids_profile_consents: {
        Row: {
          accepted_at: string
          guardian_reference: string
          parent_id: string
          policy_id: string
          profile_id: string
          withdrawn_at: string | null
        }
        Insert: {
          accepted_at?: string
          guardian_reference: string
          parent_id: string
          policy_id: string
          profile_id: string
          withdrawn_at?: string | null
        }
        Update: {
          accepted_at?: string
          guardian_reference?: string
          parent_id?: string
          policy_id?: string
          profile_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kids_profile_consents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "kids_consent_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_profile_consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          level_id: string
          parent_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          level_id: string
          parent_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          level_id?: string
          parent_id?: string
        }
        Relationships: []
      }
      kids_release_control: {
        Row: {
          accepts_child_data: boolean
          lesson_access_enabled: boolean
          singleton: boolean
        }
        Insert: {
          accepts_child_data?: boolean
          lesson_access_enabled?: boolean
          singleton?: boolean
        }
        Update: {
          accepts_child_data?: boolean
          lesson_access_enabled?: boolean
          singleton?: boolean
        }
        Relationships: []
      }
      kids_retention_control: {
        Row: {
          deletion_enabled: boolean
          notices_enabled: boolean
          release_reference: string | null
          singleton: boolean
        }
        Insert: {
          deletion_enabled?: boolean
          notices_enabled?: boolean
          release_reference?: string | null
          singleton?: boolean
        }
        Update: {
          deletion_enabled?: boolean
          notices_enabled?: boolean
          release_reference?: string | null
          singleton?: boolean
        }
        Relationships: []
      }
      kids_retention_delivery_events: {
        Row: {
          event_id: string
          event_type: string
          notice_id: string
          occurred_at: string
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          notice_id: string
          occurred_at: string
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          notice_id?: string
          occurred_at?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_retention_delivery_events_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "kids_retention_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_retention_notices: {
        Row: {
          claim_token: string | null
          created_at: string
          deleted_at: string | null
          deleted_profile_count: number | null
          delivered_at: string | null
          expiry: string
          failure_at: string | null
          first_attempt_at: string | null
          id: string
          lease_until: string | null
          parent_id: string
          profile_ids: string[]
          provider_email_id: string | null
          recipient_email: string | null
          state: string
        }
        Insert: {
          claim_token?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_profile_count?: number | null
          delivered_at?: string | null
          expiry: string
          failure_at?: string | null
          first_attempt_at?: string | null
          id?: string
          lease_until?: string | null
          parent_id: string
          profile_ids: string[]
          provider_email_id?: string | null
          recipient_email?: string | null
          state?: string
        }
        Update: {
          claim_token?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_profile_count?: number | null
          delivered_at?: string | null
          expiry?: string
          failure_at?: string | null
          first_attempt_at?: string | null
          id?: string
          lease_until?: string | null
          parent_id?: string
          profile_ids?: string[]
          provider_email_id?: string | null
          recipient_email?: string | null
          state?: string
        }
        Relationships: []
      }
      kids_stripe_events: {
        Row: {
          event_id: string
          parent_id: string
          received_at: string
        }
        Insert: {
          event_id: string
          parent_id: string
          received_at?: string
        }
        Update: {
          event_id?: string
          parent_id?: string
          received_at?: string
        }
        Relationships: []
      }
      kids_stripe_prices: {
        Row: {
          amount_minor: number
          billing_interval: string
          currency_code: string
          discounted: boolean
          gateway_price_id: string
          gateway_product_id: string
          market_code: string
        }
        Insert: {
          amount_minor: number
          billing_interval: string
          currency_code: string
          discounted: boolean
          gateway_price_id: string
          gateway_product_id: string
          market_code: string
        }
        Update: {
          amount_minor?: number
          billing_interval?: string
          currency_code?: string
          discounted?: boolean
          gateway_price_id?: string
          gateway_product_id?: string
          market_code?: string
        }
        Relationships: []
      }
      kids_stripe_refunds: {
        Row: {
          amount_minor: number
          invoice_id: string
          parent_id: string
          refund_id: string
          status: string
        }
        Insert: {
          amount_minor: number
          invoice_id: string
          parent_id: string
          refund_id: string
          status: string
        }
        Update: {
          amount_minor?: number
          invoice_id?: string
          parent_id?: string
          refund_id?: string
          status?: string
        }
        Relationships: []
      }
      kids_stripe_subscriptions: {
        Row: {
          gateway_customer_id: string
          gateway_price_id: string
          gateway_subscription_id: string
          last_event_at: string
          latest_paid_invoice_id: string | null
          paid_through: string | null
          parent_id: string
          status: string
          updated_at: string
        }
        Insert: {
          gateway_customer_id: string
          gateway_price_id: string
          gateway_subscription_id: string
          last_event_at: string
          latest_paid_invoice_id?: string | null
          paid_through?: string | null
          parent_id: string
          status: string
          updated_at?: string
        }
        Update: {
          gateway_customer_id?: string
          gateway_price_id?: string
          gateway_subscription_id?: string
          last_event_at?: string
          latest_paid_invoice_id?: string | null
          paid_through?: string | null
          parent_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_stripe_subscriptions_gateway_price_id_fkey"
            columns: ["gateway_price_id"]
            isOneToOne: false
            referencedRelation: "kids_stripe_prices"
            referencedColumns: ["gateway_price_id"]
          },
        ]
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
      subscription_mail_outbox: {
        Row: {
          blocked: boolean
          claim_token: string | null
          created_at: string
          display_name: string | null
          event_id: string
          first_attempt_at: string | null
          kind: string
          lease_until: string | null
          plan_key: string
          preferred_locale: string | null
          provider_email_id: string | null
          recipient: string
          user_id: string
        }
        Insert: {
          blocked?: boolean
          claim_token?: string | null
          created_at?: string
          display_name?: string | null
          event_id: string
          first_attempt_at?: string | null
          kind: string
          lease_until?: string | null
          plan_key: string
          preferred_locale?: string | null
          provider_email_id?: string | null
          recipient: string
          user_id: string
        }
        Update: {
          blocked?: boolean
          claim_token?: string | null
          created_at?: string
          display_name?: string | null
          event_id?: string
          first_attempt_at?: string | null
          kind?: string
          lease_until?: string | null
          plan_key?: string
          preferred_locale?: string | null
          provider_email_id?: string | null
          recipient?: string
          user_id?: string
        }
        Relationships: []
      }
      technical_asset_manifest: {
        Row: {
          kind: string
          lesson_id: string
          locale: string
          path: string
          sha256: string
        }
        Insert: {
          kind: string
          lesson_id: string
          locale: string
          path: string
          sha256: string
        }
        Update: {
          kind?: string
          lesson_id?: string
          locale?: string
          path?: string
          sha256?: string
        }
        Relationships: []
      }
      technical_lesson_content: {
        Row: {
          kind: string
          lesson_id: string
          locale: string
          payload: Json
          source_sha256: string
          video_guid: string
        }
        Insert: {
          kind: string
          lesson_id: string
          locale: string
          payload: Json
          source_sha256: string
          video_guid: string
        }
        Update: {
          kind?: string
          lesson_id?: string
          locale?: string
          payload?: Json
          source_sha256?: string
          video_guid?: string
        }
        Relationships: []
      }
      technical_progress: {
        Row: {
          drafts: Json
          lesson_id: string
          practice_reviewed: boolean
          quiz_passed: boolean
          read: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          drafts?: Json
          lesson_id: string
          practice_reviewed?: boolean
          quiz_passed?: boolean
          read?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          drafts?: Json
          lesson_id?: string
          practice_reviewed?: boolean
          quiz_passed?: boolean
          read?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      technical_release_control: {
        Row: {
          enabled: boolean
          singleton: boolean
        }
        Insert: {
          enabled?: boolean
          singleton?: boolean
        }
        Update: {
          enabled?: boolean
          singleton?: boolean
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
      apply_kids_stripe_event: {
        Args: {
          p_customer_id: string
          p_event_id: string
          p_occurred_at: string
          p_paid: boolean
          p_paid_invoice_id: string
          p_parent_id: string
          p_period_end: string
          p_period_start: string
          p_price_id: string
          p_status: string
          p_subscription_id: string
        }
        Returns: boolean
      }
      apply_kids_stripe_refund: {
        Args: {
          p_customer_id: string
          p_event_id: string
          p_invoice_amount: number
          p_invoice_id: string
          p_occurred_at: string
          p_parent_id: string
          p_refund_amount: number
          p_refund_id: string
          p_refund_status: string
          p_subscription_id: string
        }
        Returns: boolean
      }
      apply_review_outcome: {
        Args: { p_lesson_id: string; p_passed: boolean; p_user_id: string }
        Returns: undefined
      }
      apply_stripe_refund_event: {
        Args: {
          p_amount_minor: number
          p_checkout_generation: string
          p_currency_code: string
          p_effective_at: string
          p_event_type: string
          p_gateway_customer_id: string
          p_gateway_event_id: string
          p_gateway_invoice_id: string
          p_gateway_refund_id: string
          p_gateway_subscription_id: string
          p_is_latest_invoice: boolean
          p_status: string
        }
        Returns: Json
      }
      apply_stripe_webhook_event: {
        Args: {
          p_amount_minor?: number
          p_cancel_at_period_end: boolean
          p_currency_code?: string
          p_effective_at: string
          p_event_type: string
          p_gateway_customer_id: string
          p_gateway_event_id: string
          p_gateway_status: string
          p_gateway_subscription_id: string
          p_gateway_transaction_id?: string
          p_market_price_id: string
          p_payload_minimized?: Json
          p_period_end: string
          p_period_start: string
          p_plan_version_id: string
          p_subscription_id: string
          p_transition: string
          p_user_id: string
        }
        Returns: Json
      }
      auth_signup_email_profile: {
        Args: { p_email: string }
        Returns: {
          full_name: string
          preferred_locale: string
        }[]
      }
      claim_account_welcome_email: {
        Args: { p_user: string }
        Returns: {
          claim_token: string
          display_name: string
          preferred_locale: string
          recipient: string
          template_version: number
          user_id: string
        }[]
      }
      claim_account_welcome_emails: {
        Args: never
        Returns: {
          claim_token: string
          recipient: string
          user_id: string
        }[]
      }
      claim_account_welcome_emails_v2: {
        Args: never
        Returns: {
          claim_token: string
          display_name: string
          preferred_locale: string
          recipient: string
          template_version: number
          user_id: string
        }[]
      }
      claim_active_device: { Args: { p_device_id: string }; Returns: string }
      claim_contact_acknowledgement: {
        Args: { p_id: string }
        Returns: {
          claim_token: string
          html_body: string
          id: string
          recipient: string
          sender: string
          subject: string
          text_body: string
        }[]
      }
      claim_contact_acknowledgements: {
        Args: never
        Returns: {
          claim_token: string
          html_body: string
          id: string
          recipient: string
          sender: string
          subject: string
          text_body: string
        }[]
      }
      claim_subscription_mail: {
        Args: never
        Returns: {
          claim_token: string
          display_name: string
          event_id: string
          kind: string
          plan_key: string
          preferred_locale: string
          recipient: string
        }[]
      }
      close_stripe_checkout_intent: {
        Args: {
          p_checkout_generation: string
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      commerce_command: {
        Args: { p_action: string; p_data?: Json }
        Returns: Json
      }
      commerce_mail: { Args: { p_action: string; p_data: Json }; Returns: Json }
      commerce_payment_mail: {
        Args: { p_action: string; p_data?: Json }
        Returns: Json
      }
      commerce_previous_get_my_billing_access_tier: {
        Args: never
        Returns: string
      }
      commerce_previous_get_my_kids_access_status: {
        Args: never
        Returns: {
          access_source: string
          active_until: string
        }[]
      }
      commerce_previous_lc09_advance_deletion: {
        Args: { p_lease_token: string; p_next_stage: string; p_user_id: string }
        Returns: Json
      }
      commerce_previous_lc09_claim_financial_purge: {
        Args: { p_user_id: string }
        Returns: Json
      }
      commerce_previous_lc09_complete_financial_purge: {
        Args: { p_lease_token: string; p_release?: boolean; p_user_id: string }
        Returns: Json
      }
      commerce_previous_record_contact_mail_receipt: {
        Args: {
          p_at: string
          p_email_id: string
          p_event: string
          p_recipient: string
          p_type: string
        }
        Returns: string
      }
      commerce_receipt: {
        Args: { p_action: string; p_actor: string; p_data: Json }
        Returns: Json
      }
      commit_ai_quota: {
        Args: {
          p_idempotency_key: string
          p_input_tokens: number
          p_output_tokens: number
          p_reservation_id: string
        }
        Returns: Json
      }
      complete_account_welcome_email: {
        Args: {
          p_block: boolean
          p_claim: string
          p_email_id: string
          p_user: string
        }
        Returns: boolean
      }
      complete_contact_acknowledgement: {
        Args: {
          p_block: boolean
          p_claim: string
          p_email_id: string
          p_id: string
        }
        Returns: boolean
      }
      complete_subscription_mail: {
        Args: {
          p_block: boolean
          p_claim: string
          p_email_id: string
          p_event: string
        }
        Returns: boolean
      }
      confirm_stripe_checkout_generation: {
        Args: { p_checkout_generation: string; p_user_id: string }
        Returns: boolean
      }
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
      evaluate_access: {
        Args: {
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: Json
      }
      export_my_data: { Args: never; Returns: Json }
      finalize_provider_attempt: {
        Args: {
          p_attempt_index: number
          p_attempt_status: string
          p_input_tokens?: number
          p_output_tokens?: number
          p_provider_cost_micro?: number
          p_reservation_id: string
        }
        Returns: Json
      }
      get_admin_insights: { Args: never; Returns: Json }
      get_admin_overview: { Args: never; Returns: Json }
      get_entitlement_snapshot: { Args: { p_user_id: string }; Returns: Json }
      get_kids_stripe_checkout_context: {
        Args: {
          p_billing_interval: string
          p_market_code: string
          p_user_id: string
        }
        Returns: Json
      }
      get_kids_stripe_portal_context: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_kpi_funnel: { Args: never; Returns: Json }
      get_my_billing_access_tier: { Args: never; Returns: string }
      get_my_kids_access_status: {
        Args: never
        Returns: {
          access_source: string
          active_until: string
        }[]
      }
      get_my_kids_subscription: {
        Args: never
        Returns: {
          paid_through: string
          status: string
        }[]
      }
      get_stripe_checkout_context: {
        Args: {
          p_billing_interval: string
          p_market_code: string
          p_plan_key: string
          p_user_id: string
        }
        Returns: Json
      }
      get_stripe_portal_context: { Args: { p_user_id: string }; Returns: Json }
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
      kids_admin_parent_review_ready: { Args: never; Returns: boolean }
      kids_admin_review_parent: {
        Args: { p_approve: boolean; p_parent_id: string; p_reference: string }
        Returns: undefined
      }
      kids_block_retention_notice: {
        Args: { p_claim: string; p_notice: string }
        Returns: boolean
      }
      kids_can_access_lesson: {
        Args: {
          requested_lesson: number
          requested_level: string
          requested_locale: string
          requested_profile: string
        }
        Returns: boolean
      }
      kids_claim_retention_notices: {
        Args: { p_limit?: number }
        Returns: {
          claim_token: string
          expiry: string
          first_attempt_at: string
          notice_id: string
          recipient_email: string
        }[]
      }
      kids_delete_expired_profiles: {
        Args: { p_notice: string }
        Returns: number
      }
      kids_parent_can_manage_profiles: { Args: never; Returns: boolean }
      kids_parent_confirm_privacy: {
        Args: { p_accepted: boolean; p_policy_id: string }
        Returns: string
      }
      kids_parent_create_consented_profile: {
        Args: {
          p_accepted: boolean
          p_display_name: string
          p_level_id: string
          p_policy_id: string
        }
        Returns: string
      }
      kids_parent_privacy_record: {
        Args: never
        Returns: {
          attested_at: string
          policy_id: string
          policy_version: string
        }[]
      }
      kids_parent_request_review:
        | { Args: { p_acknowledged: boolean }; Returns: string }
        | {
            Args: {
              p_acknowledged: boolean
              p_adult_confirmed: boolean
              p_country_code: string
            }
            Returns: string
          }
      kids_parent_withdraw_consent: {
        Args: { p_profile: string }
        Returns: undefined
      }
      kids_prepare_retention_notices: {
        Args: { p_limit?: number }
        Returns: number
      }
      kids_profile_has_consent: {
        Args: { p_profile: string }
        Returns: boolean
      }
      kids_public_launch_open: { Args: never; Returns: boolean }
      kids_record_retention_delivery: {
        Args: {
          p_email_id: string
          p_event_id: string
          p_kind: string
          p_occurred_at: string
          p_recipient: string
        }
        Returns: boolean
      }
      kids_record_retention_submission: {
        Args: { p_claim: string; p_email_id: string; p_notice: string }
        Returns: boolean
      }
      kids_retention_deletion_candidates: {
        Args: { p_limit?: number }
        Returns: {
          notice_id: string
        }[]
      }
      lc09_account_active: { Args: never; Returns: boolean }
      lc09_advance_deletion: {
        Args: { p_lease_token: string; p_next_stage: string; p_user_id: string }
        Returns: Json
      }
      lc09_begin_kids_checkout: {
        Args: { p_key: string; p_parameters: string; p_user_id: string }
        Returns: Json
      }
      lc09_claim_deletion: { Args: { p_user_id: string }; Returns: Json }
      lc09_claim_financial_purge: { Args: { p_user_id: string }; Returns: Json }
      lc09_complete_financial_purge: {
        Args: { p_lease_token: string; p_release?: boolean; p_user_id: string }
        Returns: Json
      }
      lc09_deletion_candidates: {
        Args: { p_limit?: number }
        Returns: string[]
      }
      lc09_financial_expired: { Args: { p_user_id: string }; Returns: boolean }
      lc09_financial_purge_candidates: {
        Args: { p_limit?: number }
        Returns: string[]
      }
      lc09_previous_apply_kids_stripe_event: {
        Args: {
          p_customer_id: string
          p_event_id: string
          p_occurred_at: string
          p_paid: boolean
          p_paid_invoice_id: string
          p_parent_id: string
          p_period_end: string
          p_period_start: string
          p_price_id: string
          p_status: string
          p_subscription_id: string
        }
        Returns: boolean
      }
      lc09_previous_apply_kids_stripe_refund: {
        Args: {
          p_customer_id: string
          p_event_id: string
          p_invoice_amount: number
          p_invoice_id: string
          p_occurred_at: string
          p_parent_id: string
          p_refund_amount: number
          p_refund_id: string
          p_refund_status: string
          p_subscription_id: string
        }
        Returns: boolean
      }
      lc09_previous_apply_stripe_webhook_event: {
        Args: {
          p_amount_minor?: number
          p_cancel_at_period_end: boolean
          p_currency_code?: string
          p_effective_at: string
          p_event_type: string
          p_gateway_customer_id: string
          p_gateway_event_id: string
          p_gateway_status: string
          p_gateway_subscription_id: string
          p_gateway_transaction_id?: string
          p_market_price_id: string
          p_payload_minimized?: Json
          p_period_end: string
          p_period_start: string
          p_plan_version_id: string
          p_subscription_id: string
          p_transition: string
          p_user_id: string
        }
        Returns: Json
      }
      lc09_previous_confirm_stripe_checkout_generation: {
        Args: { p_checkout_generation: string; p_user_id: string }
        Returns: boolean
      }
      lc09_previous_get_kids_stripe_checkout_context: {
        Args: {
          p_billing_interval: string
          p_market_code: string
          p_user_id: string
        }
        Returns: Json
      }
      lc09_previous_get_kids_stripe_portal_context: {
        Args: { p_user_id: string }
        Returns: Json
      }
      lc09_previous_get_my_billing_access_tier: { Args: never; Returns: string }
      lc09_previous_get_my_kids_access_status: {
        Args: never
        Returns: {
          access_source: string
          active_until: string
        }[]
      }
      lc09_previous_get_my_kids_subscription: {
        Args: never
        Returns: {
          paid_through: string
          status: string
        }[]
      }
      lc09_previous_get_stripe_checkout_context: {
        Args: {
          p_billing_interval: string
          p_market_code: string
          p_plan_key: string
          p_user_id: string
        }
        Returns: Json
      }
      lc09_previous_get_stripe_portal_context: {
        Args: { p_user_id: string }
        Returns: Json
      }
      lc09_previous_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lc09_previous_kids_parent_can_manage_profiles: {
        Args: never
        Returns: boolean
      }
      lc09_previous_kids_parent_privacy_record: {
        Args: never
        Returns: {
          attested_at: string
          policy_id: string
          policy_version: string
        }[]
      }
      lc09_previous_prepare_stripe_checkout: {
        Args: {
          p_billing_interval: string
          p_currency_code: string
          p_gateway_customer_id: string
          p_idempotency_key: string
          p_market_code: string
          p_market_price_id: string
          p_plan_version_id: string
          p_user_id: string
        }
        Returns: Json
      }
      lc09_previous_record_stripe_checkout_session: {
        Args: {
          p_checkout_generation: string
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      lc09_previous_register_kids_stripe_customer: {
        Args: { p_customer_id: string; p_user_id: string }
        Returns: string
      }
      lc09_record_kids_checkout: {
        Args: {
          p_attempt: string
          p_expired?: boolean
          p_session: string
          p_user_id: string
        }
        Returns: boolean
      }
      lc09_retained_apply_kids_stripe_event: {
        Args: {
          p_customer_id: string
          p_event_id: string
          p_occurred_at: string
          p_paid: boolean
          p_paid_invoice_id: string
          p_parent_id: string
          p_period_end: string
          p_period_start: string
          p_price_id: string
          p_status: string
          p_subscription_id: string
        }
        Returns: boolean
      }
      lc09_retained_apply_kids_stripe_refund: {
        Args: {
          p_customer_id: string
          p_event_id: string
          p_invoice_amount: number
          p_invoice_id: string
          p_occurred_at: string
          p_parent_id: string
          p_refund_amount: number
          p_refund_id: string
          p_refund_status: string
          p_subscription_id: string
        }
        Returns: boolean
      }
      lc09_retained_apply_stripe_webhook_event: {
        Args: {
          p_amount_minor?: number
          p_cancel_at_period_end: boolean
          p_currency_code?: string
          p_effective_at: string
          p_event_type: string
          p_gateway_customer_id: string
          p_gateway_event_id: string
          p_gateway_status: string
          p_gateway_subscription_id: string
          p_gateway_transaction_id?: string
          p_market_price_id: string
          p_payload_minimized?: Json
          p_period_end: string
          p_period_start: string
          p_plan_version_id: string
          p_subscription_id: string
          p_transition: string
          p_user_id: string
        }
        Returns: Json
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
      prepare_stripe_checkout: {
        Args: {
          p_billing_interval: string
          p_currency_code: string
          p_gateway_customer_id: string
          p_idempotency_key: string
          p_market_code: string
          p_market_price_id: string
          p_plan_version_id: string
          p_user_id: string
        }
        Returns: Json
      }
      queue_commerce_payment_confirmation: {
        Args: { p_order: string }
        Returns: Json
      }
      queue_contact_acknowledgement: {
        Args: {
          p_html: string
          p_id: string
          p_locale: string
          p_recipient: string
          p_stream: string
          p_subject: string
          p_text: string
        }
        Returns: undefined
      }
      rag_activate_index_upgrade: {
        Args: { p_expected_active_version_key: string; p_version_key: string }
        Returns: Json
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
      rag_rollback_index_upgrade: {
        Args: { p_active_version_key: string; p_restore_version_key: string }
        Returns: Json
      }
      rag_validate_staging_import: { Args: never; Returns: Json }
      record_contact_mail_receipt: {
        Args: {
          p_at: string
          p_email_id: string
          p_event: string
          p_recipient: string
          p_type: string
        }
        Returns: string
      }
      record_stripe_checkout_session: {
        Args: {
          p_checkout_generation: string
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      record_user_activity: { Args: never; Returns: Json }
      register_kids_stripe_customer: {
        Args: { p_customer_id: string; p_user_id: string }
        Returns: string
      }
      register_kids_stripe_price: {
        Args: {
          p_amount_minor: number
          p_billing_interval: string
          p_currency_code: string
          p_discounted: boolean
          p_market_code: string
          p_price_id: string
          p_product_id: string
        }
        Returns: string
      }
      register_provider_attempt: {
        Args: {
          p_attempt_idempotency_key?: string
          p_provider: string
          p_provider_request_id: string
          p_reservation_id: string
        }
        Returns: Json
      }
      register_stripe_gateway_catalog: {
        Args: {
          p_gateway_price_id: string
          p_gateway_product_id: string
          p_market_price_id: string
        }
        Returns: Json
      }
      release_ai_quota: {
        Args: { p_idempotency_key: string; p_reservation_id: string }
        Returns: Json
      }
      request_account_deletion: { Args: never; Returns: Json }
      reserve_learner_ai_access: {
        Args: {
          p_category: string
          p_idempotency_key: string
          p_lesson_id: string
          p_request_id: string
          p_units: number
          p_user_id: string
        }
        Returns: Json
      }
      resolve_stripe_subscription_plan: {
        Args: { p_gateway_price_id: string }
        Returns: Json
      }
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
      technical_can_access: { Args: { p_lesson: string }; Returns: boolean }
      technical_command: {
        Args: {
          p_action: string
          p_data?: Json
          p_lesson?: string
          p_locale?: string
        }
        Returns: Json
      }
      technical_storage_allowed: { Args: { p_path: string }; Returns: boolean }
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
