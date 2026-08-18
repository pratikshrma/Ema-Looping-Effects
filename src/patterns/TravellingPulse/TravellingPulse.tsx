import { types as t } from '@theatre/core'
import { useCurrentSheet } from '@theatre/r3f'
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { useTime } from '../../lib/loop'

const MAX_FINS = 1200
const dummy = new Object3D()

const DEFAULTS = {
  count: 264,
  twist: 5.6,
  rise: 0.02,
  radius: 1.69,
  width: 12,
  twistBoost: 60,
  radialBoost: 1.2,
  finWidth: 0.53,
  finHeight: 0.02,
  finDepth: 0.001,
  speed: 0.071,
}

const FIN_DEFAULTS = {
  finWidth: DEFAULTS.finWidth,
  finHeight: DEFAULTS.finHeight,
  finDepth: DEFAULTS.finDepth,
}

export default function TravellingPulse() {
  const mesh = useRef<InstancedMesh>(null)

  const sheet = useCurrentSheet()
  const params = useRef(DEFAULTS)
  const [fin, setFin] = useState(FIN_DEFAULTS)

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('TravellingPulse / Properties', {
      count: t.number(DEFAULTS.count, { range: [2, MAX_FINS], nudgeMultiplier: 1 }),
      twist: t.number(DEFAULTS.twist, { range: [0.1, 180], nudgeMultiplier: 0.1 }),
      rise: t.number(DEFAULTS.rise, { range: [-0.6, 0.6], nudgeMultiplier: 0.001 }),
      radius: t.number(DEFAULTS.radius, { range: [0, 8], nudgeMultiplier: 0.01 }),
      width: t.number(DEFAULTS.width, { range: [1, 80], nudgeMultiplier: 0.5 }),
      twistBoost: t.number(DEFAULTS.twistBoost, { range: [-180, 180], nudgeMultiplier: 1 }),
      radialBoost: t.number(DEFAULTS.radialBoost, { range: [-4, 4], nudgeMultiplier: 0.01 }),
      finWidth: t.number(DEFAULTS.finWidth, { range: [0.02, 10], nudgeMultiplier: 0.01 }),
      finHeight: t.number(DEFAULTS.finHeight, { range: [0.005, 10], nudgeMultiplier: 0.005 }),
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
    const twist = MathUtils.degToRad(p.twist)
    const twistBoost = MathUtils.degToRad(p.twistBoost)
    const count = Math.min(Math.floor(p.count), MAX_FINS)
    m.count = count

    const head = t * count
    const yOffset = -(p.rise * (count - 1)) / 2
    const denom = 2 * p.width * p.width

    for (let i = 0; i < count; i++) {
      let d = i - head
      d = ((d % count) + count) % count
      if (d > count / 2) d -= count

      const bump = Math.exp(-(d * d) / denom)

      const angle = i * twist + bump * twistBoost
      const radius = p.radius + bump * p.radialBoost

      dummy.position.set(
        Math.cos(angle) * radius,
        yOffset + p.rise * i,
        Math.sin(angle) * radius,
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
