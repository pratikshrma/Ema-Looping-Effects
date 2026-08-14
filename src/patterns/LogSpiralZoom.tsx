import { useControls } from 'leva'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { useTime } from '../lib/loop'

const MAX_FINS = 1200
const dummy = new Object3D()

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const v = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return v * v * (3 - 2 * v)
}

export default function LogSpiralZoom() {
  const mesh = useRef<InstancedMesh>(null)

  const p = useControls('logSpiralZoom', {
    count: { value: 71, min: 8, max: MAX_FINS, step: 1 },
    twist: { value: 12.5, min: 0.1, max: 90, step: 0.1 },
    growth: { value: 1, min: 1, max: 1.2, step: 0.001 },
    radius0: { value: 0.79, min: 0.01, max: 2, step: 0.01 },
    rise: { value: 0.06, min: -0.1, max: 0.1, step: 0.001 },
    fade: { value: 25, min: 1, max: 60, step: 1 },
    finWidth: { value: 0.33, min: 0.02, max: 4, step: 0.01 },
    finHeight: { value: 0.28, min: 0.02, max: 4, step: 0.01 },
    finDepth: { value: 0.11, min: 0.001, max: 0.5, step: 0.001 },
    speed: { value: 0.2, min: 0, max: 2, step: 0.001 },
  })

  const advance = useTime()

  useFrame((_state, delta) => {
    const m = mesh.current
    if (!m) return

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
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_FINS]} frustumCulled={false}>
      <boxGeometry args={[p.finWidth, p.finHeight, p.finDepth]} />
      <meshNormalMaterial flatShading />
    </instancedMesh>
  )
}
