/**
 * pow3r.control - Layout Mode Hook
 *
 * Purpose:
 * - Detects portrait vs landscape orientation
 * - Returns layout mode and breakpoint for responsive rendering
 * - Uses matchMedia for reliable orientation detection
 *
 * Agent Instructions:
 * - Portrait = bottom nav, landscape = left sidebar
 * - 'compact' = narrow screens (<640px width)
 */
import { useState, useEffect } from 'react'

export type Orientation = 'portrait' | 'landscape'
export type Breakpoint = 'compact' | 'regular' | 'wide'

export interface LayoutMode {
  orientation: Orientation
  breakpoint: Breakpoint
  isMobile: boolean
  width: number
  height: number
}

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(() => compute())

  useEffect(() => {
    function handleResize() {
      setMode(compute())
    }
    window.addEventListener('resize', handleResize)
    const mql = window.matchMedia('(orientation: portrait)')
    mql.addEventListener('change', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      mql.removeEventListener('change', handleResize)
    }
  }, [])

  return mode
}

function compute(): LayoutMode {
  const w = window.innerWidth
  const h = window.innerHeight
  const orientation: Orientation = h >= w ? 'portrait' : 'landscape'
  const breakpoint: Breakpoint = w < 640 ? 'compact' : w < 1024 ? 'regular' : 'wide'
  const isMobile = w < 768 || ('ontouchstart' in window && w < 1024)
  return { orientation, breakpoint, isMobile, width: w, height: h }
}
