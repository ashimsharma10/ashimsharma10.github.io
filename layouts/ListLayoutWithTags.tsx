'use client'

import { usePathname } from 'next/navigation'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import tagData from 'app/tag-data.json'

interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname
    .replace(/^\//, '')
    .replace(/\/page\/\d+\/?$/, '')
    .replace(/\/$/, '')
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pt-6 pb-8 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
          </Link>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const pathname = usePathname()
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b))

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  return (
    <>
      <div>
        <div className="sr-only">
          <h1>{title}</h1>
        </div>
        <div className="flex sm:space-x-12">
          <div className="hidden h-full max-h-screen max-w-[200px] min-w-[200px] flex-col items-start overflow-auto rounded-sm bg-gray-50 pt-5 shadow-md sm:flex dark:bg-gray-900/70 dark:shadow-gray-800/40">
            <div className="px-6 py-4">
              {pathname.startsWith('/write-up') ? (
                <h3 className="font-bold text-[#047857] uppercase dark:text-[#34D399]">
                  All Write-ups
                </h3>
              ) : (
                <Link
                  href={`/write-up`}
                  className="font-bold text-gray-700 uppercase hover:text-[#047857] dark:text-gray-300 dark:hover:text-[#34D399]"
                >
                  All Write-ups
                </Link>
              )}
              <ul>
                {sortedTags.map((t) => {
                  return (
                    <li key={t} className="my-3">
                      {decodeURI(pathname.split('/tags/')[1])?.replace(/\/$/, '') === slug(t) ? (
                        <h3 className="inline py-2 text-sm font-bold text-[#047857] uppercase dark:text-[#34D399]">
                          {`${t} (${tagCounts[t]})`}
                        </h3>
                      ) : (
                        <Link
                          href={`/tags/${slug(t)}`}
                          className="py-2 text-sm font-medium text-gray-900 uppercase hover:text-[#047857] dark:text-gray-300 dark:hover:text-[#34D399]"
                          aria-label={`View posts tagged ${t}`}
                        >
                          {`${t} (${tagCounts[t]})`}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <ul>
              {displayPosts.map((post) => {
                const { path, date, title, summary, tags, pinned } = post
                const isPinned = typeof pinned === 'number'
                return (
                  <li key={path} className="py-4">
                    <article className="flex flex-col space-y-1 xl:space-y-0">
                      <dl>
                        <dt className="sr-only">Published on</dt>
                        <dd className="text-base leading-6 font-medium text-gray-900 dark:text-gray-400">
                          <time dateTime={date} suppressHydrationWarning>
                            {formatDate(date, siteMetadata.locale)}
                          </time>
                        </dd>
                      </dl>
                      <div className="space-y-1">
                        <div>
                          <h2 className="text-xl leading-7 font-bold tracking-tight">
                            <Link href={`/${path}`} className="text-gray-900 dark:text-gray-100">
                              {title}
                            </Link>
                            {isPinned && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#047857]/10 px-2 py-0.5 align-middle text-[10px] font-semibold tracking-wide text-[#047857] uppercase dark:bg-[#34D399]/15 dark:text-[#34D399]">
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                >
                                  <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1-.51.836l-1.813-.51-2.828 2.828 1.485 4.849a.5.5 0 0 1-.836.51l-3.182-3.182-3.182 3.182a.5.5 0 0 1-.707-.707l3.182-3.182-3.182-3.182a.5.5 0 0 1 .51-.836l4.849 1.485L11.746 4.13l-.51-1.813a.5.5 0 0 1 .146-.51z" />
                                </svg>
                                Pinned
                              </span>
                            )}
                          </h2>
                          <div className="flex flex-wrap">
                            {tags?.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose dark:prose-invert max-w-none truncate text-sm text-gray-900 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
            {pagination && pagination.totalPages > 1 && (
              <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
