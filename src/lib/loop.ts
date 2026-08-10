export const TAU = Math.PI * 2

let speed = 1

export const setLoopSpeed = (value: number) => {
  speed = value
}

export const loopState = { phase: 0 }

// Accumulates by delta rather than deriving from elapsed time, so changing
// speed or loopSeconds continues from the current phase instead of jumping.
export function advanceLoop(delta: number, loopSeconds: number) {
  const next = loopState.phase + (delta * speed) / Math.max(loopSeconds, 0.001)
  loopState.phase = next - Math.floor(next)
  return loopState.phase
}
