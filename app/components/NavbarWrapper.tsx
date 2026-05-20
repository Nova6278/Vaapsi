'use client'

import { usePathname } from 'next/navigation'
import Navbar from './navbar'

const HIDDEN_ROUTES = ['/', '/login', '/signup', '/signup/confirm']

export default function NavbarWrapper() {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.includes(pathname)) return null
  return <Navbar />
}