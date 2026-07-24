import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import MermaidChart from './MermaidChart'
import LinuxFSHierarchy from './LinuxFSHierarchy'
import RiemannZeta from './writeups/RiemannZeta'
import QubitCollapse from './writeups/quantum/QubitCollapse'
import DoubleSlit from './writeups/quantum/DoubleSlit'
import EntangledPair from './writeups/quantum/EntangledPair'
import SpinAnimation from './writeups/quantum/SpinAnimation'
import WaveParticleAnimation from './writeups/quantum/WaveParticleAnimation'
import StandardModelChart from './writeups/quantum/StandardModelChart'

export const components: MDXComponents = {
  Image,
  TOCInline,
  MermaidChart,
  LinuxFSHierarchy,
  RiemannZeta,
  QubitCollapse,
  DoubleSlit,
  EntangledPair,
  SpinAnimation,
  WaveParticleAnimation,
  StandardModelChart,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
}
