import React from 'react'
import ReactDOM from 'react-dom/client'
import { CustomProvider } from 'rsuite'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './index.css'
import 'rsuite/dist/rsuite.min.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
    >
      <CustomProvider>
        <App />
      </CustomProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
)