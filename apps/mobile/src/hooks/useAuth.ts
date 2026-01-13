import { useState, useEffect, useCallback } from 'react'
import { supabase, User, Session } from '@/lib/supabase'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  signOut as authSignOut,
} from '@/lib/auth'
import { initializePurchases, logOutPurchases } from '@/lib/purchases'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInGoogle: () => Promise<{ error: Error | null }>
  signInApple: () => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  refreshSession: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
      })

      // Initialize RevenueCat if user is authenticated
      if (session?.user) {
        initializePurchases(session.user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
      })

      // Handle RevenueCat on auth changes
      if (event === 'SIGNED_IN' && session?.user) {
        await initializePurchases(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        await logOutPurchases()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true }))
      const { error } = await signInWithEmail(email, password)
      setState((prev) => ({ ...prev, isLoading: false }))
      return { error: error ? new Error(error.message) : null }
    },
    []
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true }))
      const { error } = await signUpWithEmail(email, password)
      setState((prev) => ({ ...prev, isLoading: false }))
      return { error: error ? new Error(error.message) : null }
    },
    []
  )

  const signInGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const { error } = await signInWithGoogle()
    setState((prev) => ({ ...prev, isLoading: false }))
    return { error: error ? new Error(String(error)) : null }
  }, [])

  const signInApple = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const { error } = await signInWithApple()
    setState((prev) => ({ ...prev, isLoading: false }))
    return { error: error ? new Error(String(error)) : null }
  }, [])

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const { error } = await authSignOut()
    setState((prev) => ({ ...prev, isLoading: false }))
    return { error: error ? new Error(error.message) : null }
  }, [])

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (!error && data.session) {
      setState((prev) => ({
        ...prev,
        user: data.session?.user ?? null,
        session: data.session,
        isAuthenticated: !!data.session,
      }))
    }
  }, [])

  return {
    ...state,
    signIn,
    signUp,
    signInGoogle,
    signInApple,
    signOut,
    refreshSession,
  }
}
