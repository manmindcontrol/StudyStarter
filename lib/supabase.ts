import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Typy pre našu databázu
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
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
    }
  }
}