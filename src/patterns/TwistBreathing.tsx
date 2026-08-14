import { useControls } from 'leva'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { TAU, useTime } from '../lib/loop'

const MAX_FINS = 1200
const dummy = new Object3D()

export default function TwistBreathing() {
  const mesh = useRef<InstancedMesh>(null)

  const p = useControls('twistBreathing', {
    count: { value: 182, min: 8, max: MAX_FINS, step: 1 },
    twist: { value: 39, min: 0, max: 60, step: 0.01 },
    amplitude: { value: 1.2, min: 0, max: 30, step: 0.01 },
    rise: { value: 0.1, min: -0.2, max: 0.2, step: 0.001 },
    radius: { value: 3.15, min: 0, max: 8, step: 0.01 },
    finWidth: { value: 1.02, min: 0.02, max: 12, step: 0.01 },
    finHeight: { value: 0.81, min: 0.02, max: 12, step: 0.01 },
    finDepth: { value: 0.001, min: 0.001, max: 0.5, step: 0.001 },
    speed: { value: 0.033, min: 0, max: 2, step: 0.001 },
  })

  const advance = useTime()

  useFrame((_state, delta) => {
    const m = mesh.current
    if (!m) return

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
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_FINS]} frustumCulled={false}>
      <boxGeometry args={[p.finWidth, p.finHeight, p.finDepth]} />
      <meshNormalMaterial flatShading />
    </instancedMesh>
  )
}
