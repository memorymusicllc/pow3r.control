import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTheme } from './store/theme-store'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import App from './App'

try {
  initTheme()
} catch (e) {
  console.warn('[pow3r.control] Theme init failed, using defaults:', e)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={
        <div style={{ padding: 32, fontFamily: 'monospace', color: '#FF3D00', background: '#000' }}>
          <h1 style={{ fontSize: 16 }}>pow3r.control crashed</h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
            Reload the page. If the issue persists, check the browser console.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', background: '#111', border: '1px solid #333', color: '#00E5FF', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          >
            Reload
          </button>
        </div>
      }
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
