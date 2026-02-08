import { ReactNode } from 'react'
import { TamboProvider as TamboSDKProvider, TamboComponent } from '@tambo-ai/react'
import { COMPONENT_REGISTRY } from '@/hooks/useComponentRegistry'

interface TamboProviderProps {
  children: ReactNode
}

/**
 * TamboProvider - Makes Tambo configuration available throughout the app
 * Wraps the application with the official TamboSDKProvider and registers components.
 */
export function TamboProvider({ children }: TamboProviderProps) {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY
  // Use default model if not specified
  const model = import.meta.env.VITE_TAMBO_MODEL // Optional, SDK has defaults

  if (!apiKey) {
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

  // Map our registry to TamboComponent format
  const components: TamboComponent[] = Object.entries(COMPONENT_REGISTRY).map(([name, config]) => ({
    name,
    description: config.description,
    component: config.component,
    propsSchema: config.schema,
  }))

  return (
    <TamboSDKProvider
      apiKey={apiKey}
      components={components}
    // environment="production" // Optional: defaults to production
    // tamboUrl="https://api.tambo.ai" // Optional: defaults to official API
    >
      {children}
    </TamboSDKProvider>
  )
}

/**
 * Hook to access Tambo configuration
 * Deprecated: Use useTambo() from @tambo-ai/react instead
 */
export function useTamboConfig() {
  const apiKey = import.meta.env.VITE_TAMBO_API_KEY || ''
  const model = import.meta.env.VITE_TAMBO_MODEL || 'claude-3-5-sonnet'

  return {
    apiKey,
    model,
    isConfigured: !!apiKey
  }
}
