import projectsData from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-2xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-3xl sm:leading-9 md:text-4xl md:leading-10 dark:text-gray-100">
            Projects
          </h1>
          <p className="text-lg leading-7 text-gray-900 dark:text-gray-400">
            Things I&apos;ve built and am working on
          </p>
        </div>
        <div className="container pt-4 pb-12">
          <div className="flex flex-wrap gap-y-4">
            {projectsData.map((d) => (
              <Card
                key={d.title}
                title={d.title}
                description={d.description}
                imgSrc={d.imgSrc}
                href={d.href}
                imageContain={d.imageContain}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
