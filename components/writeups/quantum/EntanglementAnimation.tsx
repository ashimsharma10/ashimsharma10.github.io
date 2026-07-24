'use client'

import RemotionPlayer from './RemotionPlayer'
import { ENT_DURATION, ENT_FPS, ENT_HEIGHT, ENT_WIDTH } from './entanglementConstants'

const load = () => import('./EntanglementComposition')

export default function EntanglementAnimation() {
  return (
    <RemotionPlayer
      title="Entanglement, one step at a time"
      caption="One event makes two linked particles and sends them far apart. Neither has chosen up or down. The moment Alice looks, her result is random, and Bob's is instantly fixed to match. Alone, each looks like a coin toss; the match only shows up when they compare notes later, at ordinary speed. Scrub the timeline to follow it."
      load={load}
      durationInFrames={ENT_DURATION}
      fps={ENT_FPS}
      width={ENT_WIDTH}
      height={ENT_HEIGHT}
    />
  )
}
