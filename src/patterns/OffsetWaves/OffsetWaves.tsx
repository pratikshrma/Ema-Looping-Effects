import { useCurrentSheet } from "@theatre/r3f"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from 'three'
import { types as t } from '@theatre/core'
import { useFrame, useThree } from "@react-three/fiber"
import { useTime } from '../../lib/loop'

import fragShader from '../../Shaders/OffsetWaves/Plane/frag.glsl?raw'
import vertShader from '../../Shaders/OffsetWaves/Plane/vert.glsl?raw'

// gap of 0 would make the layout loop never advance
const MIN_GAP = 0.01

// seeded once so the per-box offsets are stable across rebuilds
const RANDOM_SEED = 1

const toRgba = (hex: string) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace).convertLinearToSRGB()
  return { r: c.r, g: c.g, b: c.b, a: 1 }
}

const SHAPE_DEFAULTS = {
  totalBoxes: 32,
  boxesGap: 1.5,
  boxHeight: 3,
  boxWidth: 1,
}

const MOTION_DEFAULTS = {
  wavePhase: 0,
  waveSpeed: 1.0,
  waveTravel: 1.0,
}

const SHADER_DEFAULTS = {
  color1: '#2C5A2D',
  color2: '#669371',
  uvScaleX: 1.0,
  uvScaleY: 1.0,
  frequency: 8.0,
  frequencyRandomness: 0.0,
  brightness: 1.0,
}

