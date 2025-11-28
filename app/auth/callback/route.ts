import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)

    // Get user
    const { data: { user } } = await supabase.auth.getUser()

    // Create profile if it doesn't exist (for Google OAuth)
    if (user) {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        await supabase.from('user_profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        })
      }
    }
  }

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}