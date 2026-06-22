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
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar: string | null
          plan: string
          storage_used: number
          storage_limit: number
          ai_words_used: number
          ai_words_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar?: string | null
          plan?: string
          storage_used?: number
          storage_limit?: number
          ai_words_used?: number
          ai_words_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar?: string | null
          plan?: string
          storage_used?: number
          storage_limit?: number
          ai_words_used?: number
          ai_words_limit?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      files: {
        Row: {
          id: string
          user_id: string
          name: string
          size: number
          type: string
          cloudinary_public_id: string
          cloudinary_secure_url: string
          ocr_status: string
          ocr_text: string | null
          metadata: Json
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          size: number
          type: string
          cloudinary_public_id: string
          cloudinary_secure_url: string
          ocr_status?: string
          ocr_text?: string | null
          metadata?: Json
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          size?: number
          type?: string
          cloudinary_public_id?: string
          cloudinary_secure_url?: string
          ocr_status?: string
          ocr_text?: string | null
          metadata?: Json
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ocr_jobs: {
        Row: {
          id: string
          user_id: string
          file_id: string | null
          status: string
          progress: number
          result: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id?: string | null
          status?: string
          progress?: number
          result?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string | null
          status?: string
          progress?: number
          result?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_jobs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          file_id: string | null
          title: string
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id?: string | null
          title: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string | null
          title?: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      flashcards: {
        Row: {
          id: string
          user_id: string
          file_id: string | null
          deck_name: string
          cards: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id?: string | null
          deck_name: string
          cards?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string | null
          deck_name?: string
          cards?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          user_id: string
          file_id: string | null
          title: string
          content: string
          notes_type: string
          note_type: string | null
          ai_generated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id?: string | null
          title: string
          content: string
          notes_type?: string
          note_type?: string | null
          ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string | null
          title?: string
          content?: string
          notes_type?: string
          note_type?: string | null
          ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      watermark_jobs: {
        Row: {
          id: string
          user_id: string
          file_id: string
          status: string
          progress: number
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          status?: string
          progress?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          status?: string
          progress?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watermark_jobs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watermark_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      watermark_regions: {
        Row: {
          id: string
          job_id: string
          page_number: number
          x_min: number
          y_min: number
          x_max: number
          y_max: number
          type: string
          confidence: number
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          page_number: number
          x_min: number
          y_min: number
          x_max: number
          y_max: number
          type: string
          confidence: number
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          page_number?: number
          x_min?: number
          y_min?: number
          x_max?: number
          y_max?: number
          type?: string
          confidence?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watermark_regions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "watermark_jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      document_chunks: {
        Row: {
          id: string
          file_id: string
          user_id: string
          chunk_index: number
          content: string
          token_count: number
          embedding: Json | null
          section_title: string | null
          page_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          user_id: string
          chunk_index: number
          content: string
          token_count: number
          embedding?: Json | null
          section_title?: string | null
          page_number?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          user_id?: string
          chunk_index?: number
          content?: string
          token_count?: number
          embedding?: Json | null
          section_title?: string | null
          page_number?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          file_id: string | null
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id?: string | null
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string | null
          title?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          message?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      quizzes: {
        Row: {
          id: string
          user_id: string
          file_id: string | null
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id?: string | null
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string | null
          title?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question: string
          options: Json
          correct_answer: string
          explanation: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          question: string
          options: Json
          correct_answer: string
          explanation?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          question?: string
          options?: Json
          correct_answer?: string
          explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_usage: {
        Row: {
          id: string
          user_id: string
          feature: string
          tokens_input: number
          tokens_output: number
          model: string
          cost_estimate: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature: string
          tokens_input: number
          tokens_output: number
          model: string
          cost_estimate?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feature?: string
          tokens_input?: number
          tokens_output?: number
          model?: string
          cost_estimate?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      generated_summaries: {
        Row: {
          id: string
          user_id: string
          file_id: string
          summary_type: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          summary_type: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          summary_type?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_summaries_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      prompt_versions: {
        Row: {
          id: string
          feature: string
          version: string
          prompt: string
          created_at: string
        }
        Insert: {
          id?: string
          feature: string
          version: string
          prompt: string
          created_at?: string
        }
        Update: {
          id?: string
          feature?: string
          version?: string
          prompt?: string
          created_at?: string
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          id: string
          user_id: string
          feature: string
          request_count: number
          window_start: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature: string
          request_count?: number
          window_start?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feature?: string
          request_count?: number
          window_start?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      signature_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          image_url: string
          public_id: string
          width: number | null
          height: number | null
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          image_url: string
          public_id: string
          width?: number | null
          height?: number | null
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          image_url?: string
          public_id?: string
          width?: number | null
          height?: number | null
          last_used_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signature_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      signed_documents: {
        Row: {
          id: string
          user_id: string
          file_id: string
          signed_url: string
          document_hash: string
          page_count: number
          signature_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          signed_url: string
          document_hash: string
          page_count?: number
          signature_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          signed_url?: string
          document_hash?: string
          page_count?: number
          signature_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signed_documents_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      signature_audit_logs: {
        Row: {
          id: string
          document_id: string
          action: string
          page_number: number | null
          signature_x: number | null
          signature_y: number | null
          signature_width: number | null
          signature_height: number | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          action: string
          page_number?: number | null
          signature_x?: number | null
          signature_y?: number | null
          signature_width?: number | null
          signature_height?: number | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          action?: string
          page_number?: number | null
          signature_x?: number | null
          signature_y?: number | null
          signature_width?: number | null
          signature_height?: number | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signature_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "signed_documents"
            referencedColumns: ["id"]
          }
        ]
      }
      study_notes: {
        Row: {
          id: string
          user_id: string
          file_id: string
          type: string
          title: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          type: string
          title: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          type?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_notes_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      exams: {
        Row: {
          id: string
          user_id: string
          file_id: string
          title: string
          duration_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          title: string
          duration_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          title?: string
          duration_minutes?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      exam_questions: {
        Row: {
          id: string
          exam_id: string
          marks: number
          question_text: string
          marking_guide: string
          page_reference: number | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          marks: number
          question_text: string
          marking_guide: string
          page_reference?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          marks?: number
          question_text?: string
          marking_guide?: string
          page_reference?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          }
        ]
      }
      flashcard_reviews: {
        Row: {
          id: string
          user_id: string
          flashcard_id: string
          repetitions: number
          interval_days: number
          ease_factor: number
          next_review_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flashcard_id: string
          repetitions?: number
          interval_days?: number
          ease_factor?: number
          next_review_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          flashcard_id?: string
          repetitions?: number
          interval_days?: number
          ease_factor?: number
          next_review_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      interview_sessions: {
        Row: {
          id: string
          user_id: string
          file_id: string
          status: string
          current_question_index: number
          dialogue_history: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          status: string
          current_question_index?: number
          dialogue_history?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          status?: string
          current_question_index?: number
          dialogue_history?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          file_id: string
          duration_minutes: number
          started_at: string
          ended_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_id: string
          duration_minutes?: number
          started_at: string
          ended_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_id?: string
          duration_minutes?: number
          started_at?: string
          ended_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          icon: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          icon?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          icon?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      collection_items: {
        Row: {
          id: string
          collection_id: string
          item_type: string
          item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          item_type: string
          item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          item_type?: string
          item_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          }
        ]
      }
      question_bank: {
        Row: {
          id: string
          user_id: string
          source_file_id: string
          subject: string
          unit: string | null
          difficulty: string
          marks: number
          question: string
          answer: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_file_id: string
          subject: string
          unit?: string | null
          difficulty: string
          marks: number
          question: string
          answer: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_file_id?: string
          subject?: string
          unit?: string | null
          difficulty?: string
          marks?: number
          question?: string
          answer?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          }
        ]
      }
      question_attempts: {
        Row: {
          id: string
          user_id: string
          question_id: string
          is_correct: boolean
          time_taken: number
          attempted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          is_correct: boolean
          time_taken?: number
          attempted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          is_correct?: boolean
          time_taken?: number
          attempted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          }
        ]
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      collection_invites: {
        Row: {
          id: string
          collection_id: string
          inviter_id: string
          invitee_email: string
          status: string
          permission: string
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          inviter_id: string
          invitee_email: string
          status: string
          permission: string
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          inviter_id?: string
          invitee_email?: string
          status?: string
          permission?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_invites_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      shared_collections: {
        Row: {
          id: string
          collection_id: string
          shared_with_user_id: string
          permission: string
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          shared_with_user_id: string
          permission: string
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          shared_with_user_id?: string
          permission?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_collections_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          parent_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_battles: {
        Row: {
          id: string
          creator_id: string
          collection_id: string | null
          title: string
          status: string
          question_count: number
          time_limit_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          collection_id?: string | null
          title: string
          status: string
          question_count?: number
          time_limit_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          collection_id?: string | null
          title?: string
          status?: string
          question_count?: number
          time_limit_minutes?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_battles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_battles_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          }
        ]
      }
      battle_participants: {
        Row: {
          id: string
          battle_id: string
          user_id: string
          joined_at: string
          status: string
        }
        Insert: {
          id?: string
          battle_id: string
          user_id: string
          joined_at?: string
          status?: string
        }
        Update: {
          id?: string
          battle_id?: string
          user_id?: string
          joined_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_participants_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "quiz_battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      battle_answers: {
        Row: {
          id: string
          battle_id: string
          participant_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          time_taken_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          battle_id: string
          participant_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          time_taken_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          battle_id?: string
          participant_id?: string
          question_id?: string
          selected_answer?: string
          is_correct?: boolean
          time_taken_seconds?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_answers_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "quiz_battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "battle_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          }
        ]
      }
      battle_scores: {
        Row: {
          id: string
          battle_id: string
          user_id: string
          score: number
          accuracy: number | null
          time_taken_seconds: number
          rank: number | null
        }
        Insert: {
          id?: string
          battle_id: string
          user_id: string
          score?: number
          accuracy?: number | null
          time_taken_seconds?: number
          rank?: number | null
        }
        Update: {
          id?: string
          battle_id?: string
          user_id?: string
          score?: number
          accuracy?: number | null
          time_taken_seconds?: number
          rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_scores_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "quiz_battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_storage_used: {
        Args: { p_user_id: string; p_bytes: number }
        Returns: undefined
      }
      decrement_storage_used: {
        Args: { p_user_id: string; p_bytes: number }
        Returns: undefined
      }
      search_workspace: {
        Args: {
          p_user_id: string
          p_query: string
        }
        Returns: {
          item_type: string
          item_id: string
          title: string
          content_snippet: string
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

