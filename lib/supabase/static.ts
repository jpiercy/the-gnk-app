import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export const staticSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);