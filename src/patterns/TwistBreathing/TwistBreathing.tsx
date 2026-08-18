import { types as t } from '@theatre/core'
import { useCurrentSheet } from '@theatre/r3f'
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { TAU, useTime } from '../../lib/loop'

const MAX_FINS = 1200
const dummy = new Object3D()

const DEFAULTS = {
  count: 182,
  twist: 39,
  amplitude: 1.2,
  rise: 0.1,
  radius: 3.15,
  finWidth: 1.02,
  finHeight: 0.81,
  finDepth: 0.001,
  speed: 0.033,
}

const FIN_DEFAULTS = {
  finWidth: DEFAULTS.finWidth,
  finHeight: DEFAULTS.finHeight,
  finDepth: DEFAULTS.finDepth,
}

export default function TwistBreathing() {
  const mesh = useRef<InstancedMesh>(null)

  const sheet = useCurrentSheet()
  const params = useRef(DEFAULTS)
  const [fin, setFin] = useState(FIN_DEFAULTS)

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('TwistBreathing / Properties', {
      count: t.number(DEFAULTS.count, { range: [8, MAX_FINS], nudgeMultiplier: 1 }),
      twist: t.number(DEFAULTS.twist, { range: [0, 60], nudgeMultiplier: 0.01 }),
      amplitude: t.number(DEFAULTS.amplitude, { range: [0, 30], nudgeMultiplier: 0.01 }),
      rise: t.number(DEFAULTS.rise, { range: [-0.2, 0.2], nudgeMultiplier: 0.001 }),
      radius: t.number(DEFAULTS.radius, { range: [0, 8], nudgeMultiplier: 0.01 }),
      finWidth: t.number(DEFAULTS.finWidth, { range: [0.02, 12], nudgeMultiplier: 0.01 }),
      finHeight: t.number(DEFAULTS.finHeight, { range: [0.02, 12], nudgeMultiplier: 0.01 }),
      finDepth: t.number(DEFAULTS.finDepth, { range: [0.001, 0.5], nudgeMultiplier: 0.001 }),
      speed: t.number(DEFAULTS.speed, { range: [0, 2], nudgeMultiplier: 0.001 }),
    }, { reconfigure: true })

    return obj.onValuesChange((v) => {
      params.current = v
      setFin((prev) =>
        prev.finWidth === v.finWidth && prev.finHeight === v.finHeight && prev.finDepth === v.finDepth
          ? prev
          : { finWidth: v.finWidth, finHeight: v.finHeight, finDepth: v.finDepth })
    })
  }, [sheet])

  const advance = useTime()

  useFrame((_state, delta) => {
    const m = mesh.current
    if (!m) return

    const p = params.current

    const t = advance(delta, p.speed)
    const twist = MathUtils.degToRad(p.twist + p.amplitude * Math.sin(TAU * t))
    const count = Math.min(Math.floor(p.count), MAX_FINS)
    m.count = count

    const yOffset = -(p.rise * (count - 1)) / 2

    for (let i = 0; i < count; i++) {
      const angle = i * twist
      dummy.position.set(
        Math.cos(angle) * p.radius,
        yOffset + p.rise * i,
        Math.sin(angle) * p.radius,
      )
      dummy.rotation.set(0, -angle, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }

    m.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, MAX_FINS]} frustumCulled={false}>
        <boxGeometry args={[fin.finWidth, fin.finHeight, fin.finDepth]} />
        <meshNormalMaterial flatShading />
      </instancedMesh>
    </>
  )
}
