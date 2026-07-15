import { writeFileSync } from 'fs'
import { allBlogs } from '../.contentlayer/generated/index.mjs'
import { sortPosts } from 'pliny/utils/contentlayer.js'
import siteMetadata from '../data/siteMetadata.js'

const outputFolder = process.env.EXPORT ? 'out' : 'public'
const siteUrl = siteMetadata.siteUrl

async function generateLlmsTxt() {
  const published = sortPosts(allBlogs.filter((p) => p.draft !== true))

  const lines = [
    `# ${siteMetadata.author}`,
    '',
    `> ${siteMetadata.description}`,
    '',
    '## Write-ups',
    '',
  ]

  for (const post of published) {
    const mdUrl = `${siteUrl}/write-up/${post.slug}/index.md`
    lines.push(`- [${post.title}](${mdUrl}): ${post.summary ?? ''}`)
  }

  lines.push('')
  lines.push('## About')
  lines.push('')
  lines.push(`- [Profile](${siteUrl}/profile.md): Bio, skills, experience, contact`)
  lines.push('')
  lines.push('## Optional')
  lines.push('')
  lines.push(`- [Full site content](${siteUrl}/llms-full.txt): All posts concatenated`)
  lines.push('')

  writeFileSync(`${outputFolder}/llms.txt`, lines.join('\n'))

  const full = published.map((post) => `# ${post.title}\n\n${post.body.raw}`).join('\n\n---\n\n')
  writeFileSync(`${outputFolder}/llms-full.txt`, full)

  console.log('llms.txt generated...')
}

export default generateLlmsTxt
