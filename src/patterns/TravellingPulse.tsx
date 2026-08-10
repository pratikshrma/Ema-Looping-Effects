import { useControls } from 'leva'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { advanceLoop } from '../lib/loop'

const MAX_FINS = 1200
const dummy = new Object3D()

export default function TravellingPulse() {
  const mesh = useRef<InstancedMesh>(null)

  const p = useControls('travellingPulse', {
    count: { value: 719, min: 2, max: MAX_FINS, step: 1 },
    twist: { value: 5.6, min: 0.1, max: 180, step: 0.1 },
    rise: { value: 0.02, min: -0.6, max: 0.6, step: 0.001 },
    radius: { value: 1.69, min: 0, max: 8, step: 0.01 },
    width: { value: 12, min: 1, max: 80, step: 0.5 },
    twistBoost: { value: 60, min: -180, max: 180, step: 1 },
    radialBoost: { value: 1.2, min: -4, max: 4, step: 0.01 },
    finWidth: { value: 0.53, min: 0.02, max: 10, step: 0.01 },
    finHeight: { value: 0.02, min: 0.005, max: 10, step: 0.005 },
    finDepth: { value: 0.001, min: 0.001, max: 0.5, step: 0.001 },
    loopSeconds: { value: 14, min: 0.15, max: 30, step: 0.05 },
  })

  useFrame((_state, delta) => {
    const m = mesh.current
    if (!m) return

    const t = advanceLoop(delta, p.loopSeconds)
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
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_FINS]} frustumCulled={false}>
      <boxGeometry args={[p.finWidth, p.finHeight, p.finDepth]} />
      <meshNormalMaterial flatShading />
    </instancedMesh>
  )
}
