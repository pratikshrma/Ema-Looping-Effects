import type { ComponentType } from 'react'
import Phyllotaxis from './Phyllotaxis'
import TravellingPulse from './TravellingPulse'
import LogSpiralZoom from './LogSpiralZoom'
import BentSpine from './BentSpine'
import TwistBreathing from './TwistBreathing'
import TravellingWave from './TravellingWave'
import OpenCylinder from './OpenCylinder'
import Coil from './RightCoil'

export type PatternEntry = {
  id: string
  Component: ComponentType
  defaultCamera: [number, number, number]
  defaultTarget?: [number, number, number]
}

export const patterns: PatternEntry[] = [
  { id: 'horizontalCoil', Component: Coil, defaultCamera: [-7.6, 0.4, 8.8], defaultTarget: [0, 0, 0] },
  { id: 'openCylinder', Component: OpenCylinder, defaultCamera: [14.53, -6.19, 5.79], defaultTarget: [0.76, 1.68, 0.51] },
  { id: 'phyllotaxis', Component: Phyllotaxis, defaultCamera: [0, 9, 16], defaultTarget: [0, 0, 0] },
  { id: 'travellingPulse', Component: TravellingPulse, defaultCamera: [0, 4, 14], defaultTarget: [0, 0, 0] },
  { id: 'logSpiralZoom', Component: LogSpiralZoom, defaultCamera: [9.09, 2.31, 16.04], defaultTarget: [0.12, 2.16, -0.09] },
  { id: 'bentSpine', Component: BentSpine, defaultCamera: [10.96, 7.41, 33.01], defaultTarget: [0, 0, 0] },
  { id: 'twistBreathing', Component: TwistBreathing, defaultCamera: [0.00, 6.85, 47.95], defaultTarget: [0, 0, 0] },
  { id: 'travellingWave', Component: TravellingWave, defaultCamera: [0.00, 13.28, 61.96], defaultTarget: [0, 0, 0] },
]

