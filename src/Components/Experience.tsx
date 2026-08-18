import { Canvas } from '@react-three/fiber'
import { SheetProvider } from '@theatre/r3f'
import { types as t } from '@theatre/core'
import { useEffect, useState } from 'react'

import { mainSheet, studioEnabled } from '../theatre/sheet'
import PipelineRenderer from './Utils/PipelineRenderer'
import { patterns } from '../patterns/registry'

if (studioEnabled) {
  Promise.all([
    import('@theatre/studio'),
    import('@theatre/r3f/dist/extension'),
  ]).then(([studioModule, extensionModule]) => {
    const exported = studioModule.default as typeof studioModule.default & {
      default?: typeof studioModule.default
    }
    const studio = typeof exported.initialize === 'function' ? exported : exported.default

    studio?.initialize()
    studio?.extend(extensionModule.default)
  })
}

const PATTERN_OPTIONS = Object.fromEntries(patterns.map((p) => [p.id, p.id]))

const Experience = () => {
  const [patternId, setPatternId] = useState(patterns[0].id)

  useEffect(() => {
    const obj = mainSheet.object('Scene', {
      pattern: t.stringLiteral(patterns[0].id, PATTERN_OPTIONS, { as: 'menu' }),
    }, { reconfigure: true })

    return obj.onValuesChange((v) => setPatternId(v.pattern))
  }, [])

  return (
    <Canvas gl={{ antialias: false, preserveDrawingBuffer: true }} dpr={1}>
      <SheetProvider sheet={mainSheet}>
        <PipelineRenderer activeId={patternId} />
      </SheetProvider>
    </Canvas>
  )
}

export default Experience
