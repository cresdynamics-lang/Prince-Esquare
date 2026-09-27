import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

const toastOptions = {
  duration: 4000,
  style: {
    background: '#2b3b55',
    color: '#f9f1de',
    border: '1px solid rgba(197, 138, 61, 0.25)',
    fontSize: '13px',
    fontWeight: 600,
  },
  success: { iconTheme: { primary: '#c58a3d', secondary: '#2b3b55' } },
  error: { iconTheme: { primary: '#f87171', secondary: '#2b3b55' } },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={toastOptions} />
  </StrictMode>,
)

/** Register device cache SW after first paint — never blocks LCP */
function registerDeviceCache() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(register, { timeout: 4000 })
  } else {
    window.addEventListener('load', () => setTimeout(register, 1200))
  }
}
registerDeviceCache()
