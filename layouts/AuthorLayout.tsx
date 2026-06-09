'use client'

import { ReactNode, useEffect, useState } from 'react'
import type { Authors } from 'contentlayer/generated'
import SocialIcon from '@/components/social-icons'
import Image from '@/components/Image'

interface Props {
  children: ReactNode
  content: Omit<Authors, '_id' | '_raw' | 'body'>
}

const experience = [
  {
    period: 'May 2025 – Aug 2025',
    location: 'Palo Alto, CA',
    role: 'Data Scientist',
    company: 'Rivian & Volkswagen Group Technologies',
    logoUrl: '/static/images/logos/rivian.png',
    logoInitial: 'R',
    logoBg: 'bg-yellow-600',
    bullets: [
      'Built scalable RAG pipelines on Databricks (Delta Lake, MLflow) using vector embeddings (Pinecone/FAISS) and LangChain to enable intelligent retrieval across large automotive regulatory corpora, reducing manual review effort by 95%.',
      'Preprocessed and analyzed 50,000+ unstructured customer reviews from Reddit and X (Twitter); built and evaluated an NLP sentiment classifier (85%+ accuracy) and entity recognition pipeline, surfacing 200+ actionable automotive product insights per month and reducing issue response time by 40%.',
      'Tracked model performance and hyperparameter configurations in MLflow; maintained reproducible experiment logs and version-controlled all pipeline code via Git.',
      'Built Tableau dashboards to communicate model behavior and insights to senior leadership; partnered with cross-functional stakeholders to accelerate delivery by 20%.',
    ],
  },
  {
    period: 'Jan 2024 – Dec 2025',
    location: 'Lafayette, LA',
    role: 'Data Science & AI Teaching Assistant',
    company: 'CGI / University of Louisiana at Lafayette',
    logoUrl: '/static/images/logos/cgi.png',
    logoInitial: 'C',
    logoBg: 'bg-red-600',
    bullets: [
      'Led applied ML and GenAI curriculum with CGI Inc., mentoring 150+ students on statistical modeling, model evaluation, EDA, and LLM fine-tuning; designed hands-on Python labs covering regression, classification, and ensemble methods.',
      'Delivered comprehensive training on AI frameworks including PyTorch, Transformer architectures, GPT, BERT, and prompt engineering; designed hands-on labs covering machine learning algorithms for 50+ students.',
    ],
  },
  {
    period: 'Apr 2021 – Nov 2022',
    location: 'New York, NY',
    role: 'Machine Learning Engineer',
    company: 'FuseMachines, Inc.',
    logoUrl: '/static/images/logos/fusemachines.png',
    logoInitial: 'F',
    logoBg: 'bg-blue-600',
    bullets: [
      'Built and evaluated deep learning models (3D U-Net, PyTorch) for medical image segmentation achieving ~0.85 Dice score; assessed new clinical data sources and preprocessed multi-modal datasets using PySpark for scalable downstream modeling.',
      'Developed EHR-based disease prognosis pipelines using Cox proportional hazards and XGBoost; improved early-detection AUC from 0.72 to 0.81 and presented results to clinical stakeholders via dashboards.',
      'Contributed to REST API integrations for model inference; collaborated with IT on deployment workflows, model versioning, and production readiness.',
    ],
  },
]

const education = [
  {
    period: 'Jan 2024 – Dec 2025',
    location: 'Lafayette, LA',
    degree: 'M.S. Computer Science',
    school: 'University of Louisiana at Lafayette',
    logoUrl: '/static/images/logos/ul-lafayette.png',
    logoInitial: 'UL',
    logoBg: 'bg-red-700',
    note: '4.0 GPA',
  },
]

const skillGroups = [
  { label: 'Languages', value: 'Python, C#, SQL, C++, TypeScript' },
  { label: 'AI Frameworks', value: 'LangChain, PyTorch, TensorFlow, OpenAI, HuggingFace, LlamaIndex' },
  { label: 'Machine Learning', value: 'Natural Language Processing, Deep Learning, Pre-trained Models, Model Integration' },
  { label: 'Cloud Technologies', value: 'AWS, Azure, GCP, Databricks (Delta Lake, MLflow), Data Lakes' },
  { label: 'Data & Analytics', value: 'Large Datasets, Data Pipelines, Vector Databases (Pinecone, FAISS), ETL' },
  { label: 'Development', value: 'Version Control Systems (Git), Agile Methodologies, CI/CD, Docker, Software Development' },
]

const publications = [
  {
    citation:
      'Gaire R.R., Subedi R., Sharma A., Subedi S., Ghimire S.K., Shakya S. (2022) GAN-Based Two-Step Pipeline for Real-World Image Super-Resolution.',
    venue: 'ICT with Intelligent Applications. Smart Innovation, Systems and Technologies, vol 248. Springer, Singapore.',
    url: 'https://link.springer.com/chapter/10.1007%2F978-981-16-4177-0_75',
  },
]

