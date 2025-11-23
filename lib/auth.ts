import { supabase } from './supabase'

// Typy
export type User = {
  id: string
  email: string
  full_name?: string
}

export type AuthError = {
  message: string
}

// Helper funkcia na získanie error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

// Registrácia nového používateľa
export async function signUp(email: string, password: string, fullName: string) {
  try {
    // 1. Vytvor používateľa v Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Registrácia zlyhala')

    // 2. Vytvor profil v user_profiles tabuľke
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
      })

    if (profileError) {
      console.error('Chyba pri vytváraní profilu:', profileError)
      // Profil sa možno vytvoril cez trigger, takže pokračujeme
    }

    return { user: authData.user, error: null }
  } catch (error: unknown) {
    return { user: null, error: getErrorMessage(error) }
  }
}

// Prihlásenie existujúceho používateľa
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { user: data.user, session: data.session, error: null }
  } catch (error: unknown) {
    return { user: null, session: null, error: getErrorMessage(error) }
  }
}

// Prihlásenie cez Google
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) throw error
    return { data, error: null }
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) }
  }
}

// Odhlásenie používateľa
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error: unknown) {
    return { error: getErrorMessage(error) }
  }
}

// Získanie aktuálneho používateľa
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    if (!user) return { user: null, profile: null, error: null }

    // Získaj aj profil z databázy
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // Ak profil neexistuje, vytvor ho
      if (profileError.code === 'PGRST116') {
        console.log('Profil neexistuje, vytváram...')
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          })
          .select()
          .single()
        
        return { user, profile: newProfile, error: null }
      }
      
      console.warn('Chyba pri získavaní profilu:', profileError)
      return { user, profile: null, error: null }
    }

    return { user, profile, error: null }
  } catch (error: unknown) {
    return { user: null, profile: null, error: getErrorMessage(error) }
  }
}

// Získanie session
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error: unknown) {
    return { error: getErrorMessage(error) }
  }
}

// Reset hesla
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
    return { error: null }
  } catch (error: unknown) {
    return { error: getErrorMessage(error) }
  }
}