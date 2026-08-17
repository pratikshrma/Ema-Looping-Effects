import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useMemo, useRef } from 'react';
import * as THREE from 'three'

import fragShader from '../Shaders/RightCoil/frag.glsl?raw'
import vertShader from '../Shaders/RightCoil/vert.glsl?raw'
import bgFragShader from '../Shaders/Background/frag.glsl?raw'
import bgVertShader from '../Shaders/Background/vert.glsl?raw'

const SHADER_KEY = vertShader + fragShader
const BG_SHADER_KEY = bgVertShader + bgFragShader

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
    const angle = t * Math.PI * 2 * this.turns; //this is the total angle 
    const x = Math.cos(angle) * this.radius
    const y = Math.sin(angle) * this.radius
    const z = t * this.height - this.height / 2 //not sure about this one

    return optionalTarget.set(x, y, z)
  }
}


export default function Coil() {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const bgMeshRef = useRef<THREE.Mesh | null>(null)
  const { size } = useThree()

  const { radius, height, turns, tubeRadius, tubularSegments, radialSegments, speed } = useControls('horizontalCoil', {
    radius: { value: 1.6, min: 0.1, max: 10, step: 0.01 },
    height: { value: 32, min: 0.1, max: 40, step: 0.01 },
    turns: { value: 27, min: 1, max: 50, step: 1 },
    tubeRadius: { value: 0.1, min: 0.001, max: 2, step: 0.001 },
    tubularSegments: { value: 1135, min: 8, max: 2000, step: 1 },
    radialSegments: { value: 20, min: 3, max: 64, step: 1 },
    speed: { value: 1.0, min: -10, max: 10, step: 0.01 },
  })

  const { color1, color2, seed, frequency, uvScaleX, uvScaleY, brightness, velocityX, velocityY } = useControls('horizontalCoil shader', {
    color1: { value: '#2C5A2D' },
    color2: { value: '#669371' },
    seed: { value: 0.5, min: 0, max: 1, step: 0.01 },
    frequency: { value: 8, min: 0.5, max: 30, step: 0.1 },
    uvScaleX: { value: 23.8, min: 0.01, max: 200, step: 0.01 },
    uvScaleY: { value: 0.48, min: 0.01, max: 100, step: 0.01 },
    brightness: { value: 1.9, min: 0, max: 3, step: 0.01 },
    velocityX: { value: 0.0, min: -10, max: 10, step: 0.01 },
    velocityY: { value: 1.0, min: -10, max: 10, step: 0.01 },
  })

  const { bgColor, bgUvScale, bgDotSize, bgBlur } = useControls('background', {
    bgColor: { value: '#387239', label: 'color' },
    bgUvScale: { value: 666, min: 1, max: 3000, step: 1, label: 'uv scale' },
    bgDotSize: { value: 0, min: 0.0, max: 1.0, step: 0.001, label: 'dot size' },
    bgBlur: { value: 0.3, min: 0.001, max: 1.0, step: 0.001, label: 'blur' },
  })

  const geometry = useMemo(() => {
    const path = new HelixCurve(radius, height, turns);
    return new THREE.TubeGeometry(path, tubularSegments, tubeRadius, radialSegments, false);
  }, [radius, height, turns, tubeRadius, tubularSegments, radialSegments]);

  const uniforms = useMemo(() => ({
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uSeed: { value: 0.5 },
    uColor1: { value: new THREE.Color() },
    uColor2: { value: new THREE.Color() },
    uUvOffset: { value: new THREE.Vector2() },
    uUvScale: { value: new THREE.Vector2(1, 1) },
    uFrequency: { value: 5.0 },
    uBrightness: { value: 1.0 },
  }), [size.width, size.height])

  const bgUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color('#2c5a2d') },
    uTime: { value: 0.0 },
    uUvScale: { value: 664.0 },
    uDotSize: { value: 0.23 },
    uBlur: { value: 0.001 },
  }), [])

  useFrame((_, delta) => {
    const bgMesh = bgMeshRef.current
    if (bgMesh) {
      const bg = (bgMesh.material as THREE.ShaderMaterial).uniforms
      bg.uColor.value.set(bgColor)
      bg.uUvScale.value = bgUvScale
      bg.uDotSize.value = bgDotSize
      bg.uBlur.value = bgBlur
      bg.uTime.value += delta
    }

    const mesh = meshRef.current
    if (!mesh) return

    mesh.rotation.z -= delta * speed

    const u = (mesh.material as THREE.ShaderMaterial).uniforms
    u.uUvOffset.value.x += velocityX * delta
    u.uUvOffset.value.y += velocityY * delta
    u.uResolution.value.set(size.width, size.height)
    u.uColor1.value.set(color1)
    u.uColor2.value.set(color2)
    u.uUvScale.value.set(uvScaleX, uvScaleY)
    u.uSeed.value = seed
    u.uFrequency.value = frequency
    u.uBrightness.value = brightness
  })


  return (
    <>
      <mesh ref={bgMeshRef} position={[0, 0, -20]}>
        <planeGeometry args={[100, 100]} />
        <shaderMaterial
          key={BG_SHADER_KEY}
          vertexShader={bgVertShader}
          fragmentShader={bgFragShader}
          uniforms={bgUniforms}
        />
      </mesh>

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
