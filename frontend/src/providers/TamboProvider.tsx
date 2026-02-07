import { ReactNode, createContext, useContext } from 'react'

interface TamboContextType {
  apiKey: string
  model: string
  isConfigured: boolean
}

const TamboContext = createContext<TamboContextType | null>(null)

interface TamboProviderProps {
  children: ReactNode
}

/**
 * TamboProvider - Makes Tambo configuration available throughout the app
 */
export function TamboProvider({ children }: TamboProviderProps) {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY || ''
  const model = import.meta.env.VITE_TAMBO_MODEL || 'claude-3-5-sonnet'
  const isConfigured = !!apiKey

  if (!isConfigured) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#ffffff',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'CooperLtBT, sans-serif', fontSize: '24px', color: '#2a2a2a' }}>
            Configuration Error
          </h1>
          <p style={{ color: '#6b6b6b', marginTop: '12px' }}>
            VITE_TAMBO_API_KEY is not configured. Please add it to your .env file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <TamboContext.Provider value={{ apiKey, model, isConfigured }}>
      {children}
    </TamboContext.Provider>
  )
}

/**
 * Hook to access Tambo configuration
 */
export function useTamboConfig() {
  const context = useContext(TamboContext)
  if (!context) {
    throw new Error('useTamboConfig must be used within TamboProvider')
  }
  return context
}
