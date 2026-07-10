import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminActions from './AdminActions'
import ResetButton from './ResetButton'
import SuggestionsAdmin, { type AdminSuggestion } from './SuggestionsAdmin'

type UserRow = {
  id: string
  email: string
  name: string | null
  is_banned: boolean
  warning_issued: boolean
  ban_reason: string | null
}

type PostRow = {
  id: string
  title: string
  type: string
  status: string
  created_at: string
  user_id: string
  location: string
}

type ReportRow = {
  id: string
  post_id: string
  reporter_id: string
  reported_user_id: string
  reason: string | null
  created_at: string
}

type ResolvedPost = {
  id: string
  type: string
  status: string
  updated_at: string
}

type SuggestionRow = {
  id: string
  suggestion: string
  created_at: string
  user_id: string
  admin_reply?: string | null
  status?: string | null
}

// Admin must always see live reports/suggestions, never a cached render.
export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

export default async function AdminPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  // Suggestions are RLS-restricted to their owner; the admin reads them via the
  // service-role client (gate above already confirmed the caller is the admin).
  const adminDb = createAdminSupabase()

  const [
    { data: posts },
    { data: reports },
    { data: allUsers },
    { data: resolvedList },
    { data: suggestions },
  ] = await Promise.all([
    supabase.from('posts').select('id, title, type, status, created_at, user_id, location').order('created_at', { ascending: false }),
    supabase.from('reports').select('id, post_id, reporter_id, reported_user_id, reason, created_at').order('created_at', { ascending: false }),
    supabase.from('users').select('id, email, name, is_banned, warning_issued, ban_reason').order('id'),
    supabase.from('posts').select('id, type, status, updated_at').eq('status', 'resolved'),
    adminDb.from('suggestions').select('*').order('created_at', { ascending: false }),
  ])

  const postList: PostRow[] = posts ?? []
  const reportList: ReportRow[] = reports ?? []
  const userList: UserRow[] = allUsers ?? []
  const resolvedPosts: ResolvedPost[] = resolvedList ?? []
  const suggestionList: SuggestionRow[] = suggestions ?? []
  const reportedPostIds = new Set(reportList.map((r: ReportRow) => r.post_id))

  const adminSuggestions: AdminSuggestion[] = suggestionList.map((s: SuggestionRow) => {
    const suggester = userList.find((u: UserRow) => u.id === s.user_id)
    const email = suggester?.email ?? null
    return {
      id: s.id,
      suggestion: s.suggestion,
      created_at: s.created_at,
      user_id: s.user_id,
      name: suggester?.name ?? null,
      email,
      roll: email ? email.split('@')[0] : null,
      admin_reply: s.admin_reply ?? null,
      status: s.status ?? null,
    }
  })

  const monthlyReturns: Record<string, number> = {}
  resolvedPosts.forEach((p: ResolvedPost) => {
    const key = new Date(p.updated_at).toLocaleString('en-IN', { month: 'short', year: 'numeric' })
    monthlyReturns[key] = (monthlyReturns[key] ?? 0) + 1
  })

  const bannedUsers = userList.filter((u: UserRow) => u.is_banned)
  const warnedUsers = userList.filter((u: UserRow) => u.warning_issued && !u.is_banned)

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#f0f2f5' }}>Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#4a5068' }}>Only you can see this.</p>
          <div className="mt-3">
            <ResetButton />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4">
          {[
            { label: 'Total posts', value: postList.length, color: '#f0f2f5' },
            { label: 'Reports', value: reportList.length, color: reportList.length > 0 ? '#f87171' : '#4ade80' },
            { label: 'Total returns', value: resolvedPosts.length, color: '#4ade80' },
            { label: 'Banned users', value: bannedUsers.length, color: bannedUsers.length > 0 ? '#f87171' : '#4a5068' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center"
              style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: '#4a5068' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Monthly returns */}
        {Object.keys(monthlyReturns).length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#4ade80' }}>
              ✓ Returns by month
            </h2>
            <div className="rounded-xl p-4" style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
              {Object.entries(monthlyReturns).map(([month, count]) => (
                <div key={month} className="flex items-center justify-between py-1.5 border-b last:border-0"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-sm" style={{ color: '#8b92a5' }}>{month}</span>
                  <span className="text-sm font-bold" style={{ color: '#4ade80' }}>{count} returned</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reported posts */}
        {reportList.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#f87171' }}>
              ⚠ Reported posts
            </h2>
            <div className="flex flex-col gap-2">
              {postList.filter((p: PostRow) => reportedPostIds.has(p.id)).map((post: PostRow) => {
                const postReports = reportList.filter((r: ReportRow) => r.post_id === post.id)
                const reportCount = postReports.length
                const reportedUserId = postReports[0]?.reported_user_id
                const reportedUser = userList.find((u: UserRow) => u.id === reportedUserId)
                return (
                  <div key={post.id} className="rounded-xl p-4"
                    style={{ background: '#1a0a0a', border: '1px solid #7f1d1d' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#f0f2f5' }}>{post.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#4a5068' }}>
                          {post.type} · {post.location} · {new Date(post.created_at).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#f87171' }}>
                          {reportCount} report(s)
                          {postReports[0]?.reason && ` · "${postReports[0].reason}"`}
                        </p>
                        {reportedUser && (
                          <p className="text-xs mt-1" style={{ color: '#8b92a5' }}>
                            User: {reportedUser.email}
                            {reportedUser.warning_issued && !reportedUser.is_banned && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>warned</span>
                            )}
                            {reportedUser.is_banned && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                                style={{ background: '#3d1515', color: '#f87171' }}>banned</span>
                            )}
                          </p>
                        )}
                      </div>
                      <AdminActions
                        postId={post.id}
                        reportedUserId={reportedUserId ?? null}
                        userIsBanned={reportedUser?.is_banned ?? false}
                        userIsWarned={reportedUser?.warning_issued ?? false}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Warned users */}
        {warnedUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#fbbf24' }}>
              ⚡ Warned users
            </h2>
            <div className="flex flex-col gap-2">
              {warnedUsers.map((u: UserRow) => (
                <div key={u.id} className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: '#1a1400', border: '1px solid #78350f' }}>
                  <div>
                    <p className="text-sm" style={{ color: '#f0f2f5' }}>{u.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a5068' }}>Warning issued — next report = ban</p>
                  </div>
                  <AdminActions
                    postId={null}
                    reportedUserId={u.id}
                    userIsBanned={false}
                    userIsWarned={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banned users */}
        {bannedUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#f87171' }}>
              🚫 Banned users
            </h2>
            <div className="flex flex-col gap-2">
              {bannedUsers.map((u: UserRow) => (
                <div key={u.id} className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: '#1a0a0a', border: '1px solid #7f1d1d' }}>
                  <div>
                    <p className="text-sm" style={{ color: '#f0f2f5' }}>{u.email}</p>
                    {u.ban_reason && (
                      <p className="text-xs mt-0.5" style={{ color: '#4a5068' }}>Reason: {u.ban_reason}</p>
                    )}
                  </div>
                  <AdminActions
                    postId={null}
                    reportedUserId={u.id}
                    userIsBanned={true}
                    userIsWarned={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All posts */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#4a5068' }}>
            All posts
          </h2>
          <div className="flex flex-col gap-2">
            {postList.map((post: PostRow) => (
              <div key={post.id} className="rounded-xl p-4 flex items-center justify-between"
                style={{
                  background: '#0d1225',
                  border: reportedPostIds.has(post.id) ? '1px solid #7f1d1d' : '1px solid rgba(255,255,255,0.06)'
                }}>
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                      style={post.type === 'lost'
                        ? { background: '#3d1515', color: '#f87171' }
                        : { background: '#14301f', color: '#4ade80' }}>
                      {post.type}
                    </span>
                    {post.status === 'resolved' && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(24,95,165,0.2)', color: '#5b9bd5' }}>resolved</span>
                    )}
                    {reportedPostIds.has(post.id) && (
                      <span className="text-[10px]" style={{ color: '#f87171' }}>⚠ reported</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold mt-1 truncate" style={{ color: '#f0f2f5' }}>{post.title}</p>
                  <p className="text-xs" style={{ color: '#4a5068' }}>
                    {post.location} · {new Date(post.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <AdminActions postId={post.id} reportedUserId={null} userIsBanned={false} userIsWarned={false} />
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <SuggestionsAdmin suggestions={adminSuggestions} />

        <Link href="/dashboard" className="block mt-8 text-center text-xs" style={{ color: '#4a5068' }}>
          ← Back to dashboard
        </Link>
      </div>
    </main>
  )
}