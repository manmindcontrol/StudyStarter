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

    // Check if this is a new user (profile created by trigger on auth.users)
    if (user) {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, created_at')
        .eq('id', user.id)
        .single()

      // Check if user was just created (within last 10 seconds)
      if (existingProfile) {
        const createdAt = new Date(existingProfile.created_at)
        const now = new Date()
        const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000

        if (secondsSinceCreation < 10) {
          isNewUser = true
        }
      }

      // Note: Profile and subscription are created automatically by database triggers
      // on auth.users → user_profiles → user_subscriptions → usage_tracking
    }
  }

  // Redirect new users to pricing page, existing users to dashboard
  if (isNewUser) {
    const pricingUrl = new URL('/pricing', requestUrl.origin)
    pricingUrl.searchParams.set('new', 'true')
    pricingUrl.searchParams.set('preselect', 'basic')
    return NextResponse.redirect(pricingUrl)
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}