import { Metadata } from 'next'
import Image from '@/components/Image'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'

export const metadata: Metadata = {
  title: 'GAN-Based Two-Step Pipeline For Real-World Image Super-Resolution',
  description:
    'A two-step GAN pipeline for real-world image super-resolution using a Real-to-Bicubic generator and nESRGAN+ network.',
}

export default function GanSrPipelinePage() {
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
            GAN-Based Two-Step Pipeline For Real-World Image Super-Resolution
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Published Research Paper</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none pt-4 pb-8">
          <div className="not-prose mb-8 rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              This page provides a high-level overview of the research. The full paper contains
              detailed formulations, complete experimental analysis, and additional results. Please
              refer to the{' '}
              <Link
                href="https://link.springer.com/chapter/10.1007%2F978-981-16-4177-0_75"
                className="text-[#047857] underline hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
              >
                published paper
              </Link>{' '}
              for the complete work.
            </p>
          </div>

          <h2>Abstract</h2>
          <p>
            Most prior approaches to image super-resolution rely on pairs of high-resolution images
            and their bicubically downsampled low-resolution counterparts, achieving strong results
            on synthetic benchmarks but struggling to generalize to real-world low-resolution images
            where degradation patterns are complex and varied.
          </p>
          <p>
            This work proposes a GAN-based two-step pipeline to address real-world image
            super-resolution. The first stage trains a network to transform real-world
            low-resolution images into a space of bicubic-like images of the same size. The second
            stage applies a state-of-the-art super-resolution network (nESRGAN+) trained on bicubic
            downsampled/high-resolution pairs to upscale the transformed output. The proposed method
            outperforms existing state-of-the-art approaches both qualitatively and quantitatively
            across multiple benchmark datasets.
          </p>

          <h2>Methodology</h2>
          <p>
            The pipeline consists of two well-defined stages designed to bridge the gap between
            real-world degradation and standard super-resolution:
          </p>

          <div className="not-prose mt-2 mb-4">
            <Image
              alt="Two-step pipeline for real-world image super-resolution"
              src="/static/images/gan-sr-pipeline/pipeline-diagram-v2.png"
              width={560}
              height={464}
              className="mx-auto rounded-lg"
            />
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              The two-step pipeline: R2B generator transforms real-world LR images to bicubic-alike
              images, then nESRGAN+ performs 4x super-resolution.
            </p>
          </div>

          <h3>Stage 1: Real-to-Bicubic (R2B) Generator</h3>
          <p>
            A deep CNN with 8 residual blocks that transforms a real-world low-resolution image into
            a bicubic-like image of the same size. The network is trained using a combination of
            pixel loss (L1), VGG19-based perceptual loss, and adversarial loss with a Relativistic
            Average Discriminator (RaD). Training uses 800 images from DIV2K Track 2 and RealSR
            datasets, with bicubically downsampled HR images as ground truth.
          </p>

          <h3>Stage 2: Super-Resolution</h3>
          <p>
            A pre-trained nESRGAN+ model, which uses Residual-in-Residual Dense Blocks (RRDB) and
            noise inputs for stochastic variation, super-resolves the R2B output by a scale factor
            of 4x. By operating on bicubic-like images rather than raw real-world images, the SR
            network can leverage its full capability on a well-understood degradation model.
          </p>

          <h2>Key Results</h2>
          <p>
            The pipeline was evaluated on RealSR, DIV2K HR validation, and DPED cellphones test sets
            using PSNR, SSIM, and Perceptual Index (PI) metrics.{' '}
            <strong>
              The proposed approach achieved the best PI scores across all benchmark datasets,
              indicating superior perceptual quality compared to Bicubic interpolation, DPSR,
              RealSR, and RBSR methods.
            </strong>
          </p>

          <div className="not-prose my-8">
            <Image
              alt="Qualitative comparison of super-resolution results"
              src="/static/images/gan-sr-pipeline/results-comparison.png"
              width={1600}
              height={562}
              className="mx-auto rounded-lg"
            />
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Qualitative comparison on RealSR images. Lower PI indicates better perceptual quality.
              The proposed method produces sharper, more detailed results.
            </p>
          </div>

          <h2>Conclusion</h2>
          <p>
            The two-step approach effectively decomposes real-world super-resolution into two
            tractable sub-problems: domain translation (real-world to bicubic space) and standard
            super-resolution. By leveraging the strong performance of existing SR networks on
            bicubic degradation, the pipeline achieves state-of-the-art perceptual quality on
            real-world images without requiring end-to-end training on real LR/HR pairs. The source
            code and trained models have been made available for further research.
          </p>

          <h2>Index Terms</h2>
          <div className="not-prose flex flex-wrap gap-2">
            {[
              'Real-World Image Super-Resolution',
              'Generative Adversarial Network',
              'Perceptual Loss',
              'nESRGAN+',
              'Image Enhancement',
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#d1fae5] px-3 py-1 text-sm font-medium text-[#065f46] dark:bg-[#064e3b]/30 dark:text-[#6ee7b7]"
              >
                {tag}
              </span>
            ))}
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
