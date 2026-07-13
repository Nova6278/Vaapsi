// Throwaway E2E setup: creates a tester + test-admin, repoints ADMIN_EMAIL
// locally so admin flows can be driven without the real admin password.
// teardown.mjs reverts everything.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const ENV_PATH = '.env.local'
const env = fs.readFileSync(ENV_PATH, 'utf8')
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() || ''

const admin = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

const PW = 'Test1234!'
const stamp = Date.now()
const tester = { email: `e2e_tester_${stamp}@kiit.ac.in`, password: PW, name: 'E2E Tester' }
const testAdmin = { email: `e2e_admin_${stamp}@kiit.ac.in`, password: PW, name: 'E2E Admin' }

async function makeUser(u) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email, password: u.password, email_confirm: true, user_metadata: { name: u.name },
  })
  if (error) throw new Error(`createUser ${u.email}: ${error.message}`)
  const id = data.user.id
  // tutorial_done: true so the Tutorial overlay doesn't intercept clicks in tests.
  await admin.from('users').upsert({ id, email: u.email, name: u.name, tutorial_done: true })
  return id
}

const testerId = await makeUser(tester)
const adminId = await makeUser(testAdmin)

// Back up original admin env values, then repoint to the test admin.
const backup = {
  ADMIN_EMAIL: get('ADMIN_EMAIL'),
  NEXT_PUBLIC_ADMIN_EMAIL: get('NEXT_PUBLIC_ADMIN_EMAIL'),
}
fs.writeFileSync('e2e/.env-backup.json', JSON.stringify(backup, null, 2))

let next = env
for (const k of ['ADMIN_EMAIL', 'NEXT_PUBLIC_ADMIN_EMAIL']) {
  next = next.replace(new RegExp('^' + k + '=.*$', 'm'), `${k}=${testAdmin.email}`)
}
fs.writeFileSync(ENV_PATH, next)

fs.writeFileSync('e2e/.creds.json', JSON.stringify({ tester: { ...tester, id: testerId }, testAdmin: { ...testAdmin, id: adminId } }, null, 2))
console.log('SETUP OK. testAdmin=', testAdmin.email, 'tester=', tester.email)
