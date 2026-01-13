import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from './supabase'

// Complete auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession()

// Get redirect URL for OAuth
const redirectUrl = AuthSession.makeRedirectUri({
  scheme: 'td2u',
  path: 'auth/callback',
})

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })
  return { data, error }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  })

  if (error) {
    return { data: null, error }
  }

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

    if (result.type === 'success') {
      const url = new URL(result.url)

      // Handle fragment-based tokens (implicit flow)
      const fragment = url.hash.substring(1)
      const params = new URLSearchParams(fragment)

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        return { data: sessionData, error: sessionError }
      }

      // Handle query param tokens (PKCE flow)
      const code = url.searchParams.get('code')
      if (code) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code)
        return { data: sessionData, error: sessionError }
      }
    }

    return { data: null, error: new Error('OAuth flow was cancelled or failed') }
  }

  return { data: null, error: new Error('Failed to initiate OAuth flow') }
}

/**
 * Sign in with Apple OAuth
 */
export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  })

  if (error) {
    return { data: null, error }
  }

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

    if (result.type === 'success') {
      const url = new URL(result.url)

      // Handle fragment-based tokens
      const fragment = url.hash.substring(1)
      const params = new URLSearchParams(fragment)

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        return { data: sessionData, error: sessionError }
      }

      // Handle code exchange
      const code = url.searchParams.get('code')
      if (code) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code)
        return { data: sessionData, error: sessionError }
      }
    }

    return { data: null, error: new Error('OAuth flow was cancelled or failed') }
  }

  return { data: null, error: new Error('Failed to initiate OAuth flow') }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectUrl}?type=recovery`,
  })
  return { data, error }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

/**
 * Get current user
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  return { user: data.user, error }
}
