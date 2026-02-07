import { RenderedComponent } from '@/types/componentSchemas'
import DependencyGraph from './DependencyGraph'
import FunctionExplorer from './FunctionExplorer'
import ExecutionFlowView from './ExecutionFlowView'
import './AnalysisLayout.css'

interface AnalysisLayoutProps {
  component: RenderedComponent
}

/**
 * AnalysisLayout Component
 * Passive renderer that displays whichever component Tambo AI decides to render.
 * Routes to the appropriate visualization component based on the component type.
 */
function AnalysisLayout({ component }: AnalysisLayoutProps) {
  try {
    switch (component.type) {
      case 'DependencyGraph':
        return (
          <div className="analysis-layout">
            <DependencyGraph {...component.props} />
          </div>
        )

      case 'FunctionExplorer':
        return (
          <div className="analysis-layout">
            <FunctionExplorer {...component.props} />
          </div>
        )

      case 'ExecutionFlowView':
        return (
          <div className="analysis-layout">
            <ExecutionFlowView {...component.props} />
          </div>
        )

      default:
        const exhaustiveCheck: never = component
        return exhaustiveCheck
    }
  } catch (error) {
    console.error('Error rendering component:', error)
    return (
      <div className="analysis-layout analysis-layout-error">
        <div className="analysis-error-message">
          <h3>Error rendering component</h3>
          <p>{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        </div>
      </div>
    )
  }
}

export default AnalysisLayout
