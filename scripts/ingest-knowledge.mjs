/**
 * Build the chatbot knowledge base and push it to the Cloudflare Worker's
 * /ingest endpoint (which embeds + upserts into Vectorize).
 *
 * Sources (all existing site content — nothing new to author):
 *   - Bio       : data/authors/default.mdx
 *   - Projects  : data/projectsData.ts
 *   - Blog posts: data/blog/*.mdx  (full body, chunked)
 *
 * Usage (from repo root):
 *   CHAT_API_URL=https://<worker>.workers.dev \
 *   INGEST_SECRET=<secret> \
 *   npm run ingest
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SITE_URL = 'https://ashimsharma10.github.io'

const CHAT_API_URL = (process.env.CHAT_API_URL || '').replace(/\/$/, '')
const INGEST_SECRET = process.env.INGEST_SECRET || ''
if (!CHAT_API_URL || !INGEST_SECRET) {
  console.error('Missing env. Set CHAT_API_URL and INGEST_SECRET.')
  process.exit(1)
}

const CHUNK_SIZE = 1200 // chars
const CHUNK_OVERLAP = 200

/** Split text into overlapping chunks on paragraph/sentence boundaries. */
function chunk(text) {
  const clean = text.replace(/\r/g, '').trim()
  if (clean.length <= CHUNK_SIZE) return [clean]
  const paras = clean.split(/\n{2,}/)
  const chunks = []
  let buf = ''
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > CHUNK_SIZE && buf) {
      chunks.push(buf.trim())
      buf = buf.slice(Math.max(0, buf.length - CHUNK_OVERLAP)) + '\n\n' + p
    } else {
      buf = buf ? buf + '\n\n' + p : p
    }
  }
  if (buf.trim()) chunks.push(buf.trim())
  return chunks
}

/** Strip MDX noise (imports/JSX-ish lines) that add no semantic value. */
function stripMdx(body) {
  return body
    .replace(/^import .*$/gm, '')
    .replace(/^export .*$/gm, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

const items = []

// --- Bio ---
{
  const raw = fs.readFileSync(path.join(ROOT, 'data/authors/default.mdx'), 'utf8')
  const { data, content } = matter(raw)
  const text =
    `Ashim Sharma — ${data.occupation || ''}. Email: ${data.email || ''}. ` +
    `LinkedIn: ${data.linkedin || ''}. GitHub: ${data.github || ''}.\n\n${stripMdx(content)}`
  items.push({
    id: 'bio',
    text,
    metadata: { title: 'About Ashim', url: `${SITE_URL}/about/`, type: 'bio' },
  })
}

// --- Projects (parsed from projectsData.ts) ---
{
  const src = fs.readFileSync(path.join(ROOT, 'data/projectsData.ts'), 'utf8')
  // Match each { ... } object literal in the array and pull known fields.
  const objects = src.match(/\{[^}]*?title:[\s\S]*?\}/g) || []
  objects.forEach((obj, i) => {
    const title = (obj.match(/title:\s*'([^']*)'/) || [])[1]
    const description = (obj.match(/description:\s*\n?\s*'([^']*)'/) || [])[1]
    const href = (obj.match(/href:\s*'([^']*)'/) || [])[1] || ''
    if (!title) return
    const url = href.startsWith('http') ? href : `${SITE_URL}${href}`
    items.push({
      id: `project-${i}`,
      text: `Project: ${title}. ${description || ''} Link: ${url}`,
      metadata: { title: `Project: ${title}`, url, type: 'project' },
    })
  })
}

// --- Blog posts ---
{
  const blogDir = path.join(ROOT, 'data/blog')
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.mdx'))
  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf8')
    const { data, content } = matter(raw)
    if (data.draft === true) continue
    const slug = file.replace(/\.mdx$/, '')
    const url = `${SITE_URL}/write-up/${slug}/`
    const title = data.title || slug
    const summary = data.summary ? `${data.summary}\n\n` : ''
    const parts = chunk(summary + stripMdx(content))
    parts.forEach((part, i) => {
      items.push({
        id: `blog-${slug}-${i}`,
        text: `From the write-up "${title}":\n${part}`,
        metadata: { title, url, type: 'blog' },
      })
    })
  }
}

console.log(`Prepared ${items.length} chunks. Uploading to ${CHAT_API_URL}/ingest ...`)

// Upload in batches to stay well within request limits.
const BATCH = 20
let uploaded = 0
for (let i = 0; i < items.length; i += BATCH) {
  const batch = items.slice(i, i + BATCH)
  const res = await fetch(`${CHAT_API_URL}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${INGEST_SECRET}`,
    },
    body: JSON.stringify(batch),
  })
  if (!res.ok) {
    console.error(`Batch ${i / BATCH} failed: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  const out = await res.json()
  uploaded += out.upserted || batch.length
  console.log(`  batch ${i / BATCH + 1}: upserted ${out.upserted}`)
}

console.log(`Done. Upserted ${uploaded} vectors into the knowledge base.`)
