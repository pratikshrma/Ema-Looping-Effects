import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { Dither } from '../postprocessing/Dither'
import { patterns } from '../patterns/registry'
import { loopState, setLoopSpeed } from '../lib/loop'

function CameraPreset({ position }: { position: [number, number, number] }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)

  useEffect(() => {
    camera.position.set(position[0], position[1], position[2])
    const orbit = controls as {
      target?: { set: (x: number, y: number, z: number) => void }
      update?: () => void
    }
    if (orbit?.target) {
      orbit.target.set(0, 0, 0)
      orbit.update?.()
    }
  }, [camera, controls, position])

  return null
}

function LoopTick({ barRef }: { barRef: RefObject<HTMLDivElement | null> }) {
  useFrame(() => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${loopState.phase})`
  })
  return null
}

const Experience = () => {
  const barRef = useRef<HTMLDivElement>(null)

  const ui = useControls('scene', {
    pattern: {
      value: patterns[0].id,
      options: patterns.map((entry) => entry.id),
    },
    speed: { value: 1.0, min: 0.05, max: 25, step: 0.05 },
    background: { value: '#101010' },
    tick: { value: true, label: 'loop marker' },
  })

  useEffect(() => {
    setLoopSpeed(ui.speed)
  }, [ui.speed])

  const entry = patterns.find((item) => item.id === ui.pattern) ?? patterns[0]
  const Pattern = entry.Component

  return (
    <>
      <Canvas
        gl={{ antialias: false }}
        dpr={1}
        camera={{ position: entry.defaultCamera, fov: 45 }}
      >
        <color attach="background" args={[ui.background]} />
        <OrbitControls makeDefault />
        <CameraPreset position={entry.defaultCamera} />

        <Pattern />
        <LoopTick barRef={barRef} />

        <EffectComposer>
          <Dither />
        </EffectComposer>
      </Canvas>

      {ui.tick && (
        <div className="loop-tick">
          <div ref={barRef} className="loop-tick__bar" />
        </div>
      )}
    </>
  )
}

export default Experience
