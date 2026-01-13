import { test as base, Page, expect } from '@playwright/test'

/**
 * Test credentials for E2E testing
 * These should match test users created in the test database
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
}

/**
 * Helper to sign in via the login page
 */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

/**
 * Helper to sign out
 */
export async function signOut(page: Page) {
  // Navigate to settings and click logout, or find logout button
  await page.goto('/settings')
  await page.getByRole('button', { name: /sign out|log out/i }).click()

  // Wait for redirect to home or login
  await page.waitForURL(/^\/$|\/login/)
}

/**
 * Extended test fixture with authenticated context
 * Usage: import { test } from './fixtures/auth'
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Sign in before the test
    await signIn(page, TEST_USER.email, TEST_USER.password)

    // Use the authenticated page
    await use(page)

    // No cleanup needed - Playwright handles browser context
  },
})

export { expect }
