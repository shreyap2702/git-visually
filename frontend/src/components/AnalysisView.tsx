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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messageHistory, thread?.messages])

  // Initialize chat with backend data if not already done
  // We use a ref to track if we've initialized to avoid double-sending
  const hasInitialized = useRef(false)

  // Helper for smart truncation to preserve JSON structure
  const smartTruncate = (obj: any, maxStringLen = 500, maxArrayLen = 50): any => {
    if (typeof obj === 'string') {
      return obj.length > maxStringLen ? obj.substring(0, maxStringLen) + '...[TRUNCATED]' : obj
    }
    if (Array.isArray(obj)) {
      const truncated = obj.slice(0, maxArrayLen).map(item => smartTruncate(item, maxStringLen, maxArrayLen))
      if (obj.length > maxArrayLen) {
        truncated.push(`...[${obj.length - maxArrayLen} more items]`)
      }
      return truncated
    }
    if (typeof obj === 'object' && obj !== null) {
      const newObj: any = {}
      for (const key in obj) {
        newObj[key] = smartTruncate(obj[key], maxStringLen, maxArrayLen)
      }
      return newObj
    }
    return obj
  }

  useEffect(() => {
    // Only initialize if we have backend data and haven't done so yet
    if (!hasInitialized.current && state.backendJson && sendThreadMessage) {
      console.log('[AnalysisView] Initializing analysis with backend data')
      hasInitialized.current = true

      // Smart truncate the backend JSON to prevent context window issues while keeping structure
      const truncatedObj = smartTruncate(state.backendJson)
      const truncatedJson = JSON.stringify(truncatedObj, null, 2)

      const initialContext = `You are a Generative UI assistant analyzing a Git repository.
      
Repository: ${state.repoUrl}
Initial Query: ${state.query}
Backend Analysis: ${truncatedJson}

CRITICAL INSTRUCTION: You MUST select and render one of the available visualization components to help the user understand the repository.

AVAILABLE COMPONENTS:

1. DependencyGraph
   - Use for: Visualizing file dependencies, architectural structure, or module relationships.
   - Props:
     - nodes: { 
         id: string, 
         label: string, 
         language: string, 
         type: 'file',
         lines?: number,
         functionCount?: number,
         dependencyCount?: number,
         externalLibs?: string[]
       }[]
     - edges: { source: string, target: string, type: 'import' | 'require' | 'internal' }[]

2. FunctionExplorer
   - Use for: Deep diving into a specific file, exploring methods, classes, and code logic.
   - Props:
     - filePath: string
     - fileName: string
     - language: string
     - functions: { name: string, signature: string, startLine: number, endLine: number, code: string }[]

3. ExecutionFlowView
   - Use for: Showing high-level data flow between system layers (e.g., Frontend -> API -> Database).
   - Props:
     - layers: { id: string, name: string, files: string[] }[]
     - flows: { from: string, to: string, label: string }[]

USAGE:
- Analyze the "Backend Analysis" JSON to extract relevant data.
- Choose the component that best fits the user's intent or provides the best overview.
- Populate the component props using data from the backend analysis.
- **IMPORTANT**: If explicit dependency edges are not listed in the JSON, you MUST INFER them from file imports, requires, or usages described in the analysis.
- Do NOT make up data that isn't supported by the analysis (e.g., don't invent files), but DO infer relationships.
- ALWAYS render a graphical component if possible.`

      // Determine the prompt to send
      const prompt = state.query
        ? `User Initial Query: ${state.query}`
        : "Please show a high-level overview of the repository structure and execution flow using the most appropriate visualization."

      const fullMessage = `${initialContext}\n\n${prompt}`
      console.log('[AnalysisView] Sending initial prompt:', prompt)
      setIsWaiting(true)

      // Send initial message with retry logic
      const sendInitialMessage = async (attemptsLeft = 1) => {
        try {
          await sendThreadMessage(fullMessage, { streamResponse: true })
          console.log('[AnalysisView] Initial message send completed')
          setIsWaiting(false)
        } catch (err) {
          console.warn(`[AnalysisView] Initial message failed, attempts left: ${attemptsLeft}`, err)
          if (attemptsLeft > 0) {
            setTimeout(() => sendInitialMessage(attemptsLeft - 1), 2000)
          } else {
            console.error("[AnalysisView] Failed to send initial query after retries:", err)
            // Extract useful error message
            const msg = err instanceof Error ? err.message : String(err)
            // If it's a 500/internal error, suggest retrying manually
            setError(`Failed to start analysis: ${msg}. Please try sending a message manually.`)
            setIsWaiting(false)
          }
        }
      }

      sendInitialMessage()
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
          {showLoading && (
            <div className="analysis-view-loading">
              <div className="analysis-loading-spinner"></div>
              <p>{isGenerating ? 'Generating visualization...' : isWaiting ? 'Processing...' : 'Analyzing repository...'}</p>
            </div>
          )}

          {!showLoading && (state.error || generationError) && (
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
          )}

          {!showLoading && !(state.error || generationError) && latestRenderedComponent && (
            <div className="analysis-layout">
              {latestRenderedComponent}
            </div>
          )}

          {!showLoading && !(state.error || generationError) && !latestRenderedComponent && (
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
