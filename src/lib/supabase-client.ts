'use client'

import { createClient } from '@supabase/supabase-js'

// Single shared Supabase client instance for browser (prevents duplicate instances)
let instance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (instance) return instance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  instance = createClient(url, key)
  return instance
}
