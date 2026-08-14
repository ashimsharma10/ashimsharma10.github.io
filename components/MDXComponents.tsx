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
import LoopVsGraphSim from './writeups/LoopVsGraphSim'
import BatchingSim from './writeups/BatchingSim'
import PagedKVSim from './writeups/PagedKVSim'
import QuantumTimeline from './writeups/quantum/QuantumTimeline'
import QubitCollapse from './writeups/quantum/QubitCollapse'
import DoubleSlit from './writeups/quantum/DoubleSlit'
import SpinExplainer from './writeups/quantum/SpinExplainer'
import WaveParticleAnimation from './writeups/quantum/WaveParticleAnimation'
import ParticleBuilder from './writeups/quantum/ParticleBuilder'
import EntanglementAnimation from './writeups/quantum/EntanglementAnimation'
import UniverseComposition from './writeups/quantum/UniverseComposition'

export const components: MDXComponents = {
  Image,
  TOCInline,
  MermaidChart,
  LinuxFSHierarchy,
  RiemannZeta,
  LoopVsGraphSim,
  BatchingSim,
  PagedKVSim,
  QuantumTimeline,
  QubitCollapse,
  DoubleSlit,
  SpinExplainer,
  WaveParticleAnimation,
  ParticleBuilder,
  EntanglementAnimation,
  UniverseComposition,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
}
