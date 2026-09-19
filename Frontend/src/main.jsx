import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './styles/themes.css'
import App from './App.jsx'
import './styles/mobile-first.css'
import './styles/mobile-hardening.css'
import './styles/header-simplification.css'
import GoogleMapProvider from './components/GooglePlaces/GoogleMapProvider'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <GoogleMapProvider>
          <App />
        </GoogleMapProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