const OffsetWaves = () => {
  const sheet = useCurrentSheet()
  const groupRef = useRef<THREE.Group>(null)

  // shape rebuilds the geometry, motion is only read per frame
  const [shape, setShape] = useState(SHAPE_DEFAULTS)
  const motion = useRef(MOTION_DEFAULTS)

  // every box shares these, only uSeed is per box
  const sharedUniforms = useMemo(() => ({
    uResolution: { value: new THREE.Vector2() },
    uColor1: { value: new THREE.Color().setStyle(SHADER_DEFAULTS.color1, THREE.SRGBColorSpace) },
    uColor2: { value: new THREE.Color().setStyle(SHADER_DEFAULTS.color2, THREE.SRGBColorSpace) },
    uUvScale: { value: new THREE.Vector2(SHADER_DEFAULTS.uvScaleX, SHADER_DEFAULTS.uvScaleY) },
    uFrequency: { value: SHADER_DEFAULTS.frequency },
    uFrequencyRandomness: { value: SHADER_DEFAULTS.frequencyRandomness },
    uBrightness: { value: SHADER_DEFAULTS.brightness },
  }), [])

  const { size, viewport } = useThree()

  useEffect(() => {
    // gl_FragCoord is in drawing-buffer pixels, size is in CSS pixels
    sharedUniforms.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr)
  }, [sharedUniforms, size.width, size.height, viewport.dpr])

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OffsetWaves / Props',
      {
        totalBoxes: t.number(SHAPE_DEFAULTS.totalBoxes, { range: [1, 64], nudgeMultiplier: 1 }),
        totalGap: t.number(SHAPE_DEFAULTS.boxesGap, { range: [MIN_GAP, 4], nudgeMultiplier: 0.01 }),
        boxHeight: t.number(SHAPE_DEFAULTS.boxHeight, { range: [0, 10], nudgeMultiplier: 0.01 }),
        boxWidth: t.number(SHAPE_DEFAULTS.boxWidth, { range: [0, 10], nudgeMultiplier: 0.01 }),
        wavePhase: t.number(MOTION_DEFAULTS.wavePhase, { range: [0, 180], nudgeMultiplier: 1 }),
        waveSpeed: t.number(MOTION_DEFAULTS.waveSpeed, { range: [-30, 30], nudgeMultiplier: 0.01 }),
        waveTravel: t.number(MOTION_DEFAULTS.waveTravel, { range: [-10, 10], nudgeMultiplier: 0.01 }),
      }
      , { reconfigure: true })

    return obj.onValuesChange(v => {
      motion.current = {
        wavePhase: v.wavePhase,
        waveSpeed: v.waveSpeed,
        waveTravel: v.waveTravel,
      }
      setShape(prev =>
        prev.totalBoxes === v.totalBoxes &&
          prev.boxesGap === v.totalGap &&
          prev.boxHeight === v.boxHeight &&
          prev.boxWidth === v.boxWidth
          ? prev
          : {
            totalBoxes: v.totalBoxes,
            boxesGap: v.totalGap,
            boxHeight: v.boxHeight,
            boxWidth: v.boxWidth,
          })
    })
  }, [sheet])

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OffsetWaves / Shader', {
      color1: t.rgba(toRgba(SHADER_DEFAULTS.color1)),
      color2: t.rgba(toRgba(SHADER_DEFAULTS.color2)),
      uvScaleX: t.number(SHADER_DEFAULTS.uvScaleX, { range: [0.01, 50], nudgeMultiplier: 0.01 }),
      uvScaleY: t.number(SHADER_DEFAULTS.uvScaleY, { range: [0.01, 50], nudgeMultiplier: 0.01 }),
      frequency: t.number(SHADER_DEFAULTS.frequency, { range: [0.5, 100], nudgeMultiplier: 0.1 }),
      frequencyRandomness: t.number(SHADER_DEFAULTS.frequencyRandomness, { range: [0, 50], nudgeMultiplier: 0.1 }),
      brightness: t.number(SHADER_DEFAULTS.brightness, { range: [0, 3], nudgeMultiplier: 0.01 }),
    }, { reconfigure: true })

    return obj.onValuesChange(v => {
      sharedUniforms.uColor1.value.setRGB(v.color1.r, v.color1.g, v.color1.b, THREE.SRGBColorSpace)
      sharedUniforms.uColor2.value.setRGB(v.color2.r, v.color2.g, v.color2.b, THREE.SRGBColorSpace)
      sharedUniforms.uUvScale.value.set(v.uvScaleX, v.uvScaleY)
      sharedUniforms.uFrequency.value = v.frequency
      sharedUniforms.uFrequencyRandomness.value = v.frequencyRandomness
      sharedUniforms.uBrightness.value = v.brightness
    })
  }, [sheet, sharedUniforms])

  const planeMeshes = useMemo(() => {
    const count = Math.max(1, Math.round(shape.totalBoxes))
    const gap = Math.max(MIN_GAP, shape.boxesGap)
    const span = (count - 1) * gap

    // one geometry, shared by every mesh; centred so scale.y grows both ways
    const geo = new THREE.PlaneGeometry(shape.boxWidth, shape.boxHeight)

    // a material each, so uSeed is actually per box
    const makeMesh = (x: number, seed: number, frequencySeed: number) => {
      const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        vertexShader: vertShader,
        fragmentShader: fragShader,
        uniforms: {
          ...sharedUniforms,
          uSeed: { value: seed },
          uFrequencySeed: { value: frequencySeed },
        },
      }))
      mesh.position.set(x, 0, 0)
      return mesh
    }

    THREE.MathUtils.seededRandom(RANDOM_SEED)
    const rand = () => THREE.MathUtils.seededRandom()

    const meshes: THREE.Mesh[] = []
    for (let i = 0; i < count; i++) {
      meshes.push(makeMesh(-span / 2 + i * gap, rand(), rand()))
    }

    return meshes
  }, [shape, sharedUniforms])

  useEffect(() => {
    return () => {
      planeMeshes[0]?.geometry.dispose()
      for (const mesh of planeMeshes) (mesh.material as THREE.ShaderMaterial).dispose()
    }
  }, [planeMeshes])

  const advance = useTime()

  useFrame((_state, delta) => {
    const m = motion.current

    const time = advance(delta, m.waveSpeed)
    const phase = THREE.MathUtils.degToRad(m.wavePhase)

    for (const mesh of groupRef.current?.children ?? []) {
      // one wave drives both, so the stretch and the travel stay in step
      const wave = Math.sin(mesh.position.x + time + phase)
      mesh.scale.y = wave
      mesh.position.y = wave * m.waveTravel
    }
  })

  return (
    <group ref={groupRef}>
      {planeMeshes.map(mesh => <primitive key={mesh.uuid} object={mesh} />)}
    </group>
  )
}

export default OffsetWaves
