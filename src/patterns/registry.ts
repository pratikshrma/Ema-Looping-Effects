import type { ComponentType } from 'react'
import Phyllotaxis from './Phyllotaxis'
import TravellingPulse from './TravellingPulse'
import LogSpiralZoom from './LogSpiralZoom'
import BentSpine from './BentSpine'
import TwistBreathing from './TwistBreathing'
import TravellingWave from './TravellingWave'
import OpenCylinder from './OpenCylinder'

export type PatternEntry = {
  id: string
  Component: ComponentType
  defaultCamera: [number, number, number]
}

export const patterns: PatternEntry[] = [
  { id: 'openCylinder', Component: OpenCylinder, defaultCamera: [0, 0, 14] },
  { id: 'phyllotaxis', Component: Phyllotaxis, defaultCamera: [0, 9, 16] },
  { id: 'travellingPulse', Component: TravellingPulse, defaultCamera: [0, 4, 14] },
  { id: 'logSpiralZoom', Component: LogSpiralZoom, defaultCamera: [0, 0, 9] },
  { id: 'bentSpine', Component: BentSpine, defaultCamera: [0, 7, 14] },
  { id: 'twistBreathing', Component: TwistBreathing, defaultCamera: [0, 2, 14] },
  { id: 'travellingWave', Component: TravellingWave, defaultCamera: [0, 3, 14] },
]
