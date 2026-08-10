import { useControls } from 'leva'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { TAU, advanceLoop } from '../lib/loop'

const MAX_FINS = 1200
const dummy = new Object3D()

export default function TravellingWave() {
  const mesh = useRef<InstancedMesh>(null)

  const p = useControls('travellingWave', {
    count: { value: 361, min: 8, max: MAX_FINS, step: 1 },
    twist: { value: 10.4, min: 0, max: 60, step: 0.1 },
    waves: { value: 2, min: 1, max: 24, step: 1 },
    amplitude: { value: 1.2, min: 0, max: 180, step: 0.5 },
    riseAmplitude: { value: 1.3, min: 0, max: 3, step: 0.01 },
    rise: { value: 0.1, min: -0.2, max: 0.2, step: 0.001 },
    radius: { value: 1.62, min: 0, max: 8, step: 0.01 },
    finWidth: { value: 1.02, min: 0.02, max: 10, step: 0.01 },
    finHeight: { value: 0.53, min: 0.02, max: 10, step: 0.01 },
    finDepth: { value: 0.074, min: 0.001, max: 0.5, step: 0.001 },
    loopSeconds: { value: 14, min: 0.15, max: 30, step: 0.05 },
  })

  useFrame((_state, delta) => {
    const m = mesh.current
    if (!m) return

    const t = advanceLoop(delta, p.loopSeconds)
    const twist = MathUtils.degToRad(p.twist)
    const amplitude = MathUtils.degToRad(p.amplitude)
    const waves = Math.floor(p.waves)
    const count = Math.min(Math.floor(p.count), MAX_FINS)
    m.count = count

    const yOffset = -(p.rise * (count - 1)) / 2

    for (let i = 0; i < count; i++) {
      const phase = (TAU * waves * i) / count + TAU * t
      const wave = Math.sin(phase)

      const angle = i * twist + amplitude * wave

      dummy.position.set(
        Math.cos(angle) * p.radius,
        yOffset + p.rise * i + p.riseAmplitude * wave,
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
