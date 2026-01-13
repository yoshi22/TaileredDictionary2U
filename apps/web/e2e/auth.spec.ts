import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    // Check that login form is visible
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible()
  })

  test('should display signup page', async ({ page }) => {
    await page.goto('/signup')

    // Check that signup form is visible
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up|create account/i })).toBeVisible()
  })

  test('should show validation errors for empty login', async ({ page }) => {
    await page.goto('/login')

    // Click login without entering credentials
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // Should show validation error or remain on login page
    await expect(page).toHaveURL(/login/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('nonexistent@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 })
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('should have link to signup from login page', async ({ page }) => {
    await page.goto('/login')

    // Find and click signup link
    const signupLink = page.getByRole('link', { name: /sign up|create account|register/i })
    await expect(signupLink).toBeVisible()
  })

  test('should have link to login from signup page', async ({ page }) => {
    await page.goto('/signup')

    // Find login link
    const loginLink = page.getByRole('link', { name: /sign in|log in|already have/i })
    await expect(loginLink).toBeVisible()
  })
})
