import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

const useRenderPipeline = ({ count }: { count: number }) => {
  const { size } = useThree()

  const renderTargets = useMemo(() => {
    return Array.from({ length: count }, () => ({
      scene: new THREE.Scene(),
      target: new THREE.WebGLRenderTarget(Math.floor(size.width), Math.floor(size.height), {
        samples: 8,
        type: THREE.HalfFloatType,
      }),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  useEffect(() => {
    const w = Math.floor(size.width)
    const h = Math.floor(size.height)
    renderTargets.forEach(({ target }) => target.setSize(w, h))
  }, [size.width, size.height, renderTargets])

  useEffect(() => () => renderTargets.forEach((each) => each.target.dispose()), [renderTargets])

  return renderTargets
}

export default useRenderPipeline
