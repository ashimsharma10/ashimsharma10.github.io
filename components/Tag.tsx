import Link from 'next/link'
import { slug } from 'github-slugger'
interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className="mr-3 text-[11px] font-medium text-[#047857] uppercase hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
    >
      {text.split(' ').join('-')}
    </Link>
  )
}

export default Tag
