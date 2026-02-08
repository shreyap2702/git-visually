import { useState } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import './RepoInput.css'

// Backend returns this structure directly from /analyze endpoint
interface AnalysisResponse {
  repo_url: string
  user_intent: string
  analysis: unknown
}

interface RepoInputProps {
  onAnalysisComplete?: () => void
}

function RepoInput({ onAnalysisComplete }: RepoInputProps) {
  const { setRepoData, setError } = useAnalysis()
  const [repoUrl, setRepoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoadingLocal] = useState(false)
  const [error, setErrorLocal] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!repoUrl.trim()) return

    setIsLoadingLocal(true)
    setErrorLocal(null)
    setSuccess(false)

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

      const response = await fetch(`${apiBaseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          query: description || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data: AnalysisResponse = await response.json()

      // Log the response for validation
      console.log('✅ Analysis Response:', data)
      console.log('📊 Analysis Data:', data.analysis)

      // Store in analysis context - backend returns { repo_url, user_intent, analysis }
      setRepoData(repoUrl, description, data.analysis)
      setSuccess(true)

      // Reset form options
      setRepoUrl('')
      setDescription('')

      // Call completion callback immediately so parent can switch view
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      console.error('❌ Error:', errorMessage)
      setErrorLocal(errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoadingLocal(false)
    }
  }

  const isValid = repoUrl.trim().length > 0

  return (
    <section className="repo-input-section" id="repo-input">
      <div className="repo-input-card">
        <form onSubmit={handleSubmit}>
          <div className="repo-input-field-group">
            <label className="repo-input-label">Repository URL</label>
            <input
              type="text"
              className="repo-input-field"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="repo-input-field-group">
            <label className="repo-input-label">
              What would you like to see? (optional)
            </label>
            <textarea
              className="repo-input-textarea"
              placeholder="e.g., Data flow between components, Architecture overview, or leave blank for a general analysis"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="repo-input-error">
              {error}
            </div>
          )}

          {success && (
            <div className="repo-input-success">
              ✓ Repository analyzed successfully!
            </div>
          )}

          <button
            type="submit"
            className="repo-input-button"
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Repository'}
          </button>

          <p className="repo-input-hint">
            No account needed. Public repositories only.
          </p>
        </form>
      </div>
    </section>
  )
}

export default RepoInput
