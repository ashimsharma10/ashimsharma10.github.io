import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { allBlogs } from '../.contentlayer/generated/index.mjs'

const outputFolder = process.env.EXPORT ? 'out' : 'public'

async function generateMarkdownMirrors() {
  const published = allBlogs.filter((p) => p.draft !== true)
  for (const post of published) {
    const sourceFile = path.join('data', post._raw.sourceFilePath)
    const content = readFileSync(sourceFile, 'utf-8')
    const outDir = path.join(outputFolder, 'write-up', post.slug)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(path.join(outDir, 'index.md'), content)
  }
  console.log('Markdown mirrors generated...')
}

export default generateMarkdownMirrors
