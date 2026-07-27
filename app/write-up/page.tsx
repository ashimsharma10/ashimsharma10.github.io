import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import ListLayout from '@/layouts/ListLayoutWithTags'

const POSTS_PER_PAGE = 15

export const metadata = genPageMetadata({ title: 'Write-ups' })

export default async function BlogPage(props: { searchParams: Promise<{ page: string }> }) {
  const sorted = allCoreContent(sortPosts(allBlogs))
  const pinned = sorted
    .filter((p) => typeof p.pinned === 'number')
    .sort((a, b) => (a.pinned as number) - (b.pinned as number))
  const rest = sorted.filter((p) => typeof p.pinned !== 'number')
  const posts = [...pinned, ...rest]
  const pageNumber = 1
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE * pageNumber)
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

  return (
    <ListLayout
      posts={posts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="All Write-ups"
    />
  )
}
