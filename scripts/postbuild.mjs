import rss from './rss.mjs'
import generateMarkdownMirrors from './generate-markdown-mirrors.mjs'
import generateLlmsTxt from './generate-llms-txt.mjs'

async function postbuild() {
  await rss()
  await generateMarkdownMirrors()
  await generateLlmsTxt()
}

postbuild()
