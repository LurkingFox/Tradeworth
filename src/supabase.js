import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.log('URL:', supabaseUrl)
  console.log('Key exists:', !!supabaseKey)
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    redirectTo: window.location.origin
  }
})