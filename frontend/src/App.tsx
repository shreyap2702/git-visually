import { useState } from 'react'
import './App.css'
import Hero from '@/components/Hero'
import RepoInput from '@/components/RepoInput'
import HowItWorks from '@/components/HowItWorks'
import AnalysisView from '@/components/AnalysisView'
import { useAnalysis } from '@/contexts/AnalysisContext'

function App() {
  const { state } = useAnalysis()
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Show analysis view if repo data is loaded
  if (showAnalysis && state.backendJson) {
    return (
      <div className="app">
        <AnalysisView />
        <button
          className="app-back-button"
          onClick={() => setShowAnalysis(false)}
          title="Go back to landing page"
        >
          ← New Analysis
        </button>
      </div>
    )
  }

  return (
    <div className="app">
      <Hero />
      <RepoInput onAnalysisComplete={() => setShowAnalysis(true)} />
      <HowItWorks />
    </div>
  )
}

export default App
