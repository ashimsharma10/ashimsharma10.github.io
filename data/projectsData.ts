interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
  imageContain?: boolean
}

const projectsData: Project[] = [
  {
    title: 'Social Sentiment Dashboard',
    description:
      'An event-driven sentiment monitor for Rivian: Reddit, App Store reviews, X/Twitter, and NHTSA complaints flow through a Kafka pipeline with HuggingFace sentiment analysis into a FastAPI + Next.js dashboard, backed by a Slack-integrated safety-triage queue.',
    imgSrc: '/static/images/social-sentiment-dashboard/card-thumbnail.png',
    href: '/projects/social-sentiment-dashboard',
  },
  {
    title: 'GAN-Based Real-World Image Super-Resolution',
    description:
      'A two-step GAN pipeline for real-world image super-resolution using a Real-to-Bicubic generator and nESRGAN+ network, achieving state-of-the-art perceptual quality.',
    imgSrc: '/static/images/gan-sr-pipeline/card-thumbnail.png',
    href: '/projects/gan-sr-pipeline',
  },
  {
    title: 'PR Warden',
    description:
      'A GitHub App that automatically triages pull requests using a multi-agent architecture: deterministic checks run alongside a tool-using LLM agent for deeper review. Posts a single verdict comment per PR with facet labels so maintainers route their queue without reading every diff.',
    imgSrc: '/static/images/pr-warden/logo.png',
    href: 'https://github.com/ashimsharma10/PR_warden',
    imageContain: true,
  },
]

export default projectsData
