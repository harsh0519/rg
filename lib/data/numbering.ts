import 'server-only'
import { getWriteClient } from '@/lib/sanity/writeClient'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Indian financial year (Apr–Mar) as "25-26". */
export function financialYear(d: Date): string {
  const y = d.getFullYear()
  const start = d.getMonth() + 1 >= 4 ? y : y - 1
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`
}

/**
 * Atomically allocate the next sequence number for a scope + financial year, using a Sanity
 * counter doc patched with ifRevisionId + retry-on-conflict. Safe under concurrency.
 */
export async function allocateNumber(scope: 'order' | 'invoice', fy: string): Promise<number> {
  const id = `counter.${scope}.${fy}`
  const write = getWriteClient()
  try {
    await write.createIfNotExists({ _id: id, _type: 'counter', scope, financialYear: fy, value: 0 })
  } catch {
    // concurrent create of the same counter — the doc now exists, which is all we need
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const cur = await write.fetch<{ _rev: string; value: number }>(`*[_id==$id][0]{_rev, value}`, { id })
    try {
      await write.patch(id).ifRevisionId(cur._rev).inc({ value: 1 }).commit({ visibility: 'async' })
      return cur.value + 1
    } catch {
      await sleep(40 * (attempt + 1)) // revision conflict — brief backoff, then retry
    }
  }
  throw new Error(`Could not allocate ${scope} number for ${fy}`)
}
