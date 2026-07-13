// Reverts setup.mjs: deletes test users + their suggestions/notifications/avatars
// and restores original ADMIN_EMAIL env values.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const ENV_PATH = '.env.local'
const env = fs.readFileSync(ENV_PATH, 'utf8')
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() || ''

const admin = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

const creds = JSON.parse(fs.readFileSync('e2e/.creds.json', 'utf8'))
const ids = [creds.tester.id, creds.testAdmin.id]

for (const id of ids) {
  await admin.from('suggestions').delete().eq('user_id', id)
  await admin.from('notifications').delete().eq('user_id', id)
  await admin.from('users').delete().eq('id', id)
  await admin.storage.from('avatars').remove([`${id}/avatar.jpg`, `${id}/avatar.png`, `${id}/avatar.webp`]).catch(() => {})
  await admin.auth.admin.deleteUser(id).catch(() => {})
}

// Restore env
const backup = JSON.parse(fs.readFileSync('e2e/.env-backup.json', 'utf8'))
let next = env
for (const k of Object.keys(backup)) {
  next = next.replace(new RegExp('^' + k + '=.*$', 'm'), `${k}=${backup[k]}`)
}
fs.writeFileSync(ENV_PATH, next)
fs.rmSync('e2e/.creds.json', { force: true })
fs.rmSync('e2e/.env-backup.json', { force: true })
console.log('TEARDOWN OK')
