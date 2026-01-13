import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock expo-auth-session
vi.mock('expo-auth-session', () => ({
  makeRedirectUri: vi.fn(() => 'td2u://auth/callback'),
}))

// Mock expo-web-browser
vi.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: vi.fn(),
  openAuthSessionAsync: vi.fn(),
}))

// Mock Supabase auth methods - must be defined inside the factory
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        getUser: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        setSession: vi.fn(),
        exchangeCodeForSession: vi.fn(),
      },
    },
  }
})

// Import after mocks are defined
import { supabase } from '@/lib/supabase'
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getSession,
  getUser,
  resetPassword,
} from '@/lib/auth'

// Get the mocked auth object
const mockAuth = supabase.auth as {
  signInWithPassword: ReturnType<typeof vi.fn>
  signUp: ReturnType<typeof vi.fn>
  signInWithOAuth: ReturnType<typeof vi.fn>
  signOut: ReturnType<typeof vi.fn>
  getSession: ReturnType<typeof vi.fn>
  getUser: ReturnType<typeof vi.fn>
  resetPasswordForEmail: ReturnType<typeof vi.fn>
  setSession: ReturnType<typeof vi.fn>
  exchangeCodeForSession: ReturnType<typeof vi.fn>
}

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signInWithEmail', () => {
    it('should call supabase signInWithPassword with email and password', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })

      const result = await signInWithEmail('test@example.com', 'password123')

      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it('should return error when sign in fails', async () => {
      const authError = { message: 'Invalid credentials' }
      mockAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: authError,
      })

      const result = await signInWithEmail('test@example.com', 'wrongpassword')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(authError)
    })
  })

  describe('signUpWithEmail', () => {
    it('should call supabase signUp with email and password', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'new@example.com' } },
        error: null,
      })

      const result = await signUpWithEmail('new@example.com', 'password123')

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'td2u://auth/callback',
        },
      })
      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it('should return error when sign up fails', async () => {
      const authError = { message: 'Email already exists' }
      mockAuth.signUp.mockResolvedValue({
        data: null,
        error: authError,
      })

      const result = await signUpWithEmail('existing@example.com', 'password123')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(authError)
    })
  })

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      mockAuth.signOut.mockResolvedValue({ error: null })

      const result = await signOut()

      expect(mockAuth.signOut).toHaveBeenCalled()
      expect(result.error).toBeNull()
    })

    it('should return error when sign out fails', async () => {
      const authError = { message: 'Sign out failed' }
      mockAuth.signOut.mockResolvedValue({ error: authError })

      const result = await signOut()

      expect(result.error).toEqual(authError)
    })
  })

  describe('getSession', () => {
    it('should return current session', async () => {
      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        user: { id: 'user-123' },
      }
      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await getSession()

      expect(mockAuth.getSession).toHaveBeenCalled()
      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
    })

    it('should return null session when not authenticated', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await getSession()

      expect(result.session).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('getUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await getUser()

      expect(mockAuth.getUser).toHaveBeenCalled()
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('should return null user when not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getUser()

      expect(result.user).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('resetPassword', () => {
    it('should call supabase resetPasswordForEmail', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const result = await resetPassword('test@example.com')

      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'td2u://auth/callback?type=recovery',
        }
      )
      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it('should return error when reset fails', async () => {
      const authError = { message: 'User not found' }
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: authError,
      })

      const result = await resetPassword('unknown@example.com')

      expect(result.error).toEqual(authError)
    })
  })
})
