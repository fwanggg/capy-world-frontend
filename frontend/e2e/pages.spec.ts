import { test, expect } from '@playwright/test'

test.describe('Landing Pages', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Talk to Digital Clones')
    await expect(page.locator('a:has-text("Join the Waitlist")')).toBeVisible()
  })

  test('should load about page', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('h1')).toContainText('The Problem with User Research Today')
    await expect(page.locator('text=Our Solution')).toBeVisible()
  })

  test('should load docs page', async ({ page }) => {
    await page.goto('/docs')
    await expect(page.locator('h1')).toContainText('Getting Started with Capybara')
    await expect(page.locator('h2')).toContainText('Pro Tips')
  })

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')
    await page.locator('a:has-text("About")').click()
    await expect(page).toHaveURL('/about')

    await page.locator('a:has-text("Docs")').click()
    await expect(page).toHaveURL('/docs')

    await page.locator('a:has-text("Capybara")').click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Waitlist Page', () => {
  test('should display waitlist page', async ({ page }) => {
    await page.goto('/waitlist')
    await expect(page.locator('h1')).toContainText('Join Capybara')
    // Check for the waitlist message text
    await expect(page.locator('text=early access')).toBeVisible()
  })

  test('should redirect to waitlist when accessing chat without auth', async ({ page }) => {
    await page.goto('/chat')
    await expect(page).toHaveURL(/.*waitlist/)
  })
})

test.describe('Chat Page Protection', () => {
  test('should show loading state then redirect when not authenticated', async ({ page }) => {
    await page.goto('/chat')
    // Should redirect to waitlist when not authenticated
    await expect(page).toHaveURL(/.*waitlist/, { timeout: 5000 })
  })

  test('should allow access if authenticated and approved', async ({ page, context }) => {
    // Set auth tokens in localStorage via context
    // Note: Supabase Auth tokens would be set automatically on successful OAuth
    await context.addInitScript(() => {
      localStorage.setItem('user_id', 'test-user-123')
      localStorage.setItem('approved', 'true')
      localStorage.setItem('email', 'test@example.com')
    })

    // Note: This test will fail if backend is not running or user doesn't exist
    // For full integration, would need to mock backend responses
    await page.goto('/chat')

    // Should show chat or loading (not redirect)
    const url = page.url()
    expect(url).toContain('/chat')
  })
})

test.describe('Navigation Component', () => {
  test('should show navigation links', async ({ page }) => {
    await page.goto('/')

    const nav = page.locator('nav')
    await expect(nav.locator('a:has-text("Capybara")')).toBeVisible()
    await expect(nav.locator('a:has-text("About")')).toBeVisible()
    await expect(nav.locator('a:has-text("Docs")')).toBeVisible()
    await expect(nav.locator('a:has-text("Join Waitlist")')).toBeVisible()
  })
})
