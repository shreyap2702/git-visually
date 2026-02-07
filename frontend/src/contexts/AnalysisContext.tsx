import { ReactNode, createContext, useContext, useState, useCallback } from 'react'
import { RenderedComponent } from '@/types/componentSchemas'

export interface AnalysisState {
  repoUrl: string
  query: string
  backendJson: unknown // The raw JSON from backend /analyze endpoint
  currentComponent: RenderedComponent | null
  isLoading: boolean
  error: string | null
  messageHistory: Message[]
}

export interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  component?: RenderedComponent
  timestamp: Date
}

interface AnalysisContextType {
  state: AnalysisState
  setRepoData: (repoUrl: string, query: string, backendJson: unknown) => void
  setCurrentComponent: (component: RenderedComponent | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addMessage: (message: Message) => void
  reset: () => void
}

const initialState: AnalysisState = {
  repoUrl: '',
  query: '',
  backendJson: null,
  currentComponent: null,
  isLoading: false,
  error: null,
  messageHistory: [],
}

const AnalysisContext = createContext<AnalysisContextType | null>(null)

interface AnalysisProviderProps {
  children: ReactNode
}

/**
 * AnalysisProvider - Manages analysis state across the app
 * Stores repo data, current visualization, messages, and error state
 */
export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const [state, setState] = useState<AnalysisState>(initialState)

  const setRepoData = useCallback((repoUrl: string, query: string, backendJson: unknown) => {
    setState((prev) => ({
      ...prev,
      repoUrl,
      query,
      backendJson,
    }))
  }, [])

  const setCurrentComponent = useCallback((component: RenderedComponent | null) => {
    setState((prev) => ({
      ...prev,
      currentComponent: component,
    }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }))
  }, [])

  const addMessage = useCallback((message: Message) => {
    setState((prev) => ({
      ...prev,
      messageHistory: [...prev.messageHistory, message],
    }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return (
    <AnalysisContext.Provider
      value={{
        state,
        setRepoData,
        setCurrentComponent,
        setLoading,
        setError,
        addMessage,
        reset,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  )
}

/**
 * Hook to access analysis context
 */
export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider')
  }
  return context
}
