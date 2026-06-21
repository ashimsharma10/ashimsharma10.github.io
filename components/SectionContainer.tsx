import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function SectionContainer({ children }: Props) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-8 lg:max-w-5xl xl:max-w-6xl">
      {children}
    </section>
  )
}
