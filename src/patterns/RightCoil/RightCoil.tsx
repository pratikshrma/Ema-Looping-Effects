import { useFrame, useThree } from '@react-three/fiber';
import { types as t } from '@theatre/core'
import { useCurrentSheet } from '@theatre/r3f'
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three'

import fragShader from '../../Shaders/RightCoil/frag.glsl?raw'
import vertShader from '../../Shaders/RightCoil/vert.glsl?raw'

const SHADER_KEY = vertShader + fragShader

const toRgba = (hex: string) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace).convertLinearToSRGB()
  return { r: c.r, g: c.g, b: c.b, a: 1 }
}

const GEOMETRY_DEFAULTS = {
  radius: 1.6,
  height: 32,
  turns: 27,
  tubeRadius: 0.1,
  tubularSegments: 1135,
  radialSegments: 20,
}

const MOTION_DEFAULTS = {
  speed: 1.0,
  velocityX: 0.0,
  velocityY: 1.0,
}

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;
  height: number;
  turns: number;

  constructor(radius = 1, height = 4, turns = 5) {
    super()
    this.radius = radius;
    this.height = height;
    this.turns = turns;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * Math.PI * 2 * this.turns;
    const x = Math.cos(angle) * this.radius
    const y = Math.sin(angle) * this.radius
    const z = t * this.height - this.height / 2

    return optionalTarget.set(x, y, z)
  }
}

export default function RightCoil() {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const { size } = useThree()
  const sheet = useCurrentSheet()

  const [shape, setShape] = useState(GEOMETRY_DEFAULTS)
  const motion = useRef(MOTION_DEFAULTS)

  const uniforms = useMemo(() => ({
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uSeed: { value: 0.5 },
    uColor1: { value: new THREE.Color().setStyle('#2C5A2D', THREE.SRGBColorSpace) },
    uColor2: { value: new THREE.Color().setStyle('#669371', THREE.SRGBColorSpace) },
    uUvOffset: { value: new THREE.Vector2() },
    uUvScale: { value: new THREE.Vector2(23.8, 0.48) },
    uFrequency: { value: 8.0 },
    uBrightness: { value: 1.9 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('RightCoil / Coil', {
      radius: t.number(GEOMETRY_DEFAULTS.radius, { range: [0.1, 10], nudgeMultiplier: 0.01 }),
      height: t.number(GEOMETRY_DEFAULTS.height, { range: [0.1, 40], nudgeMultiplier: 0.01 }),
      turns: t.number(GEOMETRY_DEFAULTS.turns, { range: [1, 50], nudgeMultiplier: 1 }),
      tubeRadius: t.number(GEOMETRY_DEFAULTS.tubeRadius, { range: [0.001, 2], nudgeMultiplier: 0.001 }),
      tubularSegments: t.number(GEOMETRY_DEFAULTS.tubularSegments, { range: [8, 2000], nudgeMultiplier: 1 }),
      radialSegments: t.number(GEOMETRY_DEFAULTS.radialSegments, { range: [3, 64], nudgeMultiplier: 1 }),
      speed: t.number(MOTION_DEFAULTS.speed, { range: [-10, 10], nudgeMultiplier: 0.01 }),
    }, { reconfigure: true })

    return obj.onValuesChange((v) => {
      motion.current = { ...motion.current, speed: v.speed }
      setShape((prev) => {
        const next = {
          radius: v.radius,
          height: v.height,
          turns: Math.round(v.turns),
          tubeRadius: v.tubeRadius,
          tubularSegments: Math.round(v.tubularSegments),
          radialSegments: Math.round(v.radialSegments),
        }
        const same = (Object.keys(next) as (keyof typeof next)[]).every((k) => prev[k] === next[k])
        return same ? prev : next
      })
    })
  }, [sheet])

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('RightCoil / Shader', {
      color1: t.rgba(toRgba('#2C5A2D')),
      color2: t.rgba(toRgba('#669371')),
      seed: t.number(0.5, { range: [0, 1], nudgeMultiplier: 0.01 }),
      frequency: t.number(8, { range: [0.5, 30], nudgeMultiplier: 0.1 }),
      uvScaleX: t.number(23.8, { range: [0.01, 200], nudgeMultiplier: 0.01 }),
      uvScaleY: t.number(0.48, { range: [0.01, 100], nudgeMultiplier: 0.01 }),
      brightness: t.number(1.9, { range: [0, 3], nudgeMultiplier: 0.01 }),
      velocityX: t.number(MOTION_DEFAULTS.velocityX, { range: [-10, 10], nudgeMultiplier: 0.01 }),
      velocityY: t.number(MOTION_DEFAULTS.velocityY, { range: [-10, 10], nudgeMultiplier: 0.01 }),
    }, { reconfigure: true })

    return obj.onValuesChange((v) => {
      motion.current = { ...motion.current, velocityX: v.velocityX, velocityY: v.velocityY }
      uniforms.uColor1.value.setRGB(v.color1.r, v.color1.g, v.color1.b, THREE.SRGBColorSpace)
      uniforms.uColor2.value.setRGB(v.color2.r, v.color2.g, v.color2.b, THREE.SRGBColorSpace)
      uniforms.uUvScale.value.set(v.uvScaleX, v.uvScaleY)
      uniforms.uSeed.value = v.seed
      uniforms.uFrequency.value = v.frequency
      uniforms.uBrightness.value = v.brightness
    })
  }, [sheet, uniforms])

  const geometry = useMemo(() => {
    const path = new HelixCurve(shape.radius, shape.height, shape.turns);
    return new THREE.TubeGeometry(path, shape.tubularSegments, shape.tubeRadius, shape.radialSegments, false);
  }, [shape]);

  useFrame((_, delta) => {

    const mesh = meshRef.current
    if (!mesh) return

    mesh.rotation.z -= delta * motion.current.speed

    const u = (mesh.material as THREE.ShaderMaterial).uniforms
    u.uUvOffset.value.x += motion.current.velocityX * delta
    u.uUvOffset.value.y += motion.current.velocityY * delta
    u.uResolution.value.set(size.width, size.height)
  })

  return (
    <>
      <group rotation={[0, 1.57, 1.57]}>
        <mesh ref={meshRef} geometry={geometry}>
          <shaderMaterial
            key={SHADER_KEY}
            vertexShader={vertShader}
            fragmentShader={fragShader}
            uniforms={uniforms}
          />
        </mesh>
      </group>
    </>
  );
}
