import { useCurrentSheet } from "@theatre/r3f"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from 'three'
import { types as t } from '@theatre/core'
import { useFrame, useThree } from "@react-three/fiber"
import { useTime } from '../../lib/loop'

import fragShader from '../../Shaders/OffsetWaves3D/Plane/frag.glsl?raw'
import vertShader from '../../Shaders/OffsetWaves3D/Plane/vert.glsl?raw'

// gap of 0 would make the layout loop never advance
const MIN_GAP = 0.01

// seeded once so the per-box offsets are stable across rebuilds
const RANDOM_SEED = 1

// raw elapsed seconds, advanced by the frame loop. module scope because the
// frame loop has to mutate it; the same object is spread into every material,
// so one write per frame reaches all of them
const uTime = { value: 0 }

const toRgba = (hex: string) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace).convertLinearToSRGB()
  return { r: c.r, g: c.g, b: c.b, a: 1 }
}

type GeometryKind = 'circle' | 'square'
const GEOMETRY_OPTIONS = { circle: 'Circle', square: 'Square' }

const SHAPE_DEFAULTS = {
  geometry: 'circle' as GeometryKind,
  totalBoxes: 32,
  boxesGap: 1.5,
  boxHeight: 3,
  boxWidth: 1,
  circleRadius: 1,
}

const MOTION_DEFAULTS = {
  wavePhase: 0,
  waveSpeed: 1.0,
  waveTravel: 1.0,
  waveMin: 0.8,
  waveMax: 1.0,
}

const SHADER_DEFAULTS = {
  color1: '#2C5A2D',
  color2: '#669371',
  uvScaleX: 1.0,
  uvScaleY: 1.0,
  frequency: 8.0,
  frequencyRandomness: 0.0,
  timeScale: 0.2,
  brightness: 1.0,
  brightnessRandomness: 0.5,
}

