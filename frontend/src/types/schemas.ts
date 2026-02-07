import { z } from 'zod'

/**
 * Backend Analysis JSON Structure
 * This is what the FastAPI /analyze endpoint returns
 */
export const BackendAnalysisSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.object({
    repository_name: z.string(),
    repository_url: z.string(),
    language: z.string(),
    total_files: z.number(),
    files: z.array(
      z.object({
        path: z.string(),
        language: z.string(),
        size: z.number(),
        content: z.string().optional(),
      })
    ),
    functions: z.array(
      z.object({
        file_path: z.string(),
        name: z.string(),
        signature: z.string(),
        docstring: z.string().optional(),
        line_start: z.number(),
        line_end: z.number(),
      })
    ),
    dependencies: z.array(
      z.object({
        source_file: z.string(),
        target_file: z.string(),
        import_type: z.enum(['relative', 'absolute', 'external']),
        import_name: z.string(),
      })
    ),
    external_libraries: z.array(
      z.object({
        name: z.string(),
        version: z.string().optional(),
        used_in_files: z.array(z.string()),
      })
    ),
  }),
})

export type BackendAnalysis = z.infer<typeof BackendAnalysisSchema>

/**
 * ============================================
 * DEPENDENCY GRAPH COMPONENT PROPS
 * ============================================
 * Renders file-to-file dependencies as a graph
 * Nodes = files, Edges = imports/dependencies
 */

export const DependencyGraphNodeSchema = z.object({
  id: z.string(), // file path
  label: z.string(), // file name or path
  language: z.string(),
  size: z.number(),
})

export const DependencyGraphEdgeSchema = z.object({
  source: z.string(), // source file path
  target: z.string(), // target file path
  importType: z.enum(['relative', 'absolute', 'external']),
  importName: z.string(),
})

export const DependencyGraphPropsSchema = z.object({
  nodes: z.array(DependencyGraphNodeSchema),
  edges: z.array(DependencyGraphEdgeSchema),
  title: z.string().optional().default('Dependency Graph'),
  description: z.string().optional(),
  focusedFile: z.string().optional(),
  highlightedDependencies: z.array(z.string()).optional(),
})

export type DependencyGraphNode = z.infer<typeof DependencyGraphNodeSchema>
export type DependencyGraphEdge = z.infer<typeof DependencyGraphEdgeSchema>
export type DependencyGraphProps = z.infer<typeof DependencyGraphPropsSchema>

/**
 * ============================================
 * FUNCTION EXPLORER COMPONENT PROPS
 * ============================================
 * Allows users to select a file and explore
 * the functions defined within it
 */

export const FunctionSchema = z.object({
  name: z.string(),
  signature: z.string(),
  docstring: z.string().optional(),
  lineStart: z.number(),
  lineEnd: z.number(),
  language: z.string(),
})

export const FileWithFunctionsSchema = z.object({
  filePath: z.string(),
  fileName: z.string(),
  language: z.string(),
  size: z.number(),
  content: z.string().optional(),
  functions: z.array(FunctionSchema),
})

export const FunctionExplorerPropsSchema = z.object({
  files: z.array(FileWithFunctionsSchema),
  selectedFilePath: z.string().optional(),
  title: z.string().optional().default('Function Explorer'),
  description: z.string().optional(),
  highlightedFunction: z.string().optional(), // function name
})

export type Function = z.infer<typeof FunctionSchema>
export type FileWithFunctions = z.infer<typeof FileWithFunctionsSchema>
export type FunctionExplorerProps = z.infer<typeof FunctionExplorerPropsSchema>

/**
 * ============================================
 * EXECUTION FLOW VIEW COMPONENT PROPS
 * ============================================
 * High-level visualization of how the repo
 * executes or how data flows across layers
 * (frontend → API → backend)
 */

export const ExecutionLayerSchema = z.object({
  name: z.string(), // e.g., "Frontend", "API", "Backend"
  description: z.string().optional(),
  files: z.array(z.string()), // file paths in this layer
  color: z.string().optional(), // hex color for visualization
})

export const ExecutionFlowSchema = z.object({
  source: z.string(), // layer name
  target: z.string(), // layer name
  description: z.string().optional(),
  weight: z.number().optional().default(1), // thickness/importance
})

export const ExecutionFlowViewPropsSchema = z.object({
  layers: z.array(ExecutionLayerSchema),
  flows: z.array(ExecutionFlowSchema),
  title: z.string().optional().default('Execution Flow'),
  description: z.string().optional(),
  focusedLayer: z.string().optional(),
})

export type ExecutionLayer = z.infer<typeof ExecutionLayerSchema>
export type ExecutionFlow = z.infer<typeof ExecutionFlowSchema>
export type ExecutionFlowViewProps = z.infer<typeof ExecutionFlowViewPropsSchema>

/**
 * ============================================
 * UNION TYPE FOR ALL POSSIBLE COMPONENTS
 * ============================================
 * Tambo will render one of these
 */

export type VisualizationComponentProps =
  | DependencyGraphProps
  | FunctionExplorerProps
  | ExecutionFlowViewProps

export const VisualizationComponentName = z.enum([
  'DependencyGraph',
  'FunctionExplorer',
  'ExecutionFlowView',
])

export type VisualizationComponentName = z.infer<
  typeof VisualizationComponentName
>

/**
 * ============================================
 * COMPONENT METADATA (for Tambo registration)
 * ============================================
 */

export const ComponentMetadataSchema = z.object({
  name: VisualizationComponentName,
  description: z.string(),
  schema: z.any(), // Zod schema for validation
})

export const COMPONENT_METADATA: Record<
  VisualizationComponentName,
  {
    description: string
    schema: z.ZodSchema
  }
> = {
  DependencyGraph: {
    description:
      'Visualizes file-to-file dependencies as a graph. Shows which files import or depend on each other. Use this when exploring code structure and dependencies.',
    schema: DependencyGraphPropsSchema,
  },
  FunctionExplorer: {
    description:
      'Allows exploring functions and methods defined in files. Select a file to see all functions, their signatures, docstrings, and line numbers. Use this for understanding specific file implementations.',
    schema: FunctionExplorerPropsSchema,
  },
  ExecutionFlowView: {
    description:
      'Shows how the repository is organized in layers (e.g., Frontend, API, Backend) and how data/execution flows between them. Use this for high-level architecture understanding.',
    schema: ExecutionFlowViewPropsSchema,
  },
}

/**
 * ============================================
 * VALIDATION HELPERS
 * ============================================
 */

export function validateBackendAnalysis(
  data: unknown
): BackendAnalysis {
  return BackendAnalysisSchema.parse(data)
}

export function validateComponentProps(
  componentName: VisualizationComponentName,
  props: unknown
): VisualizationComponentProps {
  const schema = COMPONENT_METADATA[componentName].schema
  return schema.parse(props) as VisualizationComponentProps
}

export function safeValidateComponentProps(
  componentName: VisualizationComponentName,
  props: unknown
):
  | { success: true; data: VisualizationComponentProps }
  | { success: false; error: string } {
  try {
    const schema = COMPONENT_METADATA[componentName].schema
    const validated = schema.parse(props) as VisualizationComponentProps
    return { success: true, data: validated }
  } catch (error) {
    let message = 'Unknown error'
    if (error instanceof z.ZodError) {
      message = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')
    } else if (error instanceof Error) {
      message = error.message
    }
    return { success: false, error: message }
  }
}
