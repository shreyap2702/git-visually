import { useState } from 'react'
import './RepoInput.css'

function RepoInput() {
  const [repoUrl, setRepoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!repoUrl.trim()) return

    setIsLoading(true)

    // TODO: Connect to backend API
    console.log('Submitting:', { repoUrl, description })

    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
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
