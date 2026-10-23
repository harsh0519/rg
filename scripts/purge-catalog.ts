/**
 * Purge all catalog product + colour documents from a dataset (so a fresh import leaves only the
 * current set). Products are deleted before colours to respect references. Uses the write token
 * from .env.local. Usage: tsx scripts/purge-catalog.ts [--dataset=production]
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// load .env.local (tsx does not auto-load it)
try {
  for (const line of readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* no .env.local */
}

const dataset = process.argv.find((a) => a.startsWith('--dataset='))?.split('=')[1] ?? 'production'
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
  const products = await client.delete({ query: '*[_type == "product"]' })
  const colours = await client.delete({ query: '*[_type == "colour"]' })
  console.log(
    `purged from "${dataset}":`,
    JSON.stringify({ products: products.results?.length ?? 0, colours: colours.results?.length ?? 0 }),
  )
}

main().catch((e) => {
  console.error('purge failed:', e instanceof Error ? e.message : e)
  process.exit(1)
})
