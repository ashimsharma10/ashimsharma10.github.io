import Image from './Image'
import Link from './Link'

const Card = ({ title, description, imgSrc, href, imageContain = false }) => (
  <div className="md max-w-[544px] p-0 md:w-1/2 xl:w-1/3">
    <div
      className={`${
        imgSrc && 'h-full'
      } overflow-hidden rounded-md border-2 border-gray-200/60 dark:border-gray-700/60`}
    >
      {imgSrc &&
        (href ? (
          <Link href={href} aria-label={`Link to ${title}`} className="block">
            <Image
              alt={title}
              src={imgSrc}
              className={
                imageContain
                  ? 'h-32 w-full object-contain object-center p-6 md:h-36'
                  : 'h-auto w-full'
              }
              width={544}
              height={306}
            />
          </Link>
        ) : (
          <Image
            alt={title}
            src={imgSrc}
            className={
              imageContain
                ? 'h-32 w-full object-contain object-center p-6 md:h-36'
                : 'h-auto w-full'
            }
            width={544}
            height={306}
          />
        ))}
      <div className="p-6">
        <h2 className="mb-3 text-lg leading-6 font-bold tracking-tight">
          {href ? (
            <Link href={href} aria-label={`Link to ${title}`}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <p className="prose prose-sm dark:prose-invert mb-3 max-w-none text-gray-900 dark:text-gray-400">
          {description}
        </p>
        {href && (
          <Link
            href={href}
            className="text-[#047857] hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7] text-base leading-6 font-medium"
            aria-label={`Link to ${title}`}
          >
            Learn more &rarr;
          </Link>
        )}
      </div>
    </div>
  </div>
)

export default Card