const OffsetWaves3D = () => {
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
    uTimeScale: { value: SHADER_DEFAULTS.timeScale },
    uBrightness: { value: SHADER_DEFAULTS.brightness },
    uBrightnessRandomness: { value: SHADER_DEFAULTS.brightnessRandomness },
  }), [])

  const { size, viewport } = useThree()

  useEffect(() => {
    // gl_FragCoord is in drawing-buffer pixels, size is in CSS pixels
    sharedUniforms.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr)
  }, [sharedUniforms, size.width, size.height, viewport.dpr])

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OffsetWaves3D / Props',
      {
        geometry: t.stringLiteral(SHAPE_DEFAULTS.geometry, GEOMETRY_OPTIONS, { as: 'switch' }),
        totalBoxes: t.number(SHAPE_DEFAULTS.totalBoxes, { range: [1, 128], nudgeMultiplier: 1 }),
        totalGap: t.number(SHAPE_DEFAULTS.boxesGap, { range: [MIN_GAP, 4], nudgeMultiplier: 0.01 }),
        boxHeight: t.number(SHAPE_DEFAULTS.boxHeight, { range: [0, 10], nudgeMultiplier: 0.01 }),
        boxWidth: t.number(SHAPE_DEFAULTS.boxWidth, { range: [0, 10], nudgeMultiplier: 0.01 }),
        circleRadius: t.number(SHAPE_DEFAULTS.circleRadius, { range: [0.01, 10], nudgeMultiplier: 0.01 }),
        wavePhase: t.number(MOTION_DEFAULTS.wavePhase, { range: [0, 180], nudgeMultiplier: 1 }),
        waveSpeed: t.number(MOTION_DEFAULTS.waveSpeed, { range: [-30, 30], nudgeMultiplier: 0.01 }),
        waveTravel: t.number(MOTION_DEFAULTS.waveTravel, { range: [-10, 10], nudgeMultiplier: 0.01 }),
        waveMin: t.number(MOTION_DEFAULTS.waveMin, { range: [0, 4], nudgeMultiplier: 0.01 }),
        waveMax: t.number(MOTION_DEFAULTS.waveMax, { range: [0, 4], nudgeMultiplier: 0.01 }),
      }
      , { reconfigure: true })

    return obj.onValuesChange(v => {
      motion.current = {
        wavePhase: v.wavePhase,
        waveSpeed: v.waveSpeed,
        waveTravel: v.waveTravel,
        waveMin: v.waveMin,
        waveMax: v.waveMax,
      }
      setShape(prev =>
        prev.geometry === v.geometry &&
          prev.totalBoxes === v.totalBoxes &&
          prev.boxesGap === v.totalGap &&
          prev.boxHeight === v.boxHeight &&
          prev.boxWidth === v.boxWidth &&
          prev.circleRadius === v.circleRadius
          ? prev
          : {
            geometry: v.geometry,
            totalBoxes: v.totalBoxes,
            boxesGap: v.totalGap,
            boxHeight: v.boxHeight,
            boxWidth: v.boxWidth,
            circleRadius: v.circleRadius,
          })
    })
  }, [sheet])

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OffsetWaves3D / Shader', {
      color1: t.rgba(toRgba(SHADER_DEFAULTS.color1)),
      color2: t.rgba(toRgba(SHADER_DEFAULTS.color2)),
      uvScaleX: t.number(SHADER_DEFAULTS.uvScaleX, { range: [0.01, 50], nudgeMultiplier: 0.01 }),
      uvScaleY: t.number(SHADER_DEFAULTS.uvScaleY, { range: [0.01, 50], nudgeMultiplier: 0.01 }),
      frequency: t.number(SHADER_DEFAULTS.frequency, { range: [0.5, 100], nudgeMultiplier: 0.1 }),
      frequencyRandomness: t.number(SHADER_DEFAULTS.frequencyRandomness, { range: [0, 50], nudgeMultiplier: 0.1 }),
      timeScale: t.number(SHADER_DEFAULTS.timeScale, { range: [-5, 5], nudgeMultiplier: 0.01 }),
      brightness: t.number(SHADER_DEFAULTS.brightness, { range: [0, 3], nudgeMultiplier: 0.01 }),
      brightnessRandomness: t.number(SHADER_DEFAULTS.brightnessRandomness, { range: [0, 1], nudgeMultiplier: 0.01 }),
    }, { reconfigure: true })

    return obj.onValuesChange(v => {
      sharedUniforms.uColor1.value.setRGB(v.color1.r, v.color1.g, v.color1.b, THREE.SRGBColorSpace)
      sharedUniforms.uColor2.value.setRGB(v.color2.r, v.color2.g, v.color2.b, THREE.SRGBColorSpace)
      sharedUniforms.uUvScale.value.set(v.uvScaleX, v.uvScaleY)
      sharedUniforms.uFrequency.value = v.frequency
      sharedUniforms.uFrequencyRandomness.value = v.frequencyRandomness
      sharedUniforms.uTimeScale.value = v.timeScale
      sharedUniforms.uBrightness.value = v.brightness
      sharedUniforms.uBrightnessRandomness.value = v.brightnessRandomness
    })
  }, [sheet, sharedUniforms])

  const planeMeshes = useMemo(() => {
    const count = Math.max(1, Math.round(shape.totalBoxes))
    const gap = Math.max(MIN_GAP, shape.boxesGap)
    const span = (count - 1) * gap

    // one geometry, shared by every mesh; centred so scale.y grows both ways
    const geo = shape.geometry === 'square'
      ? new THREE.PlaneGeometry(shape.boxWidth, shape.boxHeight)
      : new THREE.CircleGeometry(shape.circleRadius)

    // a material each, so uSeed is actually per box
    const makeMesh = (x: number, seed: number, frequencySeed: number, brightnessSeed: number) => {
      const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        vertexShader: vertShader,
        fragmentShader: fragShader,
        uniforms: {
          ...sharedUniforms,
          uTime,
          uSeed: { value: seed },
          uFrequencySeed: { value: frequencySeed },
          uBrightnessSeed: { value: brightnessSeed },
        },
      }))
      mesh.position.set(x, 0, 0)
      return mesh
    }

    THREE.MathUtils.seededRandom(RANDOM_SEED)
    const rand = () => THREE.MathUtils.seededRandom()

    const meshes: THREE.Mesh[] = []
    for (let i = 0; i < count; i++) {
      // one draw per stream, brightness mapped to -1..1 so it darkens and lightens
      meshes.push(makeMesh(-span / 2 + i * gap, rand(), rand(), rand() * 2 - 1))
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

    // raw elapsed; the shader scales it into z, so timeScale stays deterministic
    uTime.value += delta

    for (const mesh of groupRef.current?.children ?? []) {
      // one wave drives both, so the stretch and the travel stay in step
      const wave = Math.sin(mesh.position.x + time + phase)
      // sine is -1..1, normalise before mapping into the scale range
      mesh.scale.y = THREE.MathUtils.mapLinear(wave * 0.5 + 0.5, 0, 1, m.waveMin, m.waveMax)
      // travel keeps the signed wave so the bar swings either side of centre
      mesh.position.y = wave * m.waveTravel
    }
  })

  return (
    <group ref={groupRef}>
      {planeMeshes.map(mesh => <primitive key={mesh.uuid} object={mesh} />)}
    </group>
  )
}

export default OffsetWaves3D