const certifications = [
  {
    title: 'Machine Learning Specialization',
    issuer: 'Stanford University',
    logoInitial: 'S',
    logoBg: 'bg-red-700',
    logoUrl: '/static/images/logos/stanford.png',
    url: 'https://www.coursera.org/account/accomplishments/verify/ZD4PHJ2FEF4H',
  },
  {
    title: 'Data Engineering Specialization',
    issuer: 'Amazon Web Services (AWS)',
    logoInitial: 'AWS',
    logoBg: 'bg-gray-900',
    logoUrl: '/static/images/logos/aws.png',
    url: 'https://www.coursera.org/account/accomplishments/specialization/637M2BBSLAF5',
  },
  {
    title: 'Deep Learning Specialization',
    issuer: 'Coursera',
    logoInitial: 'C',
    logoBg: 'bg-blue-600',
    logoUrl: '/static/images/logos/coursera.png',
    url: 'https://www.coursera.org/account/accomplishments/specialization/UZE6U8PEXWGV',
  },
  {
    title: 'Linear Algebra & Calculus',
    issuer: 'MIT OpenCourseWare',
    logoInitial: 'MIT',
    logoBg: 'bg-red-800',
    logoUrl: '/static/images/logos/mit.svg',
    url: '',
  },
]

const conferences = [
  {
    name: 'NVIDIA GTC 2026',
    detail: 'March 16–19, 2026 · San Jose, CA',
    logoUrl: '/static/images/logos/nvidia-gtc.jpg',
    logoBg: 'bg-black',
    logoInitial: 'GTC',
    cover: true,
  },
  {
    name: 'Stanford AI+Health 2025',
    detail: 'December 9–10, 2025 · Stanford University · Virtual',
    logoUrl: '/static/images/logos/stanford.png',
    logoBg: 'bg-red-800',
    logoInitial: 'AI+H',
    cover: false,
  },
]

const navLinks = [
  { id: 'about', label: 'ABOUT' },
  { id: 'experience', label: 'EXPERIENCE' },
  { id: 'education', label: 'EDUCATION' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'publications', label: 'PUBLICATIONS' },
  { id: 'certifications', label: 'CERTIFICATIONS' },
  { id: 'conferences', label: 'CONFERENCES' },
]

