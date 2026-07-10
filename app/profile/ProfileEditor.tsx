'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Props = {
  email: string
  initialName: string
  initialAvatarUrl: string | null
}

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR = 2 * 1024 * 1024

const inputStyle = {
  background: '#111830',
  border: '1px solid rgba(255,255,255,0.06)',
  color: '#f0f2f5',
  borderRadius: '10px',
  padding: '10px 14px',
  width: '100%',
  fontSize: '14px',
  outline: 'none',
} as const

export default function ProfileEditor({ email, initialName, initialAvatarUrl }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initialName)
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl)
  const [file, setFile] = useState<File | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [showPw, setShowPw] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!AVATAR_TYPES.includes(f.type)) {
      setProfileMsg({ ok: false, text: 'Avatar must be JPG, PNG, or WebP.' })
      return
    }
    if (f.size > MAX_AVATAR) {
      setProfileMsg({ ok: false, text: 'Avatar must be under 2MB.' })
      return
    }
    setProfileMsg(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function saveProfile() {
    setProfileMsg(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setProfileMsg({ ok: false, text: 'Name cannot be empty.' })
      return
    }
    setSavingProfile(true)
    const body = new FormData()
    body.append('name', trimmed)
    if (file) body.append('avatar', file)
    const res = await fetch('/api/profile', { method: 'POST', body })
    setSavingProfile(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setProfileMsg({ ok: false, text: data.error ?? 'Could not save profile.' })
      return
    }
    setFile(null)
    setProfileMsg({ ok: true, text: 'Profile updated.' })
    router.refresh()
  }

  async function changePassword() {
    setPwMsg(null)
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: 'Passwords do not match.' })
      return
    }
    setSavingPw(true)
    // Re-authenticate first — confirms the current password before changing it.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPw,
    })
    if (reauthError) {
      setSavingPw(false)
      setPwMsg({ ok: false, text: 'Current password is incorrect.' })
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSavingPw(false)
    if (error) {
      setPwMsg({ ok: false, text: error.message })
      return
    }
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setPwMsg({ ok: true, text: 'Password changed.' })
  }

  const msgBox = (m: { ok: boolean; text: string }) => (
    <div className="mt-3 rounded-lg px-3 py-2 text-xs"
      style={m.ok
        ? { background: 'rgba(24,95,165,0.12)', color: '#5b9bd5' }
        : { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
      {m.text}
    </div>
  )

  return (
    <div className="rounded-2xl p-5 mb-6"
      style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4a5068' }}>
        Edit profile
      </p>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: '#185FA5', color: '#fff' }}>
          {preview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
            : (name.trim().charAt(0) || email.charAt(0)).toUpperCase()}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            onChange={pickFile} className="hidden" aria-label="Upload profile photo" />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-2 rounded-lg font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(24,95,165,0.15)', color: '#5b9bd5' }}>
            Choose photo
          </button>
          <p className="text-[11px] mt-1" style={{ color: '#4a5068' }}>JPG, PNG or WebP, max 2MB</p>
        </div>
      </div>

      {/* Name */}
      <label className="text-xs" style={{ color: '#8b92a5' }}>Display name</label>
      <input value={name} onChange={e => setName(e.target.value)} maxLength={50}
        className="mt-1" style={inputStyle} aria-label="Display name" />

      <button type="button" onClick={saveProfile} disabled={savingProfile}
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: '#185FA5' }}>
        {savingProfile ? 'Saving...' : 'Save profile'}
      </button>
      {profileMsg && msgBox(profileMsg)}

      {/* Password (collapsible) */}
      <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button type="button" onClick={() => setShowPw(v => !v)}
          className="flex items-center justify-between w-full text-sm font-semibold"
          style={{ color: '#f0f2f5' }} aria-expanded={showPw}>
          <span>Change password</span>
          <span style={{ color: '#4a5068' }}>{showPw ? '−' : '+'}</span>
        </button>

        {showPw && (
          <div className="mt-4 flex flex-col gap-3">
            <input type="password" placeholder="Current password" value={currentPw}
              onChange={e => setCurrentPw(e.target.value)} style={inputStyle}
              aria-label="Current password" autoComplete="current-password" />
            <input type="password" placeholder="New password (min 6 characters)" value={newPw}
              onChange={e => setNewPw(e.target.value)} style={inputStyle}
              aria-label="New password" autoComplete="new-password" />
            <input type="password" placeholder="Confirm new password" value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)} style={inputStyle}
              aria-label="Confirm new password" autoComplete="new-password" />
            <button type="button" onClick={changePassword} disabled={savingPw}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#185FA5' }}>
              {savingPw ? 'Updating...' : 'Update password'}
            </button>
            {pwMsg && msgBox(pwMsg)}
          </div>
        )}
      </div>
    </div>
  )
}
