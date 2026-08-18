import { useEffect, useMemo, useRef, useState } from "react"
import { types as t } from '@theatre/core'
import { useCurrentSheet } from '@theatre/r3f'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'

import fragShader from '../../Shaders/OpenCylinder/frag.glsl?raw'
import vertShader from '../../Shaders/OpenCylinder/vert.glsl?raw'
import { TAU, useTime } from "../../lib/loop"

const TURNS = 1
const SHADER_KEY = vertShader + fragShader

function intersectLines(p1: THREE.Vector2, d1: THREE.Vector2, p2: THREE.Vector2, d2: THREE.Vector2): THREE.Vector2 {
  const denom = d1.x * d2.y - d1.y * d2.x;
  const diff = new THREE.Vector2().subVectors(p2, p1);
  const s = (diff.x * d2.y - diff.y * d2.x) / denom;
  return p1.clone().addScaledVector(d1, s);
}

const curveMesh = (length: number = 2, thickness: number = 0.5, angle: number = 90, height: number = 0.3, endScaleA: number = 1, endScaleB: number = 1): THREE.ExtrudeGeometry => {
  const theta = THREE.MathUtils.degToRad(angle)

  const d1 = new THREE.Vector2(1, 0)
  const d2 = new THREE.Vector2(Math.cos(theta), Math.sin(theta))

  const n1 = new THREE.Vector2(-d1.y, d1.x)
  const n2 = new THREE.Vector2(d2.y, -d2.x)

  const zero = new THREE.Vector2(0, 0)

  const innerCorner = intersectLines(
    n1.clone().multiplyScalar(thickness), d1,
    n2.clone().multiplyScalar(thickness), d2
  );

  const points = [
    zero,
    d1.clone().multiplyScalar(length),
    d1.clone().multiplyScalar(length).addScaledVector(n1, thickness),
    innerCorner,
    d2.clone().multiplyScalar(length).addScaledVector(n2, thickness),
    d2.clone().multiplyScalar(length),
  ]

  const shape = new THREE.Shape(points)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false })
  const posAttr = geometry.attributes.position as THREE.BufferAttribute
  const midZ = height / 2

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i)
    const y = posAttr.getY(i)

    const s1 = x * d1.x + y * d1.y
    const s2 = x * d2.x + y * d2.y

    const onArmA = s1 >= s2
    const along = onArmA ? s1 : s2
    const endScale = onArmA ? endScaleA : endScaleB

    const t = THREE.MathUtils.clamp(along / length, 0, 1)
    const s = THREE.MathUtils.lerp(1, endScale, t)

    posAttr.setZ(i, (posAttr.getZ(i) - midZ) * s + midZ)
  }
  posAttr.needsUpdate = true

  geometry.computeVertexNormals()
  return geometry
}

const COLOR_A = '#206F45'
const COLOR_B = '#6DB476'

const toRgba = (hex: string) => {
  const c = new THREE.Color().setStyle(hex, THREE.SRGBColorSpace).convertLinearToSRGB()
  return { r: c.r, g: c.g, b: c.b, a: 1 }
}

const SHAPE_DEFAULTS = {
  length: 100,
  thickness: 50,
  angle: 90,
  height: 0.34,
  radius: 3.1,
  segments: 50,
  endScaleA: 43.7,
  endScaleB: 1.0,
}

const MOTION_DEFAULTS = {
  speed: 0.03,
  frequency: 2.5,
  velocityX: 0.1,
  velocityY: 0.006,
  brightnessRandomness: 0.5,
  seemEdge: 0.0,
}

