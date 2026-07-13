import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const creds = JSON.parse(fs.readFileSync('e2e/.creds.json', 'utf8'))
const env = fs.readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() || ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 1x1 valid JPEG (magic FF D8 FF) for avatar upload.
const JPEG_1PX = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AfwD/2Q==',
  'base64',
)

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard', { timeout: 30_000 })
}

const SUGGESTION = `E2E suggestion ${Date.now()}`

test('tester can submit a suggestion (flow still works)', async ({ page }) => {
  await login(page, creds.tester.email, creds.tester.password)
  await page.getByPlaceholder(/Add a map view/).fill(SUGGESTION)
  await page.getByRole('button', { name: /Send/ }).click()
  await expect(page.getByText(/Thanks! We read every suggestion/)).toBeVisible()

  const { data } = await db.from('suggestions').select('id').eq('user_id', creds.tester.id).eq('suggestion', SUGGESTION)
  expect(data?.length).toBe(1)
})

test('tester can change display name', async ({ page }) => {
  await login(page, creds.tester.email, creds.tester.password)
  await page.goto('/profile')
  const newName = 'Renamed Tester'
  await page.getByLabel('Display name').fill(newName)
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Profile updated.')).toBeVisible()
  // header reflects it after refresh
  await expect(page.getByRole('heading', { name: newName })).toBeVisible()

  const { data } = await db.from('users').select('name').eq('id', creds.tester.id).single()
  expect(data?.name).toBe(newName)
})

test('tester can upload an avatar', async ({ page }) => {
  await login(page, creds.tester.email, creds.tester.password)
  await page.goto('/profile')
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Choose photo' }).click(),
  ])
  await chooser.setFiles({ name: 'avatar.jpg', mimeType: 'image/jpeg', buffer: JPEG_1PX })
  // pickFile ran → editor preview reflects the chosen file
  await expect(page.getByAltText('Avatar preview')).toBeVisible()
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Profile updated.')).toBeVisible()
  // source of truth: avatar_url persisted to auth metadata
  await expect.poll(async () => {
    const { data } = await db.auth.admin.getUserById(creds.tester.id)
    return data.user?.user_metadata?.avatar_url ?? null
  }, { timeout: 15_000 }).not.toBeNull()
  // header renders it
  await expect(page.getByAltText('Profile photo')).toBeVisible()
})

test('admin sees suggestor identity (name, roll, email)', async ({ page }) => {
  await login(page, creds.testAdmin.email, creds.testAdmin.password)
  await page.goto('/admin')
  const roll = creds.tester.email.split('@')[0]
  await expect(page.getByText(new RegExp(`Suggested by .*\\(${roll}\\).*${roll}@kiit\\.ac\\.in`))).toBeVisible()
})

test('admin can reply and mark resolved', async ({ page }) => {
  await login(page, creds.testAdmin.email, creds.testAdmin.password)
  await page.goto('/admin')
  const card = page.locator('.rounded-xl', { hasText: SUGGESTION }).first()
  await card.getByLabel('Reply to suggestion').fill('Thanks, shipping this soon.')
  await card.getByRole('button', { name: /Mark Resolved/ }).click()
  await expect(page.getByText(/resolved/i).first()).toBeVisible()

  await expect.poll(async () => {
    const { data } = await db.from('suggestions').select('status, admin_reply').eq('user_id', creds.tester.id).eq('suggestion', SUGGESTION).single()
    return data?.status
  }, { timeout: 15_000 }).toBe('resolved')

  const { data } = await db.from('suggestions').select('admin_reply').eq('user_id', creds.tester.id).eq('suggestion', SUGGESTION).single()
  expect(data?.admin_reply).toContain('shipping this soon')
})

test('suggestor sees resolved status + reply and gets a notification', async ({ page }) => {
  // Notification is created client-side by the admin action; poll DB for it.
  await expect.poll(async () => {
    const { data } = await db.from('notifications').select('id').eq('user_id', creds.tester.id).ilike('message', '%marked resolved%')
    return data?.length ?? 0
  }, { timeout: 15_000 }).toBeGreaterThan(0)

  await login(page, creds.tester.email, creds.tester.password)
  await page.goto('/profile')
  await expect(page.getByText(SUGGESTION)).toBeVisible()
  await expect(page.getByText('resolved').first()).toBeVisible()
  await expect(page.getByText(/shipping this soon/)).toBeVisible()

  await page.goto('/notifications')
  await expect(page.getByText(/marked resolved/)).toBeVisible()
})

test('password change: wrong current rejected, correct current works, new password logs in', async ({ page }) => {
  await login(page, creds.tester.email, creds.tester.password)
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Change password' }).click()

  // wrong current password
  await page.getByLabel('Current password').fill('WrongPass1')
  await page.getByLabel('New password', { exact: true }).fill('NewPass123')
  await page.getByLabel('Confirm new password').fill('NewPass123')
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(page.getByText('Current password is incorrect.')).toBeVisible()

  // correct current password
  const newPassword = 'NewPass123'
  await page.getByLabel('Current password').fill(creds.tester.password)
  await page.getByLabel('New password', { exact: true }).fill(newPassword)
  await page.getByLabel('Confirm new password').fill(newPassword)
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(page.getByText('Password changed.')).toBeVisible()

  // new password logs in
  await page.goto('/login')
  // clear any session
  await page.context().clearCookies()
  await login(page, creds.tester.email, newPassword)
  await expect(page).toHaveURL(/dashboard/)
})
