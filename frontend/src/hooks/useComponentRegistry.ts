import DependencyGraph from '@/components/visualizations/DependencyGraph'
import FunctionExplorer from '@/components/visualizations/FunctionExplorer'
import ExecutionFlowView from '@/components/visualizations/ExecutionFlowView'
import {
  DependencyGraphPropsSchema,
  FunctionExplorerPropsSchema,
  ExecutionFlowViewPropsSchema,
} from '@/types/componentSchemas'

/**
 * Registry of available components that Tambo can render
 * Each component is mapped to its Zod schema for validation
 */
export const COMPONENT_REGISTRY = {
  DependencyGraph: {
    component: DependencyGraph,
    schema: DependencyGraphPropsSchema,
    description: 'Visualizes file dependencies as an interactive force-directed graph',
  },
  FunctionExplorer: {
    component: FunctionExplorer,
    schema: FunctionExplorerPropsSchema,
    description: 'GitHub-themed interface for exploring functions within a file',
  },
  ExecutionFlowView: {
    component: ExecutionFlowView,
    schema: ExecutionFlowViewPropsSchema,
    description: 'High-level abstract visualization of data flows between system layers',
  },
} as const

export type ComponentName = keyof typeof COMPONENT_REGISTRY

/**
 * Hook to access the component registry
 * Returns the registered components and their metadata
 */
export function useComponentRegistry() {
  return {
    registry: COMPONENT_REGISTRY,
    getComponent: (name: ComponentName) => COMPONENT_REGISTRY[name],
    validateComponentProps: (name: ComponentName, props: unknown) => {
      const component = COMPONENT_REGISTRY[name]
      if (!component) {
        throw new Error(`Unknown component: ${name}`)
      }
      return component.schema.parse(props)
    },
  }
}
