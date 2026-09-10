import { OrthographicCamera, useCurrentSheet } from '@theatre/r3f'
import { types as t } from '@theatre/core'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { PatternCamera } from '../registry'

const POSITION: [number, number, number] = [0, 0, 1]
const ZOOM = 294

export default function OffsetWavesCamera({ ref: cameraRef }: { ref: React.RefObject<PatternCamera | null> }) {
  const sheet = useCurrentSheet()

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OffsetWaves / Camera / Zoom', {
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
      theatreKey="OffsetWaves / Camera / Transformation"
      ref={cameraRef}
      makeDefault={false}
      position={POSITION}
    />
  )
}
