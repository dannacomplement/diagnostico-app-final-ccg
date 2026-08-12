import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Nueva version disponible tras un deploy -> recargar sola, sin pedirle al usuario
// que cierre y reabra la app manualmente.
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload()
  },
})

// Si una ruta cargada de forma diferida (lazy) referencia un archivo que ya no
// existe por un deploy nuevo, recargar una vez en vez de dejar la pantalla en blanco.
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
