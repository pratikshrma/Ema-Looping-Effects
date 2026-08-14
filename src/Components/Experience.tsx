import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { button, useControls } from 'leva'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { Camera } from 'three'
import { Dither } from '../postprocessing/Dither'
import { patterns } from '../patterns/registry'

type OrbitLike = {
  target?: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void }
  update?: () => void
}

type View = { camera: Camera; controls: OrbitLike | null }

function CameraPreset({
  position,
  target,
}: {
  position: [number, number, number]
  target?: [number, number, number]
}) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)

  useEffect(() => {
    camera.position.set(position[0], position[1], position[2])
    const orbit = controls as OrbitLike | null
    if (orbit?.target) {
      orbit.target.set(target?.[0] ?? 0, target?.[1] ?? 0, target?.[2] ?? 0)
      orbit.update?.()
    }
  }, [camera, controls, position, target])

  return null
}

function CameraProbe({ viewRef }: { viewRef: RefObject<View | null> }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)

  useEffect(() => {
    viewRef.current = { camera, controls: (controls as OrbitLike | null) ?? null }
    return () => {
      viewRef.current = null
    }
  }, [camera, controls, viewRef])

  return null
}

const Experience = () => {
  const viewRef = useRef<View | null>(null)

  const ui = useControls('scene', {
    pattern: {
      value: patterns[0].id,
      options: patterns.map((entry) => entry.id),
    },
    background: { value: '#101010' },
  })

  useControls('scene', {
    'log camera': button(() => {
      const view = viewRef.current
      if (!view) return

      const t = view.controls?.target
      const tuple = (x: number, y: number, z: number) =>
        `[${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}]`

      const p = view.camera.position
      const text = [
        `defaultCamera: ${tuple(p.x, p.y, p.z)},`,
        `defaultTarget: ${tuple(t?.x ?? 0, t?.y ?? 0, t?.z ?? 0)},`,
      ].join('\n')

      navigator.clipboard?.writeText(text).catch(() => { })
      alert(text)
    }),
  })

  const entry = patterns.find((item) => item.id === ui.pattern) ?? patterns[0]
  const Pattern = entry.Component

  return (
    <>
      <Canvas
        gl={{ antialias: false }}
        dpr={1}
        camera={{ position: entry.defaultCamera, fov: 15 }}
      >
        <color attach="background" args={[ui.background]} />
        <OrbitControls makeDefault />
        <CameraPreset position={entry.defaultCamera} target={entry.defaultTarget} />
        <CameraProbe viewRef={viewRef} />

        <Pattern />

        <EffectComposer>
          <Dither />
        </EffectComposer>
      </Canvas>
    </>
  )
}

export default Experience
