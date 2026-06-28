import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { lodRef } from '../scene/lod'

/**
 * Wraps the survey HUD and fades it out as the camera pulls back to galaxy scale
 * (the HUD is meaningless once the local survey is a speck). pointer-events stay
 * off on the wrapper so canvas drags pass through; interactive children re-enable
 * themselves. Fully removed past the fade so nothing invisible stays clickable.
 */
export function ChromeLayer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const el = ref.current
      if (el) {
        const fade = 1 - lodRef.t
        if (fade <= 0.04) {
          el.style.display = 'none'
        } else {
          el.style.display = 'block'
          el.style.opacity = fade.toFixed(3)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {children}
    </div>
  )
}
