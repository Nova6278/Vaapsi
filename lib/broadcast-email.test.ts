import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockBatchSend, mockSelect } = vi.hoisted(() => ({
  mockBatchSend: vi.fn(),
  mockSelect: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminSupabase: () => {
    // Fluent builder: every method returns the same builder until .not() which terminates
    const builder: Record<string, unknown> = {}
    const terminal = () => ({ data: mockSelect(), error: null })
    builder.from = () => builder
    builder.select = () => builder
    builder.eq = () => builder
    builder.neq = () => builder
    builder.not = terminal
    return { from: builder.from }
  },
}))

vi.mock('resend', () => {
  function MockResend() {
    return { batch: { send: mockBatchSend } }
  }
  return { Resend: MockResend }
})

vi.mock('@/lib/logger', () => ({ logError: vi.fn() }))

import { broadcastNewPostEmail, type BroadcastPost } from './broadcast-email'

const POST: BroadcastPost = {
  id: 'post-abc',
  title: 'Black iPhone 15',
  type: 'lost',
  description: 'Lost near library',
  location: 'Library Block',
  image_url: null,
}

const AUTHOR_ID = 'author-user-id'

const USERS = [
  { id: 'user-1', email: 'user1@kiit.ac.in' },
  { id: 'user-2', email: 'user2@kiit.ac.in' },
  { id: 'user-3', email: 'user3@kiit.ac.in' },
]

beforeEach(() => {
  mockBatchSend.mockReset().mockResolvedValue({ data: null, error: null })
})

describe('broadcastNewPostEmail', () => {
  it('sends one batch when users fit within limit', async () => {
    mockSelect.mockReturnValue(USERS)
    await broadcastNewPostEmail(POST, AUTHOR_ID)
    expect(mockBatchSend).toHaveBeenCalledTimes(1)
  })

  it('sends exactly one email per user returned by DB', async () => {
    mockSelect.mockReturnValue(USERS)
    await broadcastNewPostEmail(POST, AUTHOR_ID)
    const messages: { to: string }[] = mockBatchSend.mock.calls[0][0]
    expect(messages).toHaveLength(USERS.length)
    const tos = messages.map((m) => m.to)
    expect(tos).toContain('user1@kiit.ac.in')
    expect(tos).toContain('user2@kiit.ac.in')
    expect(tos).toContain('user3@kiit.ac.in')
  })

  it('does not send any email when user list is empty', async () => {
    mockSelect.mockReturnValue([])
    await broadcastNewPostEmail(POST, AUTHOR_ID)
    expect(mockBatchSend).not.toHaveBeenCalled()
  })

  it('does not throw if batch.send rejects', async () => {
    mockSelect.mockReturnValue(USERS)
    mockBatchSend.mockRejectedValue(new Error('Resend API error'))
    await expect(broadcastNewPostEmail(POST, AUTHOR_ID)).resolves.toBeUndefined()
  })

  it('uses correct subject format for lost post', async () => {
    mockSelect.mockReturnValue([USERS[0]])
    await broadcastNewPostEmail(POST, AUTHOR_ID)
    const messages: { subject: string }[] = mockBatchSend.mock.calls[0][0]
    expect(messages[0].subject).toBe('New Lost post: Black iPhone 15')
  })

  it('uses correct subject format for found post', async () => {
    mockSelect.mockReturnValue([USERS[0]])
    const foundPost: BroadcastPost = { ...POST, type: 'found' }
    await broadcastNewPostEmail(foundPost, AUTHOR_ID)
    const messages: { subject: string }[] = mockBatchSend.mock.calls[0][0]
    expect(messages[0].subject).toBe('New Found post: Black iPhone 15')
  })

  it('splits into multiple batches for large user lists', async () => {
    const manyUsers = Array.from({ length: 250 }, (_, i) => ({
      id: `user-${i}`,
      email: `u${i}@kiit.ac.in`,
    }))
    mockSelect.mockReturnValue(manyUsers)
    await broadcastNewPostEmail(POST, AUTHOR_ID)
    // 250 users / 100 per batch = 3 batches
    expect(mockBatchSend).toHaveBeenCalledTimes(3)
  })
})
