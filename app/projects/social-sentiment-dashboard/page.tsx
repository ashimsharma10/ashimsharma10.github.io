import { Metadata } from 'next'
import Image from '@/components/Image'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'

export const metadata: Metadata = {
  title: 'Social Sentiment Dashboard',
  description:
    'An event-driven Kafka pipeline that monitors Rivian sentiment across Reddit, App Store reviews, X/Twitter, and NHTSA complaints, feeding a FastAPI + Next.js dashboard with a Slack-integrated safety-triage queue.',
}

export default function SocialSentimentDashboardPage() {
  return (
    <SectionContainer>
      <article>
        <div className="pt-4 pb-2">
          <Link
            href="/projects"
            className="text-sm text-[#047857] hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
          >
            &larr; Back
          </Link>
        </div>
        <div className="space-y-1 border-b border-gray-200 pb-4 text-center dark:border-gray-700">
          <h1 className="text-2xl leading-8 font-bold tracking-tight text-gray-900 sm:text-3xl sm:leading-9 md:text-4xl md:leading-12 dark:text-gray-100">
            Social Sentiment Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Event-Driven Data Pipeline &middot; Full-Stack
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none pt-4 pb-8">
          <div className="not-prose mb-8 rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              This page is a high-level tour of the system. The full source code, migration plan,
              and decision log live in the{' '}
              <Link
                href="https://github.com/ashimsharma10/social-sentiment-dashboard"
                className="text-[#047857] underline hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
              >
                GitHub repository
              </Link>
              .
            </p>
          </div>

          <h2>What it is</h2>
          <p>
            Social Sentiment Dashboard is a sentiment monitor for the EV maker Rivian. It
            continuously watches what owners and prospective buyers are saying across four very
            different channels &mdash; Reddit posts and comments, Apple App Store reviews, X/Twitter
            posts, and official NHTSA safety complaints &mdash; scores each item for sentiment,
            surfaces recurring issues, and pushes anything safety-related to a review queue with
            Slack alerts. Everything lands in a single FastAPI + Next.js dashboard instead of four
            scattered feeds.
          </p>

          <h2>Why it matters</h2>
          <p>
            For a hardware company, customer feedback is both critical and hopelessly fragmented.
            A frustrated owner might vent on Reddit, leave a one-star App Store review, tag the
            brand on X, and &mdash; if it&rsquo;s a genuine safety defect &mdash; file an NHTSA
            complaint, and no single team ever sees the whole picture. Safety and service signals
            in particular are easy to miss until they become a pattern, by which point they&rsquo;re
            expensive. This project treats that scattered chatter as a real-time stream: it
            aggregates every source into one place, quantifies whether sentiment is trending up or
            down, clusters the noise into concrete issues, and makes sure a critical safety
            complaint reaches a human in Slack within minutes rather than a weekly report.
          </p>
          <p>
            Just as importantly, it&rsquo;s built the way such a system would run in production
            &mdash; as an event-driven Kafka pipeline rather than a cron job or a batch script. That
            choice is what lets the sources, the sentiment model, the safety flagging, and the
            alerting all scale and fail independently, and it&rsquo;s the part of the project most
            of the engineering went into.
          </p>

          <h2>How it works</h2>
          <p>
            The sources feed an Apache Kafka pipeline whose stages &mdash; ingestion,
            HuggingFace-based sentiment analysis, safety flagging, and Slack notification &mdash;
            each run as independent consumers. Postgres backs the FastAPI API and the Next.js
            dashboard, including the safety-triage queue for reviewing flagged posts.
          </p>

          <h2>Architecture</h2>
          <div className="not-prose mt-2 mb-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700">
              <Image
                alt="System architecture: pollers fetch Reddit, App Store, X/Twitter, and NHTSA data into Kafka topics; worker consumers run ingestion, sentiment analysis, flagging, and notification stages; Postgres backs the FastAPI API and Next.js dashboard"
                src="/static/images/social-sentiment-dashboard/architecture.svg"
                width={1020}
                height={505}
                className="mx-auto"
              />
            </div>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Pollers feed raw topics; five stage consumers move items through analysis, flagging,
              and notification; the API publishes commands back into the pipeline.
            </p>
          </div>
          <p>
            Everything runs under Docker Compose: a KRaft-mode Kafka broker, Postgres 16, a poller
            process (fetch loops plus backfill and command consumers), a worker process (five
            stage consumers), the FastAPI backend, and the Next.js frontend &mdash; with Kafka UI
            for topic and consumer-lag inspection.
          </p>

          <h2>The Kafka pipeline</h2>
          <p>
            Seven topics (three partitions each) carry JSON payloads validated by Pydantic v2
            schemas. Raw items land in <code>social.items.raw</code> and{' '}
            <code>nhtsa.complaints.raw</code>; an ingest writer dedupes and persists them, then
            emits <code>items.new</code>. An analyzer consumer scores sentiment with a RoBERTa
            model and emits <code>items.analyzed</code>; a flagger promotes safety- and
            service-related posts to <code>flags.created</code>; a notifier delivers
            severity-filtered alerts to Slack. A <code>pipeline.commands</code> topic lets the API
            trigger polls and refreshes on demand.
          </p>
          <p>
            Delivery is at-least-once: consumers commit offsets only after the database
            transaction commits, and every write is idempotent under redelivery via unique
            constraints &mdash; so a crash between commit and offset advance never duplicates
            data.
          </p>

          <h2>Data sources</h2>
          <p>
            Sources are pluggable behind a small <code>Source</code> ABC &mdash; adding one means
            implementing a fetch method and registering it. Current sources: Reddit (public JSON
            with RSS fallback), NHTSA complaints, Apple App Store reviews (RSS), and X/Twitter via
            an Apify scraper with owner-voice queries and a promo filter (kept inert unless a
            token is configured, so no accidental spend).
          </p>

          <h2>Dashboard &amp; API</h2>
          <p>
            The FastAPI backend exposes stats (sentiment time series, per-entity and per-source
            breakdowns, weekly changes, executive summary), filtered post search, clustered issue
            cards, NHTSA complaint analytics, and a flag queue where resolving requires a note.
            The Next.js dashboard covers Overview, Charts, Entities, Issues, Posts, Flagged, and
            NHTSA views, plus a manual &ldquo;fetch now&rdquo; trigger that publishes a command
            into the pipeline. The backend ships with 47 tests.
          </p>

          <h2>Tech Stack</h2>
          <div className="not-prose flex flex-wrap gap-2">
            {[
              'Apache Kafka (KRaft)',
              'FastAPI',
              'Postgres 16',
              'SQLAlchemy async',
              'aiokafka',
              'HuggingFace Transformers',
              'Pydantic v2',
              'Next.js',
              'Tailwind CSS',
              'Docker Compose',
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#d1fae5] px-3 py-1 text-sm font-medium text-[#065f46] dark:bg-[#064e3b]/30 dark:text-[#6ee7b7]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="not-prose mt-8">
            <Link
              href="https://github.com/ashimsharma10/social-sentiment-dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#047857] hover:text-[#047857] dark:border-gray-600 dark:text-gray-300 dark:hover:border-[#34D399] dark:hover:text-[#34D399]"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              View on GitHub
            </Link>
          </div>
        </div>

        <footer className="pt-4 pb-8">
          <Link
            href="/projects"
            className="text-[#047857] hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
          >
            &larr; Back to Projects
          </Link>
        </footer>
      </article>
    </SectionContainer>
  )
}