function OrgLogo({
  url,
  initial,
  bg,
  name,
  cover = false,
}: {
  url: string
  initial: string
  bg: string
  name: string
  cover?: boolean
}) {
  const [error, setError] = useState(false)
  if (!url || error) {
    return (
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md ${bg} text-xs font-bold text-white`}
      >
        {initial}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      className={`h-11 w-11 flex-shrink-0 rounded-md bg-white ${cover ? 'object-cover' : 'object-contain p-1'}`}
      onError={() => setError(true)}
    />
  )
}

export default function AuthorLayout({ children, content }: Props) {
  const { name, avatar, occupation, email, twitter, bluesky, linkedin, github } = content
  const [activeSection, setActiveSection] = useState('about')

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const innerH = window.innerHeight
      const maxScroll = document.documentElement.scrollHeight - innerH
      const trigger = scrollY > maxScroll - 200 ? scrollY + innerH * 0.6 : scrollY + 100
      let current = navLinks[0].id
      for (const { id } of navLinks) {
        const el = document.getElementById(id)
        if (el) {
          const absTop = el.getBoundingClientRect().top + scrollY
          if (absTop <= trigger) current = id
        }
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="lg:flex lg:gap-8 xl:gap-12">
      {/* Left sticky sidebar */}
      <aside className="pt-8 pb-8 lg:sticky lg:top-8 lg:w-56 lg:flex-shrink-0 lg:self-start xl:w-64">
        <div className="flex flex-col items-center text-center">
          {avatar && (
            <Image
              src={avatar}
              alt="avatar"
              width={112}
              height={112}
              className="mb-6 h-24 w-24 rounded-full"
            />
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 xl:text-3xl">
            {name}
          </h1>
          <p className="mt-2 text-sm text-gray-900 dark:text-gray-400">{occupation}</p>

          {/* Section nav — desktop only */}
          <nav className="mt-10 hidden lg:block">
            <ul className="space-y-3">
              {navLinks.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`group flex items-center gap-3 text-xs font-semibold tracking-widest transition-all duration-200 ${
                      activeSection === id
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-300'
                    }`}
                  >
                    <span
                      className={`block h-px transition-all duration-200 ${
                        activeSection === id
                          ? 'w-12 bg-gray-900 dark:bg-gray-100'
                          : 'w-6 bg-gray-300 group-hover:w-10 group-hover:bg-gray-900 dark:bg-gray-600 dark:group-hover:bg-gray-400'
                      }`}
                    />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social icons — below nav, centered */}
          <div className="mt-8 flex gap-3">
            <SocialIcon kind="mail" href={`mailto:${email}`} size={5} />
            <SocialIcon kind="github" href={github} size={5} />
            <SocialIcon kind="linkedin" href={linkedin} size={5} />
            <SocialIcon kind="x" href={twitter} size={5} />
            {bluesky && <SocialIcon kind="bluesky" href={bluesky} size={5} />}
          </div>
        </div>
      </aside>

      {/* Right scrollable content */}
      <main className="min-w-0 flex-1 py-8 lg:py-16">
        {/* About */}
        <section id="about" className="mb-16 scroll-mt-8">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 lg:sr-only">
            About
          </h2>
          <div className="prose prose-base dark:prose-invert max-w-none [&>*]:text-gray-900 dark:[&>*]:text-gray-300 [&>p:first-child]:mt-0">
            {children}
          </div>
        </section>

        {/* Experience */}
        <section id="experience" className="mb-16 scroll-mt-8">
          <h2 className="mb-8 text-xs font-semibold uppercase tracking-widest text-gray-900 dark:text-gray-500">
            Experience
          </h2>
          <div className="space-y-10">
            {experience.map((job, i) => (
              <div key={i}>
                {/* Header row: logo + title/company + date/location */}
                <div className="flex items-start gap-4">
                  <OrgLogo
                    url={job.logoUrl}
                    initial={job.logoInitial}
                    bg={job.logoBg}
                    name={job.company}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{job.role}</h3>
                      <p className="text-sm text-gray-900 dark:text-gray-400">{job.company}</p>
                    </div>
                    <div className="flex-shrink-0 sm:text-right">
                      <p className="text-xs text-gray-900 dark:text-gray-500">{job.period}</p>
                      <p className="text-xs text-gray-900 dark:text-gray-500">{job.location}</p>
                    </div>
                  </div>
                </div>
                {/* Bullets — extra top spacing */}
                <ul className="mt-5 space-y-2">
                  {job.bullets.map((b, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm leading-relaxed text-gray-900 dark:text-gray-400"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-gray-600" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section id="education" className="mb-16 scroll-mt-8">
          <h2 className="mb-8 text-xs font-semibold uppercase tracking-widest text-gray-900 dark:text-gray-500">
            Education
          </h2>
          <div className="space-y-8">
            {education.map((edu, i) => (
              <div key={i} className="flex gap-4">
                <OrgLogo
                  url={edu.logoUrl}
                  initial={edu.logoInitial}
                  bg={edu.logoBg}
                  name={edu.school}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{edu.degree}</h3>
                      <p className="text-sm text-gray-900 dark:text-gray-400">{edu.school}</p>
                    </div>
                    <div className="flex-shrink-0 sm:text-right">
                      <p className="text-xs text-gray-900 dark:text-gray-500">{edu.period}</p>
                      <p className="text-xs text-gray-900 dark:text-gray-500">{edu.location}</p>
                    </div>
                  </div>
                  {edu.note && (
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                      {edu.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="mb-16 scroll-mt-8">
          <h2 className="mb-8 text-xs font-semibold uppercase tracking-widest text-gray-900 dark:text-gray-500">
            Skills
          </h2>
          <div className="space-y-3">
            {skillGroups.map((group) => (
              <p key={group.label} className="text-sm leading-relaxed text-gray-900 dark:text-gray-400">
                <span className="font-semibold">{group.label}:</span> {group.value}
              </p>
            ))}
          </div>
        </section>

        {/* Publications */}
        <section id="publications" className="mb-16 scroll-mt-8">
          <h2 className="mb-8 text-xs font-semibold uppercase tracking-widest text-gray-900 dark:text-gray-500">
            Publications
          </h2>
          <ul className="space-y-4">
            {publications.map((pub, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-400">
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {pub.citation}
                  </a>{' '}
                  <span className="italic">{pub.venue}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Certifications */}
        <section id="certifications" className="mb-16 scroll-mt-8">
          <h2 className="mb-8 text-xs font-semibold uppercase tracking-widest text-gray-900 dark:text-gray-500">
            Certifications
          </h2>
          <ul className="space-y-4">
            {certifications.map((cert, i) => (
              <li key={i} className="flex items-center gap-3">
                <OrgLogo
                  url={cert.logoUrl}
                  initial={cert.logoInitial}
                  bg={cert.logoBg}
                  name={cert.issuer}
                />
                <div>
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-900 hover:underline dark:text-gray-100"
                    >
                      {cert.title}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {cert.title}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Conferences Attended */}
        <section id="conferences" className="mb-16 scroll-mt-8">
          <h2 className="mb-8 text-xs font-semibold uppercase tracking-widest text-gray-900 dark:text-gray-500">
            Conferences Attended
          </h2>
          <ul className="space-y-4">
            {conferences.map((conf, i) => (
              <li key={i} className="flex items-center gap-3">
                <OrgLogo
                  url={conf.logoUrl}
                  initial={conf.logoInitial}
                  bg={conf.logoBg}
                  name={conf.name}
                  cover={conf.cover}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {conf.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{conf.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
