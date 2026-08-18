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
  count: 400,
  baseAngle: 137.507,
  amplitude: 1.2,
  radiusScale: 0.32,
  rise: 0,
  finWidth: 0.02,
  finHeight: 2.01,
  finDepth: 0.127,
  facing: 150,
  speed: 0.064,
}

const FIN_DEFAULTS = {
  finWidth: DEFAULTS.finWidth,
  finHeight: DEFAULTS.finHeight,
  finDepth: DEFAULTS.finDepth,
}

export default function Phyllotaxis() {
  const mesh = useRef<InstancedMesh>(null)

  const sheet = useCurrentSheet()
  const params = useRef(DEFAULTS)
  const [fin, setFin] = useState(FIN_DEFAULTS)

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('Phyllotaxis / Properties', {
      count: t.number(DEFAULTS.count, { range: [8, MAX_FINS], nudgeMultiplier: 1 }),
      baseAngle: t.number(DEFAULTS.baseAngle, { range: [0, 180], nudgeMultiplier: 0.001 }),
      amplitude: t.number(DEFAULTS.amplitude, { range: [0, 20], nudgeMultiplier: 0.01 }),
      radiusScale: t.number(DEFAULTS.radiusScale, { range: [0.01, 1.5], nudgeMultiplier: 0.01 }),
      rise: t.number(DEFAULTS.rise, { range: [-0.05, 0.05], nudgeMultiplier: 0.0005 }),
      finWidth: t.number(DEFAULTS.finWidth, { range: [0.005, 4], nudgeMultiplier: 0.005 }),
      finHeight: t.number(DEFAULTS.finHeight, { range: [0.02, 6], nudgeMultiplier: 0.01 }),
      finDepth: t.number(DEFAULTS.finDepth, { range: [0.001, 0.5], nudgeMultiplier: 0.001 }),
      facing: t.number(DEFAULTS.facing, { range: [-180, 180], nudgeMultiplier: 1 }),
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
    <>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, MAX_FINS]}
        frustumCulled={false}
      >
        <boxGeometry args={[fin.finWidth, fin.finHeight, fin.finDepth]} />
        <meshNormalMaterial flatShading />
      </instancedMesh>
    </>
  )
}
