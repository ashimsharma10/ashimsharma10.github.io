import rss from './rss.mjs'
import generateMarkdownMirrors from './generate-markdown-mirrors.mjs'

async function postbuild() {
  await rss()
  await generateMarkdownMirrors()
}

postbuild()
