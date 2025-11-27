import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper funkcia pre vytvorenie Supabase klienta s rôznymi storage nastaveniami
export const createSupabaseClient = (persistSession: boolean = true) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? (persistSession ? window.localStorage : window.sessionStorage) : undefined,
      persistSession: persistSession,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  })
}

export const supabase = createSupabaseClient(true)

// Typy pre našu databázu
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          display_name: string | null
          created_at: string
        }
      }
      materials: {
        Row: {
          id: string
          user_id: string
          title: string
          file_name: string | null
          file_type: string | null
          content: string | null
          storage_path: string | null
          openai_file_id: string | null
          created_at: string
        }
      }
      lectures: {
        Row: {
          id: string
          user_id: string
          title: string
          transcript: string | null
          summary: string | null
          audio_path: string | null
          created_at: string
        }
      }
      generated_questions: {
        Row: {
          id: string
          material_id: string
          user_id: string
          question_type: string
          questions: Array<{
            question: string
            type: "open" | "mcq"
            options: string[] | null
            answer: string | null
          }>
          created_at: string
        }
      }
    }
  }
}