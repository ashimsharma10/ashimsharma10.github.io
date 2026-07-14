import TagGraph, { GraphPost } from '@/components/TagGraph'
import { allBlogs } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Tags', description: 'Things I blog about' })

export default async function Page() {
  const posts: GraphPost[] = allBlogs
    .filter((p) => p.draft !== true && p.tags && p.tags.length > 0)
    .map((p) => ({ title: p.title, path: p.path, tags: p.tags as string[] }))

  return (
    <>
      <div className="pt-6 pb-8 md:mt-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-3xl sm:leading-9 md:text-4xl md:leading-10 dark:text-gray-100">
            Tags
          </h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            A map of everything I write about and the ideas that connect them.
          </p>
        </div>
        {posts.length === 0 ? 'No tags found.' : <TagGraph posts={posts} />}
      </div>
    </>
  )
}
