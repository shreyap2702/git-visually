import { useState, useRef, useEffect } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useTamboConfig } from '@/providers/TamboProvider'
import { useComponentRegistry } from '@/hooks/useComponentRegistry'
import AnalysisLayout from '@/components/visualizations/AnalysisLayout'
import MessageThread from '@/components/MessageThread'
import './AnalysisView.css'

/**
 * AnalysisView - Displays Tambo-rendered visualization and message history
 * Shows loading state while waiting for Tambo, then renders selected component
 */
function AnalysisView() {
  const { state, setCurrentComponent, setError, addMessage } = useAnalysis()
  const { apiKey, model } = useTamboConfig()
  const { registry } = useComponentRegistry()
  const [userInput, setUserInput] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messageHistory])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    setIsWaiting(true)
    setError(null)

    try {
      // Add user message to history
      const userMessage = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: userInput,
        timestamp: new Date(),
      }
      addMessage(userMessage)
      setUserInput('')

      // Call Tambo API with context
      const response = await fetch('https://api.tambo-ai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: `You are analyzing a Git repository. 
              
Repository: ${state.repoUrl}
Initial Query: ${state.query}
Backend Analysis: ${JSON.stringify(state.backendJson, null, 2)}

Follow-up Query: ${userInput}

Based on this repository analysis, decide which visualization would be most helpful:
1. DependencyGraph - for file dependencies
2. FunctionExplorer - for code functions within files
3. ExecutionFlowView - for data flow between system layers

Respond with a JSON object:
{
  "componentType": "DependencyGraph" | "FunctionExplorer" | "ExecutionFlowView",
  "props": { ... },
  "reasoning": "explanation"
}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`Tambo API error: ${response.statusText}`)
      }

      const data = await response.json()
      const contentStr = data.choices?.[0]?.message?.content || ''

      // Parse JSON from response
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid response format from Tambo')
      }

      const decision = JSON.parse(jsonMatch[0])

      // Validate component exists
      if (!registry[decision.componentType as keyof typeof registry]) {
        throw new Error(`Unknown component: ${decision.componentType}`)
      }

      // Create rendered component
      const renderedComponent = {
        type: decision.componentType,
        props: decision.props,
      }

      // Validate props
      const componentInfo = registry[decision.componentType as keyof typeof registry]
      try {
        componentInfo.schema.parse(decision.props)
      } catch (validationError) {
        console.warn('Component props validation warning:', validationError)
        // Don't fail, just warn - component will handle it
      }

      // Update state
      setCurrentComponent(renderedComponent as any)
      addMessage({
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: decision.reasoning,
        component: renderedComponent as any,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process query'
      setError(errorMessage)
      console.error('Error in AnalysisView:', error)
    } finally {
      setIsWaiting(false)
    }
  }

  return (
    <div className="analysis-view">
      <div className="analysis-view-container">
        {/* Main Content Area */}
        <div className="analysis-view-main">
          {state.isLoading ? (
            <div className="analysis-view-loading">
              <div className="analysis-loading-spinner"></div>
              <p>Analyzing repository...</p>
            </div>
          ) : state.error ? (
            <div className="analysis-view-error">
              <h3>Error</h3>
              <p>{state.error}</p>
              <button
                onClick={() => setError(null)}
                className="analysis-error-retry"
              >
                Dismiss
              </button>
            </div>
          ) : state.currentComponent ? (
            <AnalysisLayout component={state.currentComponent} />
          ) : (
            <div className="analysis-view-empty">
              <p>Enter a query to get started exploring this repository</p>
            </div>
          )}
        </div>

        {/* Sidebar: Messages & Input */}
        <div className="analysis-view-sidebar">
          <div className="analysis-view-header">
            <h2>Explore Repository</h2>
            <p className="analysis-repo-path">{state.repoUrl}</p>
          </div>

          <MessageThread messages={state.messageHistory} />
          <div ref={messagesEndRef} />

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="analysis-input-form">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask about the repository..."
              className="analysis-input-textarea"
              disabled={isWaiting}
            />
            <button
              type="submit"
              className="analysis-submit-button"
              disabled={isWaiting || !userInput.trim()}
            >
              {isWaiting ? 'Thinking...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AnalysisView
