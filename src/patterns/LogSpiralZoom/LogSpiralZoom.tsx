import { types as t } from '@theatre/core'
import { useCurrentSheet } from '@theatre/r3f'
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { useTime } from '../../lib/loop'

const MAX_FINS = 1200
const dummy = new Object3D()

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const v = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return v * v * (3 - 2 * v)
}

const DEFAULTS = {
  count: 71,
  twist: 12.5,
  growth: 1,
  radius0: 0.79,
  rise: 0.06,
  fade: 25,
  finWidth: 0.33,
  finHeight: 0.28,
  finDepth: 0.11,
  speed: 0.2,
}

const FIN_DEFAULTS = {
  finWidth: DEFAULTS.finWidth,
  finHeight: DEFAULTS.finHeight,
  finDepth: DEFAULTS.finDepth,
}

export default function LogSpiralZoom() {
  const mesh = useRef<InstancedMesh>(null)

  const sheet = useCurrentSheet()
  const params = useRef(DEFAULTS)
  const [fin, setFin] = useState(FIN_DEFAULTS)

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('LogSpiralZoom / Properties', {
      count: t.number(DEFAULTS.count, { range: [8, MAX_FINS], nudgeMultiplier: 1 }),
      twist: t.number(DEFAULTS.twist, { range: [0.1, 90], nudgeMultiplier: 0.1 }),
      growth: t.number(DEFAULTS.growth, { range: [1, 1.2], nudgeMultiplier: 0.001 }),
      radius0: t.number(DEFAULTS.radius0, { range: [0.01, 2], nudgeMultiplier: 0.01 }),
      rise: t.number(DEFAULTS.rise, { range: [-0.1, 0.1], nudgeMultiplier: 0.001 }),
      fade: t.number(DEFAULTS.fade, { range: [1, 60], nudgeMultiplier: 1 }),
      finWidth: t.number(DEFAULTS.finWidth, { range: [0.02, 4], nudgeMultiplier: 0.01 }),
      finHeight: t.number(DEFAULTS.finHeight, { range: [0.02, 4], nudgeMultiplier: 0.01 }),
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
    const count = Math.min(Math.floor(p.count), MAX_FINS)
    m.count = count

    for (let i = 0; i < count; i++) {
      const e = (i + t) % count

      const angle = e * twist
      const growth = Math.pow(p.growth, e)
      const radius = p.radius0 * growth

      const fade =
        smoothstep(0, p.fade, e) * smoothstep(count, count - p.fade, e)

      dummy.position.set(Math.cos(angle) * radius, p.rise * e, Math.sin(angle) * radius)
      dummy.rotation.set(0, -angle, 0)
      dummy.scale.setScalar(growth * fade)
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
