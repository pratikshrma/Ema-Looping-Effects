import { useControls } from 'leva'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { TAU, useTime } from '../lib/loop'

const MAX_FINS = 1200
const dummy = new Object3D()

export default function BentSpine() {
  const mesh = useRef<InstancedMesh>(null)

  const p = useControls('bentSpine', {
    count: { value: 591, min: 2, max: MAX_FINS, step: 1 },
    pathRadius: { value: 7.03, min: 0.5, max: 12, step: 0.01 },
    amplitude: { value: 1.2, min: 0, max: 8, step: 0.01 },
    lobes: { value: 4, min: 1, max: 12, step: 1 },
    twist: { value: 7, min: 0, max: 180, step: 0.1 },
    finWidth: { value: 0.02, min: 0.005, max: 8, step: 0.005 },
    finHeight: { value: 0.66, min: 0.02, max: 8, step: 0.01 },
    finDepth: { value: 0.02, min: 0.001, max: 0.5, step: 0.001 },
    speed: { value: 3.0, min: 0, max: 10, step: 0.001 },
  })

  const advance = useTime()

  useFrame((_state, delta) => {
    const m = mesh.current
    if (!m) return

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
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_FINS]} frustumCulled={false}>
      <boxGeometry args={[p.finWidth, p.finHeight, p.finDepth]} />
      <meshNormalMaterial flatShading />
    </instancedMesh>
  )
}
