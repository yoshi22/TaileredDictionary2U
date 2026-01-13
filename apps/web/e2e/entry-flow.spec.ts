import { test, expect } from './fixtures/auth'

test.describe('Entry Flow', () => {
  test.describe('Authenticated User', () => {
    test('should display dashboard after login', async ({ authenticatedPage: page }) => {
      await expect(page).toHaveURL('/dashboard')

      // Dashboard should show some content
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('should navigate to new entry page', async ({ authenticatedPage: page }) => {
      // Find and click add entry button/link
      const addButton = page.getByRole('link', { name: /add|new|create/i }).or(
        page.getByRole('button', { name: /add|new|create/i })
      )
      await addButton.first().click()

      // Should be on entry creation page
      await expect(page.getByLabel(/term|word/i)).toBeVisible()
    })

    test('should create a new entry', async ({ authenticatedPage: page }) => {
      // Navigate to new entry page
      await page.goto('/entry/new')

      // Fill in entry form
      await page.getByLabel(/term|word/i).fill('test term')

      // Fill context if available
      const contextField = page.getByLabel(/context|sentence/i)
      if (await contextField.isVisible()) {
        await contextField.fill('This is a test context sentence.')
      }

      // Submit the form
      await page.getByRole('button', { name: /save|create|submit/i }).click()

      // Should redirect or show success
      await expect(page.getByText(/success|created|saved/i)).toBeVisible({ timeout: 10000 })
    })

    test('should view entry list', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard')

      // Should show entries list or empty state
      const entriesList = page.getByRole('list').or(
        page.getByText(/no entries|get started/i)
      )
      await expect(entriesList.first()).toBeVisible()
    })

    test('should display entry details', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard')

      // Find and click on an entry (if exists)
      const entryLink = page.getByRole('link').filter({ hasText: /\w+/ }).first()

      if (await entryLink.isVisible()) {
        await entryLink.click()

        // Entry detail page should show term
        await expect(page.getByRole('heading')).toBeVisible()
      }
    })

    test('should validate empty term on create', async ({ authenticatedPage: page }) => {
      await page.goto('/entry/new')

      // Try to submit without term
      await page.getByRole('button', { name: /save|create|submit/i }).click()

      // Should show validation error
      await expect(page.getByText(/required|enter|empty/i)).toBeVisible()
    })
  })
})

test.describe('Entry Management - Unauthenticated', () => {
  test('should redirect to login when accessing entry page', async ({ page }) => {
    await page.goto('/entry/new')
    await expect(page).toHaveURL(/login/)
  })
})
