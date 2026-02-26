/**
 * pow3r.control - Vite Configuration
 *
 * Purpose:
 * - Build tooling for the Omnimedia Orchestration Control Surface
 * - React + TypeScript + TailwindCSS + React Three Fiber
 *
 * Agent Instructions:
 * - Do NOT switch to Next.js (Guardian STRICT prohibition)
 * - TailwindCSS v4 uses @tailwindcss/vite plugin (no postcss config needed)
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'r3f': ['@react-three/fiber', '@react-three/drei'],
          'r3f-postprocessing': ['@react-three/postprocessing', 'postprocessing'],
          'd3': ['d3-force', 'd3-force-3d'],
          'zustand': ['zustand'],
        },
      },
    },
  },
})
