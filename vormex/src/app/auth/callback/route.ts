import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if profile is complete
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_profile_complete')
          .eq('id', user.id)
          .single()

        if (profile?.is_profile_complete) {
          return NextResponse.redirect(`${origin}${next}`)
        } else {
          return NextResponse.redirect(`${origin}/profile-setup`)
        }
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`)
}
