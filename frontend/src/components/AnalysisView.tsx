import { useState, useRef, useEffect } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useTambo, useTamboCurrentComponent } from '@tambo-ai/react'
import AnalysisLayout from '@/components/visualizations/AnalysisLayout'
import MessageThread from '@/components/MessageThread'
import './AnalysisView.css'

/**
 * AnalysisView - Displays Tambo-rendered visualization and message history
 * Uses Tambo SDK for generative UI orchestration
 */
function AnalysisView() {
  const { state, setCurrentComponent, setError, addMessage } = useAnalysis()
  const { chat } = useTambo()
  const { component: tamboComponent } = useTamboCurrentComponent()
  const [userInput, setUserInput] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debug logging
  useEffect(() => {
    console.log('[AnalysisView] tamboComponent changed:', tamboComponent)
  }, [tamboComponent])

  // Sync Tambo component to our local state context
  useEffect(() => {
    if (tamboComponent) {
      console.log('[AnalysisView] Setting current component from Tambo:', tamboComponent)
      setCurrentComponent(tamboComponent)
      setIsWaiting(false)
    }
  }, [tamboComponent, setCurrentComponent])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messageHistory])

  // Initialize chat with backend data if not already done
  // We use a ref to track if we've initialized to avoid double-sending
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Only initialize if we have backend data and haven't done so yet
    if (!hasInitialized.current && state.backendJson) {
      console.log('[AnalysisView] Initializing analysis with backend data')
      hasInitialized.current = true

      const initialContext = `You are a Generative UI assistant analyzing a Git repository.
      
Repository: ${state.repoUrl}
Initial Query: ${state.query}
Backend Analysis: ${JSON.stringify(state.backendJson, null, 2)}

CRITICAL INSTRUCTION: You MUST select and render one of the available visualization components (DependencyGraph, FunctionExplorer, ExecutionFlowView) to help the user understand the repository. Do NOT provide a text-only response. ALWAYS render a component that best fits the query or provides a good overview.`

      // Determine the prompt to send
      const prompt = state.query
        ? `User Initial Query: ${state.query}`
        : "Please show a high-level overview of the repository structure and execution flow using the most appropriate visualization."

      console.log('[AnalysisView] Sending initial prompt:', prompt)
      setIsWaiting(true)

      // Send the initial context + prompt to Tambo
      chat.send({
        role: 'user',
        content: `${initialContext}\n\n${prompt}`
      })
        .then(() => {
          console.log('[AnalysisView] Initial chat send completed')
          // If chat completes but no component selected (text response only), we stop waiting
          // Ideally Tambo follows instructions and picks a component, which triggers the other useEffect
          setIsWaiting(false)
        })
        .catch(err => {
          console.error("[AnalysisView] Failed to send initial query:", err)
          setError("Failed to start analysis. Please try sending a message.")
          setIsWaiting(false)
        })
    }
  }, [state.backendJson, state.repoUrl, state.query, chat, setError])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    setIsWaiting(true)
    setError(null)

    try {
      // Add user message to local history
      const userMessage = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: userInput,
        timestamp: new Date(),
      }
      addMessage(userMessage)
      setUserInput('')

      await chat.send({
        role: 'user',
        content: userInput
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
          {state.isLoading || isWaiting ? (
            <div className="analysis-view-loading">
              <div className="analysis-loading-spinner"></div>
              <p>{isWaiting ? 'Generating visualization...' : 'Analyzing repository...'}</p>
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
            // Fallback if analysis is done but no component - e.g. text only response
            // But we forced component in prompt, so this should ideally not happen
            <div className="analysis-view-empty">
              <p>Analysis complete. Ask a question to visualize specific parts.</p>
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
