interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'GAN-Based Real-World Image Super-Resolution',
    description:
      'A two-step GAN pipeline for real-world image super-resolution using a Real-to-Bicubic generator and nESRGAN+ network, achieving state-of-the-art perceptual quality.',
    imgSrc: '/static/images/gan-sr-pipeline/card-thumbnail.png',
    href: '/projects/gan-sr-pipeline',
  },
]

export default projectsData
