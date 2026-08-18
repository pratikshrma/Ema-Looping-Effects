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
  count: 591,
  pathRadius: 7.03,
  amplitude: 1.2,
  lobes: 4,
  twist: 7,
  finWidth: 0.02,
  finHeight: 0.66,
  finDepth: 0.02,
  speed: 3.0,
}

const FIN_DEFAULTS = {
  finWidth: DEFAULTS.finWidth,
  finHeight: DEFAULTS.finHeight,
  finDepth: DEFAULTS.finDepth,
}

export default function BentSpine() {
  const mesh = useRef<InstancedMesh>(null)

  const sheet = useCurrentSheet()
  const params = useRef(DEFAULTS)
  const [fin, setFin] = useState(FIN_DEFAULTS)

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('BentSpine / Properties', {
      count: t.number(DEFAULTS.count, { range: [2, MAX_FINS], nudgeMultiplier: 1 }),
      pathRadius: t.number(DEFAULTS.pathRadius, { range: [0.5, 12], nudgeMultiplier: 0.01 }),
      amplitude: t.number(DEFAULTS.amplitude, { range: [0, 8], nudgeMultiplier: 0.01 }),
      lobes: t.number(DEFAULTS.lobes, { range: [1, 12], nudgeMultiplier: 1 }),
      twist: t.number(DEFAULTS.twist, { range: [0, 180], nudgeMultiplier: 0.1 }),
      finWidth: t.number(DEFAULTS.finWidth, { range: [0.005, 8], nudgeMultiplier: 0.005 }),
      finHeight: t.number(DEFAULTS.finHeight, { range: [0.02, 8], nudgeMultiplier: 0.01 }),
      finDepth: t.number(DEFAULTS.finDepth, { range: [0.001, 0.5], nudgeMultiplier: 0.001 }),
      speed: t.number(DEFAULTS.speed, { range: [0, 10], nudgeMultiplier: 0.001 }),
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
    const lobes = Math.floor(p.lobes)
    const count = Math.min(Math.floor(p.count), MAX_FINS)
    m.count = count

    dummy.rotation.order = 'YXZ'

    for (let i = 0; i < count; i++) {
      const e = (i + t) % count
      const u = e / count
      const theta = TAU * u

      dummy.position.set(
        Math.cos(theta) * p.pathRadius,
        Math.sin(theta * lobes) * p.amplitude,
        Math.sin(theta) * p.pathRadius,
      )
      dummy.rotation.set(0, -theta, e * twist)
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
