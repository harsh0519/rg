import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // tag-based revalidation / fresh reads; the data layer caches via unstable_cache
  perspective: 'published',
  stega: false,
  // Server-only read token (undefined in the browser bundle). Required for a private dataset.
  token: process.env.SANITY_API_READ_TOKEN,
})
