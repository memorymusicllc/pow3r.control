import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTheme } from './store/theme-store'
import './index.css'
import App from './App'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
