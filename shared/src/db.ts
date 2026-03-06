import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; google_id: string; created_at: string; approved: boolean }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      waitlist: {
        Row: { id: string; user_id: string; joined_at: string; approved_at: string | null }
        Insert: Omit<Database['public']['Tables']['waitlist']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['waitlist']['Insert']>
      }
      clones: {
        Row: { id: string; name: string; persona_description: string | null; system_prompt: string; category: string | null; tags: Record<string, any>; created_at: string }
        Insert: Omit<Database['public']['Tables']['clones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clones']['Insert']>
      }
      chat_sessions: {
        Row: { id: string; user_id: string; created_at: string; mode: 'god' | 'conversation'; active_clones: Record<string, any>; metadata: Record<string, any> }
        Insert: Omit<Database['public']['Tables']['chat_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_sessions']['Insert']>
      }
      chat_messages: {
        Row: { id: string; session_id: string; role: 'user' | 'capybara' | 'clone'; sender_id: string | null; content: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
    }
  }
}
