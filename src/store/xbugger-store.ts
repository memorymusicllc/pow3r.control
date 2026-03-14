/**
 * pow3r.control - XBugger Global Loading Progress Store
 *
 * Purpose:
 * - Global loading progress for page/view transitions
 * - Full-width bar at top of page
 * - Used by App to show config load, view switches
 */
import { create } from 'zustand'

interface XBuggerState {
  progress: number
  label: string | null
  active: boolean
  setProgress: (progress: number, label?: string | null) => void
  setActive: (active: boolean) => void
  reset: () => void
}

export const useXBuggerStore = create<XBuggerState>((set) => ({
  progress: 0,
  label: null,
  active: false,
  setProgress: (progress, label) =>
    set({ progress: Math.min(100, Math.max(0, progress)), label: label ?? null, active: true }),
  setActive: (active) => set({ active }),
  reset: () => set({ progress: 0, label: null, active: false }),
}))
