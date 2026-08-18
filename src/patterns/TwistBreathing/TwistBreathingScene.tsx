import { editable as e, useCurrentSheet } from '@theatre/r3f'
import { types as t } from '@theatre/core'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import TwistBreathing from './TwistBreathing'
import TwistBreathingCamera from './TwistBreathingCamera'
import type { PatternCamera } from '../registry'

const COLOR = '#68AA6A'

const toRgba = (hex: string) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace).convertLinearToSRGB()
  return { r: c.r, g: c.g, b: c.b, a: 1 }
}

const TwistBreathingScene = ({ cameraRef }: { cameraRef: React.RefObject<PatternCamera | null> }) => {
  const scene = useThree((s) => s.scene)
  const sheet = useCurrentSheet()

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('TwistBreathing / Background', {
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
      <TwistBreathingCamera ref={cameraRef} />
      <e.group theatreKey="TwistBreathing / Model">
        <TwistBreathing />
      </e.group>
    </>
  )
}

export default TwistBreathingScene
