import { createServer } from 'vite'
const s = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const r = await s.transformRequest('/src/services/users.service.ts')
  console.log('has export:', /export const usersService/.test(r.code), 'len', r.code.length)
  const p = await s.transformRequest('/src/pages/permissions/index.vue')
  console.log('page ok', p.code.length)
} catch (e) { console.log('ERR', e.message.slice(0, 400)) }
await s.close(); process.exit(0)
