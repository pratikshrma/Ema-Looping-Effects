import { useControls } from 'leva'
import { useEffect, useMemo } from 'react'
import { DitherEffect } from './DitherEffect'

export function Dither() {
  const effect = useMemo(() => new DitherEffect(), [])

  const params = useControls('dither', {
    dither: { value: true, label: 'enabled' },
    pixelScale: { value: 2, min: 1, max: 8, step: 1 },
    levels: { value: 5, min: 2, max: 8, step: 1 },
    matrixSize: { value: 4, options: { '4x4': 4, '8x8': 8 } },
    mono: { value: true },
    contrast: { value: 1.8, min: 0, max: 4, step: 0.01 },
    brightness: { value: 0.24, min: -1, max: 1, step: 0.01 },
  })

  useEffect(() => {
    effect.setParams({
      enabled: params.dither,
      pixelScale: params.pixelScale,
      levels: params.levels,
      matrixSize: params.matrixSize,
      mono: params.mono,
      contrast: params.contrast,
      brightness: params.brightness,
    })
  }, [effect, params])

  useEffect(() => () => effect.dispose(), [effect])

  return <primitive object={effect} dispose={null} />
}
