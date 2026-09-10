import { editable as e, useCurrentSheet } from '@theatre/r3f'
import { types as t } from '@theatre/core'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import OffsetWaves3D from './OffsetWaves3D'
import OffsetWaves3DCamera from './OffsetWaves3DCamera'
import type { PatternCamera } from '../registry'

const COLOR = '#387239'

const toRgba = (hex: string) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace).convertLinearToSRGB()
  return { r: c.r, g: c.g, b: c.b, a: 1 }
}

const OffsetWaves3DScene = ({ cameraRef }: { cameraRef: React.RefObject<PatternCamera | null> }) => {
  const scene = useThree((s) => s.scene)
  const sheet = useCurrentSheet()

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OffsetWaves3D / Background', {
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
      <OffsetWaves3DCamera ref={cameraRef} />
      <e.group theatreKey="OffsetWaves3D / Model">
        <OffsetWaves3D />
      </e.group>
    </>
  )
}

export default OffsetWaves3DScene
