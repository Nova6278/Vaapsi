'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [handoffCount, setHandoffCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setLoggedIn(true)
      if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) setIsAdmin(true)

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (!error && count !== null) setUnreadCount(count)

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

  const navLinks = [
    { href: '/posts/new', label: '+ New Post' },
    { href: '/my-posts', label: 'My Posts' },
    { href: '/my-claims', label: 'My Claims' },
    { href: '/profile', label: 'Profile' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <>
      <nav style={{ background: '#080c18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        className="px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">

        {/* Logo */}
        <Link href={loggedIn ? '/dashboard' : '/'} className="shrink-0 flex items-center gap-2">
          <Image src="/vaapsi-logo.svg" alt="Vaapsi logo" width={28} height={28} />
          <span style={{
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #FDE68A 0%, #D4AF37 50%, #A68A3E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Vaapsi
          </span>
        </Link>

        {loggedIn && (
          <div className="flex items-center gap-3 sm:gap-5">

            {/* Desktop text links — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-5">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  {...(link.href === '/posts/new' ? { 'data-tutorial': 'newpost' } : {})}
                  {...(link.href === '/my-posts' ? { 'data-tutorial': 'myposts' } : {})}
                  {...(link.href === '/my-claims' ? { 'data-tutorial': 'myclaims' } : {})}
                  className="text-sm transition-colors"
                  style={{ color: pathname === link.href ? '#f0f2f5' : '#8b92a5' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f0f2f5')}
                  onMouseLeave={e => (e.currentTarget.style.color = pathname === link.href ? '#f0f2f5' : '#8b92a5')}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Handoff icon */}
            <Link href="/handoffs" data-tutorial="handoff" className="handoff-link relative flex items-center" aria-label="Handoffs">
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
            <Link href="/notifications" data-tutorial="bell" className="bell-link relative flex items-center" aria-label="Notifications">
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

            {/* Hamburger — mobile only */}
            <button
              className="sm:hidden flex flex-col justify-center items-center w-6 h-6 gap-1.5"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className="block w-5 h-0.5 rounded-full transition-all duration-200"
                style={{
                  background: '#8b92a5',
                  transform: menuOpen ? 'rotate(45deg) translate(2.5px, 2.5px)' : 'none',
                }} />
              <span className="block w-5 h-0.5 rounded-full transition-all duration-200"
                style={{
                  background: '#8b92a5',
                  opacity: menuOpen ? 0 : 1,
                }} />
              <span className="block w-5 h-0.5 rounded-full transition-all duration-200"
                style={{
                  background: '#8b92a5',
                  transform: menuOpen ? 'rotate(-45deg) translate(2.5px, -2.5px)' : 'none',
                }} />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile dropdown menu */}
      {loggedIn && menuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-[53px] z-40 px-4 pt-2 pb-4"
          style={{ background: '#080c18', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm py-2.5 px-3 rounded-lg transition-colors"
                style={{
                  color: pathname === link.href ? '#f0f2f5' : '#8b92a5',
                  background: pathname === link.href ? 'rgba(24,95,165,0.15)' : 'transparent',
                }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {loggedIn && menuOpen && (
        <div
          className="sm:hidden fixed inset-0 top-[53px] z-30 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}