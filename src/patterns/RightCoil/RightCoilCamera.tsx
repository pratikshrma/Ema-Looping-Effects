import { OrthographicCamera, useCurrentSheet } from '@theatre/r3f'
import { types as t } from '@theatre/core'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { PatternCamera } from '../registry'

// Kept off-axis for the coil's 3/4 read; the rotation is the look-at-origin
// euler for this position, hardcoded.
const POSITION: [number, number, number] = [-7.6, 0.4, 8.8]
const ROTATION: [number, number, number] = [-0.0454, -0.7118, -0.0297]
const ZOOM = 294

export default function RightCoilCamera({ ref: cameraRef }: { ref: React.RefObject<PatternCamera | null> }) {
  const sheet = useCurrentSheet()

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('RightCoil / Camera / Zoom', {
      zoom: t.number(ZOOM, { range: [1, 600], nudgeMultiplier: 1 }),
    }, { reconfigure: true })

    return obj.onValuesChange((v) => {
      const cam = cameraRef.current
      if (!(cam instanceof THREE.OrthographicCamera)) return
      cam.zoom = v.zoom
      cam.updateProjectionMatrix()
    })
  }, [sheet, cameraRef])

  return (
    <OrthographicCamera
      theatreKey="RightCoil / Camera / Transformation"
      ref={cameraRef}
      makeDefault={false}
      position={POSITION}
      rotation={ROTATION}
    />
  )
}
