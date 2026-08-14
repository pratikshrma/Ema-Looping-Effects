import { useMemo, useRef } from "react"
import { useControls } from 'leva'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'

import fragShader from '../Shaders/OpenCylinder/frag.glsl?raw'
import vertShader from '../Shaders/OpenCylinder/vert.glsl?raw'
import { TAU, useTime } from "../lib/loop"

const TURNS = 1
const SHADER_KEY = vertShader + fragShader

function intersectLines(p1: THREE.Vector2, d1: THREE.Vector2, p2: THREE.Vector2, d2: THREE.Vector2): THREE.Vector2 {
  const denom = d1.x * d2.y - d1.y * d2.x; // 0 if the lines are parallel
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

    // how far along each arm this vertex is
    const s1 = x * d1.x + y * d1.y
    const s2 = x * d2.x + y * d2.y

    // pick the arm it actually belongs to
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

function generateRandomColor(seed: number): THREE.Color {
  const color = new THREE.Color()
  color.setHSL(
    THREE.MathUtils.seededRandom(seed),
    0.85 + THREE.MathUtils.seededRandom() * 0.15,
    0.25 + THREE.MathUtils.seededRandom() * 0.15
  )
  return color
}

function getComplementaryColor(color: THREE.Color): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  const complementary = new THREE.Color()
  complementary.setHSL((hsl.h + 0.5) % 1.0, hsl.s, hsl.l) // +0.5 = +180° in normalized hue
  return complementary
}


const OpenCylinder = () => {
  const { size } = useThree()
  const groupRef = useRef<THREE.Group>(null)


  const { length, thickness, angle, height, radius, segments, endScaleA, endScaleB, speed, frequency, velocityX, velocityY } = useControls('openCylinder', {
    length: { value: 42.3, min: 0.1, max: 100, step: 0.01 },
    thickness: { value: 0.15, min: 0.001, max: 2, step: 0.001 },
    angle: { value: 90, min: 1, max: 179, step: 1 },
    height: { value: 0.5, min: 0.01, max: 5, step: 0.01 },
    radius: { value: 2.7, min: 0.1, max: 20, step: 0.1 },
    segments: { value: 32, min: 3, max: 128, step: 1 },
    endScaleA: { value: 17.4, min: 0.1, max: 50, step: 0.01 },
    endScaleB: { value: 1.0, min: 0.1, max: 50, step: 0.01 },
    speed: { value: 0.071, min: 0, max: 2, step: 0.001 },
    frequency: { value: 5.0, min: 0.5, max: 30, step: 0.1 },
    velocityX: { value: 0.1, min: -10, max: 10, step: 0.01 },
    velocityY: { value: 0.06, min: -10, max: 10, step: 0.01 },
  })

  const uUvOffset = useMemo(() => ({ value: new THREE.Vector2() }), [])

  const lGeometries = useMemo(() => {
    const lGeometries: THREE.ExtrudeGeometry[] = []
    const defaultLGeo = curveMesh(length, thickness, angle, height, endScaleA, endScaleB)

    const circleGeo = new THREE.CircleGeometry(1, segments)
    circleGeo.rotateX(1.57)

    circleGeo.scale(radius, radius, radius)

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
    // return circleGeo
  }, [length, thickness, angle, height, radius, segments, endScaleA, endScaleB])

  const uniformsArray = useMemo(() => {
    return lGeometries.map((_, i) => {
      const randomColor = generateRandomColor(i)
      const primaryColor = getComplementaryColor(randomColor)
      return {
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uSeed: { value: THREE.MathUtils.seededRandom(i) },
        uColor1: { value: randomColor },
        uColor2: { value: primaryColor },
        uTime: { value: 0.0 },
        uUvOffset,
        uFrequency: { value: 1.0 },
      }
    }
    )
  }, [lGeometries, size.width, size.height, uUvOffset])

  const advance = useTime()

  useFrame((_state, delta) => {
    const group = groupRef.current
    if (!group) return

    const t = advance(delta, speed)
    group.rotation.y = t * TAU * TURNS

    uUvOffset.value.x += velocityX * delta
    uUvOffset.value.y += velocityY * delta
    group.traverse(mesh => {
      if (mesh instanceof THREE.Mesh) {
        (mesh.material as THREE.ShaderMaterial).uniforms.uFrequency.value = frequency;
        (mesh.material as THREE.ShaderMaterial).uniforms.uTime.value += delta
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
              side={THREE.BackSide}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}

export default OpenCylinder
