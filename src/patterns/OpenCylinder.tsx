import { useMemo } from "react"
import { useControls } from 'leva'
import * as THREE from 'three'

import fragShader from '../Shaders/OpenCylinder/frag.glsl?raw'
import vertShader from '../Shaders/OpenCylinder/vert.glsl?raw'

function intersectLines(p1: THREE.Vector2, d1: THREE.Vector2, p2: THREE.Vector2, d2: THREE.Vector2): THREE.Vector2 {
  const denom = d1.x * d2.y - d1.y * d2.x; // 0 if the lines are parallel
  const diff = new THREE.Vector2().subVectors(p2, p1);
  const s = (diff.x * d2.y - diff.y * d2.x) / denom;
  return p1.clone().addScaledVector(d1, s);
}

const curveMesh = (length: number = 2, thickness: number = 0.5, angle: number = 90, height: number = 0.3): THREE.ExtrudeGeometry => {
  <></>
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
  geometry.computeVertexNormals()

  return geometry
}


const OpenCylinder = () => {
  const { length, thickness, angle, height, radius, segments } = useControls('openCylinder', {
    length: { value: 2, min: 0.1, max: 10, step: 0.01 },
    thickness: { value: 0.05, min: 0.001, max: 2, step: 0.001 },
    angle: { value: 90, min: 1, max: 179, step: 1 },
    height: { value: 0.5, min: 0.01, max: 5, step: 0.01 },
    radius: { value: 4, min: 0.1, max: 20, step: 0.1 },
    segments: { value: 32, min: 3, max: 128, step: 1 },
  })

  const lGeometries = useMemo(() => {
    const lGeometries: THREE.ExtrudeGeometry[] = []
    const defaultLGeo = curveMesh(length, thickness, angle, height)

    const circleGeo = new THREE.CircleGeometry(1, segments)
    circleGeo.rotateX(1.57)
    circleGeo.scale(radius, radius, radius)

    const positionsAttr = circleGeo.attributes.position as THREE.BufferAttribute
    const positions = positionsAttr.array as Float32Array

    const defaultDir = new THREE.Vector3(1, 0, 0)

    for (let i = 0; i < positions.length; i += 3) {
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
    console.log(lGeometries)
    return lGeometries
    // return circleGeo
  }, [length, thickness, angle, height, radius, segments])



  return (
    <>
      <group rotation={[3.14, 0.0, 0.0]}>
        {lGeometries.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <shaderMaterial
              vertexShader={vertShader}
              fragmentShader={fragShader}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}

export default OpenCylinder
