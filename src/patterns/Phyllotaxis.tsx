import { useControls } from 'leva'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { TAU, useTime } from '../lib/loop'

const MAX_FINS = 1200

const dummy = new Object3D()

export default function Phyllotaxis() {
  const mesh = useRef<InstancedMesh>(null)

  const p = useControls('phyllotaxis', {
    count: { value: 400, min: 8, max: MAX_FINS, step: 1 },
    baseAngle: { value: 137.507, min: 0, max: 180, step: 0.001 },
    amplitude: { value: 1.2, min: 0, max: 20, step: 0.01 },
    radiusScale: { value: 0.32, min: 0.01, max: 1.5, step: 0.01 },
    rise: { value: 0, min: -0.05, max: 0.05, step: 0.0005 },
    finWidth: { value: 0.02, min: 0.005, max: 4, step: 0.005 },
    finHeight: { value: 2.01, min: 0.02, max: 6, step: 0.01 },
    finDepth: { value: 0.127, min: 0.001, max: 0.5, step: 0.001 },
    facing: { value: 150, min: -180, max: 180, step: 1 },
    speed: { value: 0.064, min: 0, max: 2, step: 0.001 },
  })

  const advance = useTime()

  useFrame((_state, delta) => {
    const m = mesh.current
    if (!m) return

    const t = advance(delta, p.speed)

    const divergence = MathUtils.degToRad(p.baseAngle + p.amplitude * Math.sin(TAU * t))
    const facing = MathUtils.degToRad(p.facing)

    const count = Math.min(Math.floor(p.count), MAX_FINS)
    m.count = count

    const yOffset = -(p.rise * (count - 1)) / 2

    for (let i = 0; i < count; i++) {
      const angle = i * divergence
      const radius = p.radiusScale * Math.sqrt(i)

      dummy.position.set(
        Math.cos(angle) * radius,
        yOffset + p.rise * i,
        Math.sin(angle) * radius,
      )
      dummy.rotation.set(0, -angle + facing, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }

    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, MAX_FINS]}
      frustumCulled={false}
    >
      <boxGeometry args={[p.finWidth, p.finHeight, p.finDepth]} />
      <meshNormalMaterial flatShading />
    </instancedMesh>
  )
}
