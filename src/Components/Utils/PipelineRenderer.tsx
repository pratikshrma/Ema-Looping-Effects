import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { SheetProvider, useCurrentSheet } from '@theatre/r3f'
import { types as t } from '@theatre/core'
import { Fragment, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import useRenderPipeline from './useRenderPipeline'
import vertShader from '../../Shaders/Composite/vert.glsl?raw'
import fragShader from '../../Shaders/Composite/frag.glsl?raw'
import { studioEnabled } from '../../theatre/sheet'
import { patterns } from '../../patterns/registry'
import type { PatternCamera } from '../../patterns/registry'

const DITHER_DEFAULTS = {
  enabled: 1,
  pixelScale: 4,
  levels: 8,
  matrixSize: 4,
  mono: 1,
  contrast: 2.4,
  brightness: 0.44,
}

type DitherParams = typeof DITHER_DEFAULTS

const PipelineRenderer = ({ activeId }: { activeId: string }) => {
  const { size, camera: rootCamera } = useThree()
  const pipeline = useRenderPipeline({ count: patterns.length })
  const sheet = useCurrentSheet()

  const cameraRefs = useMemo(
    () => patterns.map(() => ({ current: null as PatternCamera | null })),
    [],
  )

  const ditherParams = useRef<DitherParams[]>(patterns.map(() => ({ ...DITHER_DEFAULTS })))

  const activeIndex = Math.max(0, patterns.findIndex((p) => p.id === activeId))

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vertShader,
    fragmentShader: fragShader,
    uniforms: {
      uScene: { value: pipeline[0].target.texture },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uPixelScale: { value: DITHER_DEFAULTS.pixelScale },
      uLevels: { value: DITHER_DEFAULTS.levels },
      uMatrixSize: { value: DITHER_DEFAULTS.matrixSize },
      uMono: { value: DITHER_DEFAULTS.mono },
      uContrast: { value: DITHER_DEFAULTS.contrast },
      uBrightness: { value: DITHER_DEFAULTS.brightness },
      uEnabled: { value: DITHER_DEFAULTS.enabled },
    },
    depthTest: false,
    depthWrite: false,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [pipeline])

  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    material.uniforms.uResolution.value.set(size.width, size.height)
  }, [material, size.width, size.height])

  useEffect(() => {
    if (!sheet) return
    const unsubscribes = patterns.map((pattern, i) => {
      const obj = sheet.object(`${pattern.id} / Dither`, {
        enabled: t.boolean(true),
        pixelScale: t.number(DITHER_DEFAULTS.pixelScale, { range: [1, 8], nudgeMultiplier: 1 }),
        levels: t.number(DITHER_DEFAULTS.levels, { range: [2, 8], nudgeMultiplier: 1 }),
        matrixSize: t.stringLiteral('4', { '4': '4x4', '8': '8x8' }, { as: 'menu' }),
        mono: t.boolean(true),
        contrast: t.number(DITHER_DEFAULTS.contrast, { range: [0, 4], nudgeMultiplier: 0.01 }),
        brightness: t.number(DITHER_DEFAULTS.brightness, { range: [-1, 1], nudgeMultiplier: 0.01 }),
      }, { reconfigure: true })

      return obj.onValuesChange((v) => {
        ditherParams.current[i] = {
          enabled: v.enabled ? 1 : 0,
          pixelScale: Math.max(v.pixelScale, 1),
          levels: v.levels,
          matrixSize: Number(v.matrixSize),
          mono: v.mono ? 1 : 0,
          contrast: v.contrast,
          brightness: v.brightness,
        }
      })
    })

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [sheet])

  useFrame(({ gl }) => {
    for (let i = 0; i < pipeline.length; i++) {
      const { scene, target } = pipeline[i]
      gl.setRenderTarget(target)
      console.log(cameraRefs[i].current)
      gl.render(scene, cameraRefs[i].current ?? rootCamera)
    }
    gl.setRenderTarget(null)

    const u = material.uniforms
    u.uScene.value = pipeline[activeIndex].target.texture

    const d = ditherParams.current[activeIndex]
    u.uEnabled.value = d.enabled
    u.uPixelScale.value = d.pixelScale
    u.uLevels.value = d.levels
    u.uMatrixSize.value = d.matrixSize
    u.uMono.value = d.mono
    u.uContrast.value = d.contrast
    u.uBrightness.value = d.brightness
  })

  return (
    <>
      {patterns.map((pattern, i) => (
        <Fragment key={pattern.id}>
          {createPortal(
            <pattern.Component cameraRef={cameraRefs[i]} />,
            pipeline[i].scene,
            { camera: cameraRefs[i].current ?? rootCamera },
          )}
        </Fragment>
      ))}
      {studioEnabled && sheet && (
        <Fragment key={`studio-${activeId}`}>
          {createPortal(<SheetProvider sheet={sheet}>{null}</SheetProvider>, pipeline[activeIndex].scene)}
        </Fragment>
      )}
      <mesh frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
        <primitive object={material} attach="material" />
      </mesh>
    </>
  )
}

export default PipelineRenderer
