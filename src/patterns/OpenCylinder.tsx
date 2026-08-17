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

const COLOR_A = '#206F45'
const COLOR_B = '#6DB476'

const OpenCylinder = () => {
  const { size } = useThree()
  const groupRef = useRef<THREE.Group>(null)


  const { length, thickness, angle, height, radius, segments, endScaleA, endScaleB, speed, frequency, velocityX, velocityY, brightnessRandomness, seemEdge, colorA, colorB } = useControls('openCylinder', {
    length: { value: 100, min: 0.1, max: 100, step: 0.01 },
    thickness: { value: 50, min: 0.001, max: 50, step: 0.001 },
    angle: { value: 90, min: 1, max: 179, step: 1 },
    height: { value: 0.34, min: 0.01, max: 5, step: 0.01 },
    radius: { value: 3.1, min: 0.1, max: 20, step: 0.1 },
    segments: { value: 50, min: 3, max: 128, step: 1 },
    endScaleA: { value: 43.7, min: 0.1, max: 50, step: 0.01 },
    endScaleB: { value: 1.0, min: 0.1, max: 50, step: 0.01 },
    speed: { value: 0.03, min: 0, max: 2, step: 0.001 },
    frequency: { value: 2.5, min: 0.5, max: 30, step: 0.1 },
    velocityX: { value: 0.1, min: -10, max: 10, step: 0.01 },
    velocityY: { value: 0.006, min: -10, max: 10, step: 0.01 },
    brightnessRandomness: { value: 0.5, min: 0, max: 1, step: 0.01 },
    seemEdge: { value: 0.0, min: -1, max: 1, step: 0.01, label: 'Seem Edge' },
    colorA: { value: COLOR_A, label: 'Color A' },
    colorB: { value: COLOR_B, label: 'Color B' },
  })

  // the picker hands back a css string; parse it once per change, not per mesh per frame
  const color1 = useMemo(() => new THREE.Color().setStyle(colorA, THREE.SRGBColorSpace), [colorA])
  const color2 = useMemo(() => new THREE.Color().setStyle(colorB, THREE.SRGBColorSpace), [colorB])

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
      // seeding once per instance keeps the noise/brightness chain deterministic
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

    const t = advance(delta, speed)
    group.rotation.y = t * TAU * TURNS

    uUvOffset.value.x += velocityX * delta
    uUvOffset.value.y += velocityY * delta
    group.traverse(mesh => {
      if (mesh instanceof THREE.Mesh) {
        const uniforms = (mesh.material as THREE.ShaderMaterial).uniforms
        uniforms.uColor1.value.copy(color1)
        uniforms.uColor2.value.copy(color2)
        uniforms.uFrequency.value = frequency
        uniforms.uBrightnessRandomness.value = brightnessRandomness
        uniforms.uSeemEdge.value = seemEdge
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
