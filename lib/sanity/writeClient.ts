import 'server-only'
import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { requireWriteToken } from '@/lib/env'

// Server-only client with the write token. Lazily constructed so merely importing this module
// never throws when the token is absent (the error surfaces only when a write is attempted).
let _client: SanityClient | null = null

export function getWriteClient(): SanityClient {
  if (!_client) {
    _client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: requireWriteToken(),
    })
  }
  return _client
}
