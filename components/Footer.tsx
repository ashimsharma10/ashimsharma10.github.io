import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

export default function Footer() {
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-2 flex space-x-3">
          <SocialIcon kind="mail" href={`mailto:${siteMetadata.email}`} size={5} />
          <SocialIcon kind="github" href={siteMetadata.github} size={5} />
          <SocialIcon kind="facebook" href={siteMetadata.facebook} size={5} />
          <SocialIcon kind="youtube" href={siteMetadata.youtube} size={5} />
          <SocialIcon kind="linkedin" href={siteMetadata.linkedin} size={5} />
          <SocialIcon kind="twitter" href={siteMetadata.twitter} size={5} />
          <SocialIcon kind="bluesky" href={siteMetadata.bluesky} size={5} />
          <SocialIcon kind="x" href={siteMetadata.x} size={5} />
          <SocialIcon kind="instagram" href={siteMetadata.instagram} size={5} />
          <SocialIcon kind="threads" href={siteMetadata.threads} size={5} />
          <SocialIcon kind="medium" href={siteMetadata.medium} size={5} />
        </div>
        <div className="mb-2 flex space-x-2 text-xs text-gray-900 dark:text-gray-400">
          <div>{siteMetadata.author}</div>
          <div>{` • `}</div>
          <div>{`© ${new Date().getFullYear()}`}</div>
          <div>{` • `}</div>
          <Link href="/">{siteMetadata.title}</Link>
        </div>
      </div>
    </footer>
  )
}
