'use client'

import RemotionPlayer from './RemotionPlayer'
import { SM_DURATION, SM_FPS, SM_HEIGHT, SM_WIDTH } from './standardModelConstants'

const load = () => import('./StandardModelComposition')

export default function StandardModelAnimation() {
  return (
    <RemotionPlayer
      title="The Standard Model, built from the bottom up"
      caption="Watch the parts list assemble the way matter does: quarks make a proton, protons and electrons make an atom (that is you), then the full roster fades in. Column one builds everything you are; columns two and three are heavier copies you never use; the four tiles on the right carry the forces. Scrub the timeline to step through it."
      load={load}
      durationInFrames={SM_DURATION}
      fps={SM_FPS}
      width={SM_WIDTH}
      height={SM_HEIGHT}
    />
  )
}
