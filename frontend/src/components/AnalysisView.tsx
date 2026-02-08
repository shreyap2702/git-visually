import { useState, useRef, useEffect } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useTamboThread } from '@tambo-ai/react'
import MessageThread from '@/components/MessageThread'
import './AnalysisView.css'

/**
 * AnalysisView - Displays Tambo-rendered visualization and message history
 * Uses Tambo SDK for generative UI orchestration
 */
function AnalysisView() {
  const { state, setError, addMessage } = useAnalysis()
  const { thread, sendThreadMessage, isIdle } = useTamboThread()
  const [userInput, setUserInput] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get the latest assistant message with a rendered component
  const latestRenderedComponent = thread?.messages
    ?.filter(msg => msg.role === 'assistant' && msg.renderedComponent)
    ?.slice(-1)?.[0]?.renderedComponent

  // Timeout logic for generation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (isWaiting || (!isIdle && !latestRenderedComponent)) {
      timeoutId = setTimeout(() => {
        setGenerationError("Visualization generation timed out. The analysis might be too complex.")
        setIsWaiting(false)
      }, 45000) // 45 seconds timeout
    }

    return () => clearTimeout(timeoutId)
  }, [isWaiting, isIdle, latestRenderedComponent])

  // Debug logging
  useEffect(() => {
    console.log('[AnalysisView] thread changed:', thread)
    console.log('[AnalysisView] latestRenderedComponent:', latestRenderedComponent)
  }, [thread, latestRenderedComponent])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messageHistory, thread?.messages])

  // Initialize chat with backend data if not already done
  // We use a ref to track if we've initialized to avoid double-sending
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Only initialize if we have backend data and haven't done so yet
    if (!hasInitialized.current && state.backendJson && sendThreadMessage) {
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

      const fullMessage = `${initialContext}\n\n${prompt}`
      console.log('[AnalysisView] Sending initial prompt:', prompt)
      setIsWaiting(true)

      // Send the initial context + prompt to Tambo using sendThreadMessage
      sendThreadMessage(fullMessage, { streamResponse: true })
        .then(() => {
          console.log('[AnalysisView] Initial message send completed')
          setIsWaiting(false)
        })
        .catch(err => {
          console.error("[AnalysisView] Failed to send initial query:", err)
          setError("Failed to start analysis. Please try sending a message.")
          setIsWaiting(false)
        })
    }
  }, [state.backendJson, state.repoUrl, state.query, sendThreadMessage, setError])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim() || !sendThreadMessage) return

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
      const messageToSend = userInput
      setUserInput('')

      await sendThreadMessage(messageToSend, { streamResponse: true })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process query'
      setError(errorMessage)
      console.error('Error in AnalysisView:', error)
    } finally {
      setIsWaiting(false)
    }
  }

  // Determine loading state
  // isIdle is true when not generating, so !isIdle means generation in progress
  const isGenerating = !isIdle
  const showLoading = (state.isLoading || isWaiting || isGenerating) && !generationError

  return (
    <div className="analysis-view">
      <div className="analysis-view-container">
        {/* Main Content Area */}
        <div className="analysis-view-main">
          {showLoading ? (
            <div className="analysis-view-loading">
              <div className="analysis-loading-spinner"></div>
              <p>{isGenerating ? 'Generating visualization...' : isWaiting ? 'Processing...' : 'Analyzing repository...'}</p>
            </div>
          ) : (state.error || generationError) ? (
            <div className="analysis-view-error">
              <h3>Error</h3>
              <p>{state.error || generationError}</p>
              <button
                onClick={() => { setError(null); setGenerationError(null); }}
                className="analysis-error-retry"
              >
                Dismiss
              </button>
            </div>
          ) : latestRenderedComponent ? (
            // Tambo returns a pre-rendered React element, just render it directly
            <div className="analysis-layout">
              {latestRenderedComponent}
            </div>
          ) : (
            // Fallback if analysis is done but no component - e.g. text only response
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
              disabled={showLoading}
            />
            <button
              type="submit"
              className="analysis-submit-button"
              disabled={showLoading || !userInput.trim()}
            >
              {showLoading ? 'Thinking...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AnalysisView
