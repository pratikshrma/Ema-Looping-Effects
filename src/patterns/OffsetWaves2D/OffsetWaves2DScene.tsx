import { editable as e, useCurrentSheet } from '@theatre/r3f'
import { types as t } from '@theatre/core'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import OffsetWaves2D from './OffsetWaves2D'
import OffsetWaves2DCamera from './OffsetWaves2DCamera'
import type { PatternCamera } from '../registry'

const COLOR = '#387239'

const toRgba = (hex: string) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace).convertLinearToSRGB()
  return { r: c.r, g: c.g, b: c.b, a: 1 }
}

const OffsetWaves2DScene = ({ cameraRef }: { cameraRef: React.RefObject<PatternCamera | null> }) => {
  const scene = useThree((s) => s.scene)
  const sheet = useCurrentSheet()

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OffsetWaves2D / Background', {
      color: t.rgba(toRgba(COLOR)),
    }, { reconfigure: true })

    const background = new THREE.Color()
    scene.background = background

    const unsubscribe = obj.onValuesChange((v) => {
      background.setRGB(v.color.r, v.color.g, v.color.b, THREE.SRGBColorSpace)
    })

    return () => {
      unsubscribe()
      scene.background = null
    }
  }, [sheet, scene])

  return (
    <>
      <OffsetWaves2DCamera ref={cameraRef} />
      <e.group theatreKey="OffsetWaves2D / Model">
        <OffsetWaves2D />
      </e.group>
    </>
  )
}

export default OffsetWaves2DScene
