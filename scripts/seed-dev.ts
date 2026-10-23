/**
 * Seed a dev/test dataset with an admin + one approved + one pending buyer.
 * Refuses to run against production. Usage: tsx scripts/seed-dev.ts [--dataset=development]
 * Dev password for all seeded accounts: "password123" (documented; dev only).
 */
import { createClient } from '@sanity/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

try {
  for (const line of readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* no .env.local */
}

const dataset = process.argv.find((a) => a.startsWith('--dataset='))?.split('=')[1] ?? 'development'
if (dataset === 'production' && !process.argv.includes('--allow-production')) {
  console.error('Refusing to seed production. Pass --allow-production to bootstrap the first admin (dev password — rotate before launch).')
  process.exit(1)
}

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) {
  console.error('SANITY_API_WRITE_TOKEN missing in .env.local')
  process.exit(1)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset,
  apiVersion: '2026-10-22',
  token,
  useCdn: false,
})

async function main() {
  const now = new Date().toISOString()
  const passwordHash = await bcrypt.hash('password123', 12)
  const buyers: Array<{ _id: string; _type: string } & Record<string, unknown>> = [
    { _id: 'buyer.admin', _type: 'buyer', businessName: 'RG Admin', contactName: 'Admin', email: 'admin@rg.test', phone: '9820000000', state: 'MH', businessType: 'other', role: 'admin', status: 'approved', paymentTerms: ['advance'], creditLimit: 0, passwordHash, appliedAt: now, approvedAt: now },
    { _id: 'buyer.approved', _type: 'buyer', businessName: 'Anand Retail Co.', contactName: 'Anand', email: 'anand@rg.test', phone: '9820000001', state: 'MH', businessType: 'retailer', role: 'buyer', status: 'approved', paymentTerms: ['advance', 'credit'], creditLimit: 50000, passwordHash, appliedAt: now, approvedAt: now },
    { _id: 'buyer.pending', _type: 'buyer', businessName: 'Surya Traders', contactName: 'Surya', email: 'surya@rg.test', phone: '9820000002', state: 'DL', businessType: 'reseller', role: 'buyer', status: 'pending', paymentTerms: [], creditLimit: 0, passwordHash, appliedAt: now },
  ]
  for (const b of buyers) await client.createOrReplace(b)
  console.log(`seeded ${buyers.length} buyers into "${dataset}" (password: password123)`)
}

main().catch((e) => {
  console.error('seed failed:', e instanceof Error ? e.message : e)
  process.exit(1)
})
