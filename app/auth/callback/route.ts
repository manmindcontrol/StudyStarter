import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let isNewUser = false

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)

    // Get user
    const { data: { user } } = await supabase.auth.getUser()

    // Create profile if it doesn't exist (for Google OAuth or email confirmation)
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
        isNewUser = true
      }
    }
  }

  // Redirect to dashboard with subscription modal for new users
  const dashboardUrl = new URL('/dashboard', requestUrl.origin)
  if (isNewUser) {
    dashboardUrl.searchParams.set('showSubscriptionModal', 'true')
  }
  return NextResponse.redirect(dashboardUrl)
}