import { vi } from 'vitest'

// Environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})

// Clear mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})
