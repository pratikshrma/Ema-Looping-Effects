import { BlendFunction, Effect } from 'postprocessing'
import { Uniform, Vector2 } from 'three'
import fragmentShader from './dither.frag?raw'

export type DitherParams = {
  enabled: boolean
  pixelScale: number
  levels: number
  matrixSize: number
  mono: boolean
  contrast: number
}

export class DitherEffect extends Effect {
  constructor() {
    super('DitherEffect', fragmentShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, Uniform>([
        ['uResolution', new Uniform(new Vector2(1, 1))],
        ['uPixelScale', new Uniform(1)],
        ['uLevels', new Uniform(4)],
        ['uMatrixSize', new Uniform(4)],
        ['uMono', new Uniform(0)],
        ['uContrast', new Uniform(1)],
        ['uEnabled', new Uniform(1)],
      ]),
    })
  }

  private uniform(name: string): Uniform {
    const found = this.uniforms.get(name)
    if (!found) throw new Error(`DitherEffect: unknown uniform "${name}"`)
    return found
  }

  setSize(width: number, height: number) {
    ;(this.uniform('uResolution').value as Vector2).set(width, height)
  }

  setParams({ enabled, pixelScale, levels, matrixSize, mono, contrast }: DitherParams) {
    this.uniform('uPixelScale').value = Math.max(pixelScale, 1)
    this.uniform('uLevels').value = levels
    this.uniform('uMatrixSize').value = matrixSize
    this.uniform('uMono').value = mono ? 1 : 0
    this.uniform('uContrast').value = contrast
    this.uniform('uEnabled').value = enabled ? 1 : 0
  }
}
