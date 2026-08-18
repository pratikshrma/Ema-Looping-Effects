import { editable as e, useCurrentSheet } from '@theatre/r3f'
import { types as t } from '@theatre/core'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import OpenCylinder from './OpenCylinder'
import OpenCylinderCamera from './OpenCylinderCamera'
import type { PatternCamera } from '../registry'

const COLOR = '#68AA6A'

const toRgba = (hex: string) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace).convertLinearToSRGB()
  return { r: c.r, g: c.g, b: c.b, a: 1 }
}

const OpenCylinderScene = ({ cameraRef }: { cameraRef: React.RefObject<PatternCamera | null> }) => {
  const scene = useThree((s) => s.scene)
  const sheet = useCurrentSheet()

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OpenCylinder / Background', {
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
      <OpenCylinderCamera ref={cameraRef} />
      <e.group theatreKey="OpenCylinder / Model">
        <OpenCylinder />
      </e.group>
    </>
  )
}

export default OpenCylinderScene
