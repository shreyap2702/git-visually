import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import { TamboProvider } from '@/providers/TamboProvider'
import { AnalysisProvider } from '@/contexts/AnalysisContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TamboProvider>
      <AnalysisProvider>
        <App />
      </AnalysisProvider>
    </TamboProvider>
  </React.StrictMode>,
)
