import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/app.css'
import './styles/global.css'
import './styles/splash.css'
import './styles/unlock.css'
// Legacy monolith files — still needed until all components are migrated to TS
import './ui.js'
import './main.js'
import './service-worker-registration.js'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<App />)
}
