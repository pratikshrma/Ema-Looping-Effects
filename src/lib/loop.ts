import { useRef } from 'react'

export const TAU = Math.PI * 2

export function useTime() {
  const time = useRef(0)
  return (delta: number, speed: number) => (time.current += delta * speed)
}
