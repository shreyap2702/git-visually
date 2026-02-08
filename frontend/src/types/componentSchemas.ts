import { z } from 'zod'

/**
 * Shared schema definitions for all visualization components.
 * These define the contract between backend JSON, Tambo, and UI components.
 */

// ============================================================================
// LANGUAGE COLOR MAPPING
// ============================================================================

export const LANGUAGE_COLORS: Record<string, string> = {
  // Web
  javascript: '#f7df1e',
  typescript: '#3178c6',
  jsx: '#61dafb',
  tsx: '#3178c6',
  html: '#e34c26',
  css: '#563d7c',
  scss: '#c6538c',

  // Python
  python: '#3776ab',

  // Java
  java: '#007396',
  kotlin: '#7f52ff',

  // C/C++/C#
  c: '#a8b9cc',
  cpp: '#00599c',
  'c++': '#00599c',
  csharp: '#239120',

  // Go
  go: '#00add8',

  // Rust
  rust: '#ce422b',

  // Ruby
  ruby: '#cc342d',

  // PHP
  php: '#777bb4',

  // Shell/Bash
  shell: '#4ee745',
  bash: '#4ee745',

  // Config/Data
  json: '#f7df1e',
  yaml: '#cb171e',
  toml: '#9c4221',
  xml: '#0078d4',

  // Default
  default: '#9a9a9a',
}

export const getLanguageColor = (language: string): string => {
  const lang = language.toLowerCase().trim()
  return LANGUAGE_COLORS[lang] || LANGUAGE_COLORS['default']
}

// ============================================================================
// DEPENDENCY GRAPH COMPONENT
// ============================================================================

export const DependencyGraphNodeSchema = z.object({
  id: z.string().describe('Unique identifier for the file (e.g., file path)'),
  label: z.string().describe('Display name (e.g., filename or relative path)'),
  filePath: z.string().describe('Full file path for reference'),
  language: z.string().describe('Programming language of the file'),
  type: z.enum(['file']).describe('Type of node (currently only "file")'),
  // Metadata for table and hover
  lines: z.number().optional().describe('Number of lines of code'),
  functionCount: z.number().optional().describe('Number of functions in the file'),
  dependencyCount: z.number().optional().describe('Number of imported dependencies'),
  externalLibs: z.array(z.string()).optional().describe('List of external libraries used'),
})

export const DependencyGraphEdgeSchema = z.object({
  source: z.string().describe('Source file ID'),
  target: z.string().describe('Target file ID'),
  type: z.enum(['import', 'require', 'internal']).describe('Type of dependency'),
})

export const DependencyGraphPropsSchema = z.object({
  nodes: z.array(DependencyGraphNodeSchema).describe('Array of file nodes'),
  edges: z.array(DependencyGraphEdgeSchema).describe('Array of dependency edges'),
  title: z.string().optional().describe('Optional title for the graph'),
  description: z.string().optional().describe('Optional description'),
}).strict()

export type DependencyGraphNode = z.infer<typeof DependencyGraphNodeSchema>
export type DependencyGraphEdge = z.infer<typeof DependencyGraphEdgeSchema>
export type DependencyGraphProps = z.infer<typeof DependencyGraphPropsSchema>

// ============================================================================
// FUNCTION EXPLORER COMPONENT
// ============================================================================

export const FunctionSchema = z.object({
  name: z.string().describe('Function/method name'),
  signature: z.string().describe('Function signature (e.g., "function add(a: number, b: number): number")'),
  startLine: z.number().describe('Line number where function starts'),
  endLine: z.number().describe('Line number where function ends'),
  code: z.string().describe('Full code snippet of the function'),
  description: z.string().optional().describe('Optional docstring or description'),
  params: z.array(z.object({
    name: z.string(),
    type: z.string().optional(),
    description: z.string().optional(),
  })).optional().describe('Function parameters'),
  returnType: z.string().optional().describe('Return type if applicable'),
})

export const FunctionExplorerPropsSchema = z.object({
  filePath: z.string().describe('Path of the file being explored'),
  fileName: z.string().describe('Display name of the file'),
  language: z.string().describe('Programming language of the file'),
  functions: z.array(FunctionSchema).describe('Array of functions in the file'),
  fileSize: z.number().optional().describe('File size in bytes'),
  totalLines: z.number().optional().describe('Total lines of code in file'),
}).strict()

export type Function = z.infer<typeof FunctionSchema>
export type FunctionExplorerProps = z.infer<typeof FunctionExplorerPropsSchema>

// ============================================================================
// EXECUTION FLOW VIEW COMPONENT
// ============================================================================

export const ExecutionLayerSchema = z.object({
  id: z.string().describe('Unique layer identifier'),
  name: z.string().describe('Layer name (e.g., "Frontend", "API", "Backend")'),
  description: z.string().optional().describe('Layer description'),
  files: z.array(z.string()).describe('File paths in this layer'),
  color: z.string().optional().describe('Optional color for layer visualization'),
})

export const ExecutionFlowSchema = z.object({
  from: z.string().describe('Source layer ID'),
  to: z.string().describe('Target layer ID'),
  label: z.string().optional().describe('Flow label (e.g., "API Call", "Database Query")'),
  description: z.string().optional().describe('Flow description'),
})

export const ExecutionFlowViewPropsSchema = z.object({
  layers: z.array(ExecutionLayerSchema).describe('Array of execution layers'),
  flows: z.array(ExecutionFlowSchema).describe('Array of data flows between layers'),
  title: z.string().optional().describe('Optional title'),
  description: z.string().optional().describe('Optional description'),
}).strict()

export type ExecutionLayer = z.infer<typeof ExecutionLayerSchema>
export type ExecutionFlow = z.infer<typeof ExecutionFlowSchema>
export type ExecutionFlowViewProps = z.infer<typeof ExecutionFlowViewPropsSchema>

// ============================================================================
// ANALYSIS LAYOUT (CONTAINER)
// ============================================================================

/**
 * Represents a rendered component from Tambo.
 * This is the structure that AnalysisLayout receives.
 */
export const RenderedComponentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('DependencyGraph'),
    props: DependencyGraphPropsSchema,
  }),
  z.object({
    type: z.literal('FunctionExplorer'),
    props: FunctionExplorerPropsSchema,
  }),
  z.object({
    type: z.literal('ExecutionFlowView'),
    props: ExecutionFlowViewPropsSchema,
  }),
])

export type RenderedComponent = z.infer<typeof RenderedComponentSchema>

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates that a component has the required props.
 * Returns true if valid, false otherwise.
 */
export function validateComponentProps(component: RenderedComponent): boolean {
  try {
    RenderedComponentSchema.parse(component)
    return true
  } catch {
    return false
  }
}

/**
 * Safe validation that returns errors for debugging.
 */
export function validateComponentPropsWithErrors(
  component: RenderedComponent
): { valid: boolean; errors?: string[] } {
  try {
    RenderedComponentSchema.parse(component)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`),
      }
    }
    return { valid: false, errors: ['Unknown validation error'] }
  }
}
