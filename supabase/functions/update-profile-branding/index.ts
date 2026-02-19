import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ProfileUpdate {
  id: string
  company_name?: string
  company_slug?: string
  primary_color?: string
  secondary_color?: string
  avatar_url?: string
  company_phone?: string
  company_website?: string
  company_address?: string
  header_content?: string
  header_style?: string
  font_set?: string
}

serve(async (req) => {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401 })
    }

    // Create client with user context
    const userAuthClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })

    // Verify user is authenticated
    const { data: { user }, error: authError } = await userAuthClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Get request body
    const updates: ProfileUpdate = await req.json()
    
    // Verify user can only update their own profile
    if (updates.id !== user.id) {
      return new Response(JSON.stringify({ error: 'Cannot update other profiles' }), { status: 403 })
    }

    // Add updated_at
    updates.updated_at = new Date().toISOString()

    // Execute raw SQL to avoid schema cache issues
    const { data, error } = await supabase.rpc('update_profile_branding', {
      p_id: updates.id,
      p_company_name: updates.company_name,
      p_company_slug: updates.company_slug,
      p_primary_color: updates.primary_color,
      p_secondary_color: updates.secondary_color,
      p_avatar_url: updates.avatar_url,
      p_company_phone: updates.company_phone,
      p_company_website: updates.company_website,
      p_company_address: updates.company_address,
      p_header_content: updates.header_content,
      p_header_style: updates.header_style,
      p_font_set: updates.font_set,
      p_updated_at: updates.updated_at
    })

    if (error) {
      // If RPC fails, try direct update
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: updates.id,
          company_name: updates.company_name,
          company_slug: updates.company_slug,
          primary_color: updates.primary_color,
          secondary_color: updates.secondary_color,
          avatar_url: updates.avatar_url,
          company_phone: updates.company_phone,
          company_website: updates.company_website,
          company_address: updates.company_address,
          header_content: updates.header_content,
          header_style: updates.header_style,
          font_set: updates.font_set,
          updated_at: updates.updated_at
        }, { onConflict: 'id' })

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 400 })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
