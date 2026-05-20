'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [handoffCount, setHandoffCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setLoggedIn(true)

      // Unread notifications
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (!error && count !== null) setUnreadCount(count)

      // Unread handoff messages
      const { data: myHandoffs } = await supabase
        .from('handoffs')
        .select('id')
        .eq('status', 'active')
        .or(`user_1.eq.${user.id},user_2.eq.${user.id}`)

      if (myHandoffs && myHandoffs.length > 0) {
        const handoffIds = myHandoffs.map((h) => h.id)
        const { count: msgCount, error: msgErr } = await supabase
          .from('handoff_messages')
          .select('*', { count: 'exact', head: true })
          .in('handoff_id', handoffIds)
          .neq('sender_id', user.id)
          .eq('is_read', false)
        if (!msgErr && msgCount !== null) setHandoffCount(msgCount)
      }
    }
    check()
  }, [pathname])

  return (
    <>
      <style>{`
        @keyframes bell-ring {
          0%   { transform: rotate(0deg); }
          10%  { transform: rotate(15deg); }
          20%  { transform: rotate(-13deg); }
          30%  { transform: rotate(11deg); }
          40%  { transform: rotate(-9deg); }
          50%  { transform: rotate(7deg); }
          60%  { transform: rotate(-5deg); }
          70%  { transform: rotate(3deg); }
          80%  { transform: rotate(-2deg); }
          90%  { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }
        .bell-link:hover .bell-icon {
          animation: bell-ring 0.6s ease;
          stroke: #185FA5;
        }
        .handoff-link:hover .handoff-icon {
          transform: scale(1.15);
        }
      `}</style>

      <nav style={{ background: '#080c18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        className="px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href={loggedIn ? '/dashboard' : '/'}>
          <span style={{
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #FF9933 0%, #FF9933 25%, #ffffff 50%, #138808 75%, #138808 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Vaapsi
          </span>
        </Link>

        {loggedIn && (
          <div className="flex items-center gap-5">
            <Link href="/posts/new" className="text-sm transition-colors"
              style={{ color: '#8b92a5' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f2f5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b92a5')}>
              + New Post
            </Link>
            <Link href="/my-posts" className="text-sm transition-colors"
              style={{ color: '#8b92a5' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f2f5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b92a5')}>
              My Posts
            </Link>
            <Link href="/my-claims" className="text-sm transition-colors"
              style={{ color: '#8b92a5' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f2f5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b92a5')}>
              My Claims
            </Link>
            <Link href="/profile" className="text-sm transition-colors"
              style={{ color: '#8b92a5' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f2f5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b92a5')}>
              Profile
            </Link>

            {/* Handoff icon */}
            <Link href="/handoffs" className="handoff-link relative flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5} stroke="#185FA5" className="handoff-icon w-6 h-6 transition-transform"
                style={{ transformOrigin: 'center' }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              {handoffCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  style={{ background: '#ffffff', color: '#080c18' }}>
                  {handoffCount}
                </span>
              )}
            </Link>

            {/* Bell icon */}
            <Link href="/notifications" className="bell-link relative flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5} stroke="#185FA5" className="bell-icon w-6 h-6 transition-colors"
                style={{ transformOrigin: 'top center' }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  style={{ background: '#ffffff', color: '#080c18' }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        )}
      </nav>
    </>
  )
}