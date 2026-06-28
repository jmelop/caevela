import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { viewRef } from '../overlay/viewRef'

/** Publishes the live camera + viewport size to viewRef for the DOM overlay. */
export function CameraBridge() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  useEffect(() => {
    viewRef.camera = camera
    return () => {
      if (viewRef.camera === camera) viewRef.camera = null
    }
  }, [camera])

  useEffect(() => {
    viewRef.width = size.width
    viewRef.height = size.height
  }, [size])

  return null
}
