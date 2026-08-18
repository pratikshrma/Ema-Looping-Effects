import * as THREE from 'three'
import { useRef } from 'react'
import { PerspectiveCamera } from '@react-three/drei'
import { editable as e } from '@theatre/r3f'
import type { PatternCamera } from '../registry'

export default function TravellingPulseCamera({ ref: cameraRef }: { ref: React.RefObject<PatternCamera | null> }) {
  const group = useRef<THREE.Group | null>(null)

  return (
    <e.group theatreKey='TravellingPulse / Camera / Transformation' ref={group}>
      <group name="Scene">
        <PerspectiveCamera
          ref={cameraRef as React.RefObject<THREE.PerspectiveCamera | null>}
          name="Camera"
          makeDefault={false}
          far={1000}
          near={0.1}
        />
      </group>
    </e.group>
  )
}