const OpenCylinder = () => {
  const { size } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  const sheet = useCurrentSheet()
  const [shape, setShape] = useState(SHAPE_DEFAULTS)
  const motion = useRef(MOTION_DEFAULTS)

  const color1 = useMemo(() => new THREE.Color().setStyle(COLOR_A, THREE.SRGBColorSpace), [])
  const color2 = useMemo(() => new THREE.Color().setStyle(COLOR_B, THREE.SRGBColorSpace), [])

  useEffect(() => {
    if (!sheet) return
    const obj = sheet.object('OpenCylinder / Properties', {
      length: t.number(SHAPE_DEFAULTS.length, { range: [0.1, 100], nudgeMultiplier: 0.01 }),
      thickness: t.number(SHAPE_DEFAULTS.thickness, { range: [0.001, 50], nudgeMultiplier: 0.001 }),
      angle: t.number(SHAPE_DEFAULTS.angle, { range: [1, 179], nudgeMultiplier: 1 }),
      height: t.number(SHAPE_DEFAULTS.height, { range: [0.01, 5], nudgeMultiplier: 0.01 }),
      radius: t.number(SHAPE_DEFAULTS.radius, { range: [0.1, 20], nudgeMultiplier: 0.1 }),
      segments: t.number(SHAPE_DEFAULTS.segments, { range: [3, 128], nudgeMultiplier: 1 }),
      endScaleA: t.number(SHAPE_DEFAULTS.endScaleA, { range: [0.1, 50], nudgeMultiplier: 0.01 }),
      endScaleB: t.number(SHAPE_DEFAULTS.endScaleB, { range: [0.1, 50], nudgeMultiplier: 0.01 }),
      speed: t.number(MOTION_DEFAULTS.speed, { range: [0, 2], nudgeMultiplier: 0.001 }),
      frequency: t.number(MOTION_DEFAULTS.frequency, { range: [0.5, 30], nudgeMultiplier: 0.1 }),
      velocityX: t.number(MOTION_DEFAULTS.velocityX, { range: [-10, 10], nudgeMultiplier: 0.01 }),
      velocityY: t.number(MOTION_DEFAULTS.velocityY, { range: [-10, 10], nudgeMultiplier: 0.01 }),
      brightnessRandomness: t.number(MOTION_DEFAULTS.brightnessRandomness, { range: [0, 1], nudgeMultiplier: 0.01 }),
      seemEdge: t.number(MOTION_DEFAULTS.seemEdge, { range: [-1, 1], nudgeMultiplier: 0.01 }),
      colorA: t.rgba(toRgba(COLOR_A)),
      colorB: t.rgba(toRgba(COLOR_B)),
    }, { reconfigure: true })

    return obj.onValuesChange((v) => {
      motion.current = {
        speed: v.speed,
        frequency: v.frequency,
        velocityX: v.velocityX,
        velocityY: v.velocityY,
        brightnessRandomness: v.brightnessRandomness,
        seemEdge: v.seemEdge,
      }
      color1.setRGB(v.colorA.r, v.colorA.g, v.colorA.b, THREE.SRGBColorSpace)
      color2.setRGB(v.colorB.r, v.colorB.g, v.colorB.b, THREE.SRGBColorSpace)

      setShape((prev) => {
        const next = {
          length: v.length,
          thickness: v.thickness,
          angle: v.angle,
          height: v.height,
          radius: v.radius,
          segments: Math.round(v.segments),
          endScaleA: v.endScaleA,
          endScaleB: v.endScaleB,
        }
        const same = (Object.keys(next) as (keyof typeof next)[]).every((k) => prev[k] === next[k])
        return same ? prev : next
      })
    })
  }, [sheet, color1, color2])

  const uUvOffset = useMemo(() => ({ value: new THREE.Vector2() }), [])

  const lGeometries = useMemo(() => {
    const lGeometries: THREE.ExtrudeGeometry[] = []
    const defaultLGeo = curveMesh(shape.length, shape.thickness, shape.angle, shape.height, shape.endScaleA, shape.endScaleB)

    const circleGeo = new THREE.CircleGeometry(1, shape.segments)
    circleGeo.rotateX(1.57)

    circleGeo.scale(shape.radius, shape.radius, shape.radius)

    const positionsAttr = circleGeo.attributes.position as THREE.BufferAttribute
    const positions = positionsAttr.array as Float32Array

    const defaultDir = new THREE.Vector3(1, 0, 0)

    for (let i = 3; i < positions.length; i += 3) {
      const tempGeo = defaultLGeo.clone() as THREE.ExtrudeGeometry
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]

      const pos = new THREE.Vector3(x, y, z)
      const normal = new THREE.Vector3(x, y, z).normalize()

      const quat = new THREE.Quaternion().setFromUnitVectors(defaultDir, normal)

      tempGeo.applyQuaternion(quat)
      tempGeo.translate(pos.x, pos.y, pos.z)
      lGeometries.push(tempGeo)
    }
    return lGeometries
  }, [shape])

  const uniformsArray = useMemo(() => {
    return lGeometries.map((_, i) => {
      const seed = THREE.MathUtils.seededRandom(i)
      return {
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uSeed: { value: seed },
        uColor1: { value: new THREE.Color() },
        uColor2: { value: new THREE.Color() },
        uTime: { value: 0.0 },
        uUvOffset,
        uFrequency: { value: 1.0 },
        uBrightnessSeed: { value: THREE.MathUtils.seededRandom() * 2 - 1 },
        uBrightnessRandomness: { value: 0.0 },
        uSeemEdge: { value: 0.2 },
      }
    }
    )
  }, [lGeometries, size.width, size.height, uUvOffset])

  const advance = useTime()

  useFrame((_state, delta) => {
    const group = groupRef.current
    if (!group) return

    const m = motion.current
    const time = advance(delta, m.speed)
    group.rotation.y = time * TAU * TURNS

    uUvOffset.value.x += m.velocityX * delta
    uUvOffset.value.y += m.velocityY * delta
    group.traverse(mesh => {
      if (mesh instanceof THREE.Mesh) {
        const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms
        uniforms.uColor1.value.copy(color1)
        uniforms.uColor2.value.copy(color2)
        uniforms.uFrequency.value = m.frequency
        uniforms.uBrightnessRandomness.value = m.brightnessRandomness
        uniforms.uSeemEdge.value = m.seemEdge
        uniforms.uTime.value += delta
      }
    })
  })

  return (
    <>
      <group ref={groupRef} rotation={[3.14, 0.0, 0.0]}>
        {lGeometries.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <shaderMaterial
              key={SHADER_KEY}
              vertexShader={vertShader}
              fragmentShader={fragShader}
              uniforms={uniformsArray[i]}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}

export default OpenCylinder
