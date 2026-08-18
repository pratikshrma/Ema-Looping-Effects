import type { ComponentType, RefObject } from 'react'
import type { OrthographicCamera, PerspectiveCamera } from 'three'

export type PatternCamera = PerspectiveCamera | OrthographicCamera

import RightCoilScene from './RightCoil/RightCoilScene'
import OpenCylinderScene from './OpenCylinder/OpenCylinderScene'
import PhyllotaxisScene from './Phyllotaxis/PhyllotaxisScene'
import TravellingPulseScene from './TravellingPulse/TravellingPulseScene'
import LogSpiralZoomScene from './LogSpiralZoom/LogSpiralZoomScene'
import BentSpineScene from './BentSpine/BentSpineScene'
import TwistBreathingScene from './TwistBreathing/TwistBreathingScene'
import TravellingWaveScene from './TravellingWave/TravellingWaveScene'

export type SceneProps = {
  cameraRef: RefObject<PatternCamera | null>
}

export type PatternEntry = {
  id: string
  Component: ComponentType<SceneProps>
}

export const patterns: PatternEntry[] = [
  { id: 'RightCoil', Component: RightCoilScene },
  { id: 'OpenCylinder', Component: OpenCylinderScene },
  { id: 'Phyllotaxis', Component: PhyllotaxisScene },
  { id: 'TravellingPulse', Component: TravellingPulseScene },
  { id: 'LogSpiralZoom', Component: LogSpiralZoomScene },
  { id: 'BentSpine', Component: BentSpineScene },
  { id: 'TwistBreathing', Component: TwistBreathingScene },
  { id: 'TravellingWave', Component: TravellingWaveScene },
]
