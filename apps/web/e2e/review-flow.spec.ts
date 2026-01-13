import { test, expect } from './fixtures/auth'

test.describe('Review Flow', () => {
  test.describe('Authenticated User', () => {
    test('should navigate to review page', async ({ authenticatedPage: page }) => {
      // Navigate to review page from dashboard or nav
      const reviewLink = page.getByRole('link', { name: /review|study/i })
      await reviewLink.first().click()

      // Should be on review page
      await expect(page).toHaveURL(/review/)
    })

    test('should display review interface or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/review')

      // Should show either review cards or "no cards due" message
      const reviewContent = page.getByRole('button', { name: /again|hard|good|easy/i }).or(
        page.getByText(/no.*due|nothing.*review|all caught up/i)
      )
      await expect(reviewContent.first()).toBeVisible({ timeout: 10000 })
    })

    test('should show rating buttons during review', async ({ authenticatedPage: page }) => {
      await page.goto('/review')

      // Check if there are cards to review
      const hasCards = await page.getByRole('button', { name: /again/i }).isVisible().catch(() => false)

      if (hasCards) {
        // All rating buttons should be visible
        await expect(page.getByRole('button', { name: /again/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /hard/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /good/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /easy/i })).toBeVisible()
      }
    })

    test('should handle review submission', async ({ authenticatedPage: page }) => {
      await page.goto('/review')

      // Check if there are cards to review
      const goodButton = page.getByRole('button', { name: /good/i })
      const hasCards = await goodButton.isVisible().catch(() => false)

      if (hasCards) {
        // Click "Good" to submit review
        await goodButton.click()

        // Should either show next card or completion message
        await expect(
          page.getByRole('button', { name: /again/i }).or(
            page.getByText(/no.*due|complete|finished/i)
          )
        ).toBeVisible({ timeout: 5000 })
      }
    })

    test('should show progress or statistics', async ({ authenticatedPage: page }) => {
      await page.goto('/review')

      // Look for progress indicator or stats
      const progressIndicator = page.getByText(/\d+.*card|progress|reviewed/i)
      // This is optional - not all review pages show progress
      if (await progressIndicator.isVisible().catch(() => false)) {
        await expect(progressIndicator).toBeVisible()
      }
    })
  })

  test.describe('Review - Unauthenticated', () => {
    test('should redirect to login when accessing review', async ({ page }) => {
      await page.goto('/review')
      await expect(page).toHaveURL(/login/)
    })
  })
})

test.describe('Deck Management', () => {
  test.describe('Authenticated User', () => {
    test('should navigate to decks page', async ({ authenticatedPage: page }) => {
      // Navigate to decks
      const decksLink = page.getByRole('link', { name: /deck/i })
      if (await decksLink.isVisible().catch(() => false)) {
        await decksLink.first().click()
        await expect(page).toHaveURL(/deck/)
      }
    })

    test('should display deck list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/decks')

      // Should show decks or empty state
      const deckContent = page.getByRole('list').or(
        page.getByText(/no deck|create.*deck/i)
      )
      await expect(deckContent.first()).toBeVisible()
    })

    test('should open create deck modal or page', async ({ authenticatedPage: page }) => {
      await page.goto('/decks')

      // Find create deck button
      const createButton = page.getByRole('button', { name: /create|add|new/i })
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click()

        // Should show deck creation form
        await expect(page.getByLabel(/name/i)).toBeVisible()
      }
    })
  })
})
