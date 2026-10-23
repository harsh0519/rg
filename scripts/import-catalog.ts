/**
 * Idempotent catalog import: 3 scraped CSVs -> Sanity (categories, colours, siteSettings,
 * homepage, products with image assets). Deterministic _ids (product.<pid>, category.<slug>,
 * colour.<slug>) so re-runs replace instead of duplicating.
 *
 * Token-free: emits NDJSON with `_sanityAsset` file refs and loads it via the Sanity CLI
 * session (`sanity dataset import ... --replace`), which uploads the images. A write token is
 * NOT required for this path.
 *
 * Money is stored as integer RUPEES. Wholesale fields NOT in the CSVs are placeholders,
 * flagged in docs/launch-checklist.md:
 *   - basePrice  = scraped sale price (retail-derived placeholder — confirm real wholesale)
 *   - priceTiers = [] (business must supply qty-break wholesale prices)
 *   - moq, variants (sizes/stock) = documented defaults
 * MRP/discount left null when blank — never invented.
 *
 * Usage: tsx scripts/import-catalog.ts [--dry-run] [--dataset=production]
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { parseINR, parseSaleRange, pidFromUrl, slugify, parseCsv, deriveFabric } from '../lib/import-parse'

const ROOT = resolve(__dirname, '..')
const OUT_DIR = join(ROOT, '.sanity-import')
const OUT_FILE = join(OUT_DIR, 'catalog.ndjson')

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const dataset =
  args.find((a) => a.startsWith('--dataset='))?.split('=')[1] ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

type Src = {
  csv: string
  categoryTitle: string
  sizes: string[]
  sizeRun: { label: string; perSize: number; sizes: string[] }
  primaryImage: (pid: string) => string | null
  galleryImages: (pid: string) => string[]
  colourFromRow: (name: string, pid: string) => string
}

const KURTA_DIR = join(ROOT, 'kurta_images', 'kurta_only')
const kurtaFileFor = (pid: string): string | null => {
  if (!existsSync(KURTA_DIR)) return null
  const f = readdirSync(KURTA_DIR).find((n) => n.startsWith(`${pid}_`))
  return f ? join(KURTA_DIR, f) : null
}
const angle = (cat: string, prefix: string, pid: string, views: string[]): string[] =>
  views.map((v) => join(ROOT, 'angle_images', cat, `${prefix}_${pid}_${v}.png`)).filter((p) => existsSync(p))

const SOURCES: Src[] = [
  {
    csv: 'jaypore_men_kurta_page1.csv',
    categoryTitle: "Men's Kurtas",
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sizeRun: { label: 'Size run S–XXL ×2', perSize: 2, sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    primaryImage: (pid) => kurtaFileFor(pid),
    galleryImages: (pid) => angle('kurta', 'kurta', pid, ['front', '3quarter', 'back']),
    colourFromRow: (_name, pid) => {
      const f = kurtaFileFor(pid)
      if (f) return f.split('/').pop()!.replace(`${pid}_`, '').replace('_cutout.png', '').split('-')[0]
      return 'Assorted'
    },
  },
  {
    csv: 'fabindia_bedsheets_page1.csv',
    categoryTitle: 'Bedsheets',
    sizes: ['Single', 'Double', 'King'],
    sizeRun: { label: 'Mixed sizes ×5', perSize: 5, sizes: ['Single', 'Double', 'King'] },
    primaryImage: (pid) => {
      const p = join(ROOT, 'bedsheet_images', `bedsheet_${pid}.jpg`)
      return existsSync(p) ? p : null
    },
    galleryImages: (pid) => angle('bedsheet', 'bedsheet', pid, ['front', 'angle', 'flatlay']),
    colourFromRow: (name) => name.trim().split(/\s+/)[0],
  },
  {
    csv: 'fabindia_towels_page1.csv',
    categoryTitle: 'Towels',
    sizes: ['Standard'],
    sizeRun: { label: 'Standard ×10', perSize: 10, sizes: ['Standard'] },
    primaryImage: (pid) => {
      const p = join(ROOT, 'towel_images', `towel_${pid}.jpg`)
      return existsSync(p) ? p : null
    },
    galleryImages: (pid) => angle('towel', 'towel', pid, ['flat', 'folded', 'rolled']),
    colourFromRow: (name) => name.trim().split(/\s+/)[0],
  },
]

type SanityDoc = Record<string, unknown>
const imageField = (absPath: string, alt: string): SanityDoc => ({ _type: 'image', _sanityAsset: `image@file://${absPath}`, alt })

function build(): { docs: SanityDoc[]; counts: Record<string, number>; skipped: string[] } {
  const docs: SanityDoc[] = []
  const skipped: string[] = []
  const colours = new Map<string, string>()
  const counts = { categories: 0, colours: 0, products: 0, settings: 0 }

  docs.push({
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandName: 'RG Enterprises',
    sellerState: 'MH',
    gstRate: 0.05,
    minOrderValue: 15000,
    defaultTierLabel: 'Tier A',
    defaultPriceTiers: [],
    contact: { _type: 'object', email: 'sales@rgenterprises.example', phone: '', addressLines: ['Maharashtra, India'] },
    footerLegalNote: 'GSTIN pending — confirm before launch.',
  })
  counts.settings++

  let heroImage: string | null = join(ROOT, 'bedsheet_images', 'bedsheet_20290202.jpg')
  if (!existsSync(heroImage)) heroImage = null
  docs.push({
    _id: 'homepage',
    _type: 'homepage',
    ...(heroImage ? { heroImage: imageField(heroImage, 'RG Enterprises wholesale textiles') } : {}),
    heroTitle: 'Wholesale textiles, ordered by the size run.',
    heroSubtitle:
      'Apparel and home linen for retailers and distributors. Apply for a trade account to see wholesale pricing.',
    heroStats: [
      { _key: 's1', _type: 'labeledValue', label: 'Min. order', value: '₹15,000' },
      { _key: 's2', _type: 'labeledValue', label: 'Price tiers', value: '10 · 50 · 200+' },
      { _key: 's3', _type: 'labeledValue', label: 'Lead time', value: '7–20 days' },
    ],
    buyingSteps: [
      { _key: 'b1', _type: 'titledStep', title: 'Apply', body: 'Submit your GSTIN and business details for a trade account.' },
      { _key: 'b2', _type: 'titledStep', title: 'Get approved', body: 'Once approved, wholesale prices and the order matrix unlock.' },
      { _key: 'b3', _type: 'titledStep', title: 'Order by size run', body: 'Fill the size × colour matrix and check out above the minimum.' },
    ],
    priceSteps: [
      { _key: 'p1', _type: 'titledStep', title: 'Your price list', body: 'A buyer-specific price overrides everything, if set.' },
      { _key: 'p2', _type: 'titledStep', title: 'Quantity tier', body: 'Otherwise the total quantity picks the tier price.' },
      { _key: 'p3', _type: 'titledStep', title: 'Base price', body: 'Below the first tier, the base wholesale price applies.' },
    ],
  })

  for (const src of SOURCES) {
    const csvPath = join(ROOT, src.csv)
    if (!existsSync(csvPath)) { skipped.push(`missing CSV ${src.csv}`); continue }
    const catSlug = slugify(src.categoryTitle)
    docs.push({ _id: `category.${catSlug}`, _type: 'category', title: src.categoryTitle, slug: { _type: 'slug', current: catSlug }, sortOrder: counts.categories })
    counts.categories++

    const rows = parseCsv(readFileSync(csvPath, 'utf8'))
    for (const row of rows) {
      const pid = pidFromUrl(row.product_url)
      if (!pid) { skipped.push(`no pid for "${row.name}"`); continue }
      // "only angle image as the product for now" — limit to products that have an AI angle gallery
      const angleImgs = src.galleryImages(pid)
      if (angleImgs.length === 0) { skipped.push(`no angle images for ${pid} (${row.name})`); continue }
      const primary = angleImgs[0]

      const colourName = (src.colourFromRow(row.name, pid) || 'Assorted').replace(/^\w/, (c) => c.toUpperCase())
      const colourSlug = slugify(colourName)
      if (!colours.has(colourSlug)) colours.set(colourSlug, colourName)

      const { min, max } = parseSaleRange(row.sale_price)
      const mrp = parseINR(row.mrp)
      const basePrice = min ?? mrp ?? 0

      const variants = src.sizes.map((size) => ({
        _key: `${pid}-${slugify(size)}`,
        _type: 'variant',
        sku: `${pid}-${slugify(size).toUpperCase()}`,
        size,
        colour: { _type: 'reference', _ref: `colour.${colourSlug}` },
        stock: 100,
      }))

      const gallery = angleImgs.slice(1).map((p, i) => ({ _key: `g${i}`, ...imageField(p, `${row.name} — view ${i + 2}`) }))

      docs.push({
        _id: `product.${pid}`,
        _type: 'product',
        name: row.name,
        slug: { _type: 'slug', current: `${slugify(row.name)}-${pid}` },
        pid,
        category: { _type: 'reference', _ref: `category.${catSlug}` },
        fabric: deriveFabric(row.name),
        description: row.name,
        care: 'Follow the care label. Wash separately before first use.',
        leadTime: '7–20 days',
        moq: 10,
        primaryImage: imageField(primary, row.name),
        ...(gallery.length ? { gallery } : {}),
        variants,
        basePrice,
        priceTierLabel: 'Tier A',
        priceTiers: [],
        sizeRuns: [{ _key: 'sr1', _type: 'sizeRunPack', ...src.sizeRun }],
        sourceUrl: row.product_url,
        srcMrp: mrp,
        srcSalePriceMin: min,
        srcSalePriceMax: max,
      })
      counts.products++
    }
  }

  for (const [slug, name] of colours) {
    docs.push({ _id: `colour.${slug}`, _type: 'colour', name, slug: { _type: 'slug', current: slug } })
    counts.colours++
  }

  return { docs, counts, skipped }
}

function main() {
  const { docs, counts, skipped } = build()
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(OUT_FILE, docs.map((d) => JSON.stringify(d)).join('\n') + '\n')

  console.log('— import-catalog —')
  console.log('dataset:', dataset, DRY ? '(dry run)' : '')
  console.log('counts:', JSON.stringify(counts))
  console.log('skipped:', skipped.length, skipped.length ? skipped.slice(0, 20) : '')
  console.log('NDJSON:', OUT_FILE, `(${docs.length} docs)`)

  if (counts.products === 0) { console.error('FAILED: 0 products built'); process.exit(1) }
  if (DRY) { console.log('dry run — not importing.'); return }

  try {
    console.log(`\nImporting via Sanity CLI into "${dataset}" (--replace)…`)
    execFileSync('npx', ['--no-install', 'sanity', 'dataset', 'import', OUT_FILE, dataset, '--replace'], { cwd: ROOT, stdio: 'inherit' })
    console.log('\n✔ import complete')
  } catch (err) {
    console.error('import failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

// Only run the importer when invoked directly (so tests can import the parsers from lib/import-parse).
if (process.argv[1] && /import-catalog\.ts$/.test(process.argv[1])) main()
