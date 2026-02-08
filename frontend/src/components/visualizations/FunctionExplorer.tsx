import { useState, useMemo, useEffect } from 'react'
import './FunctionExplorer.css'
import { FunctionExplorerProps, getLanguageColor } from '@/types/componentSchemas'
import { useAnalysis } from '@/contexts/AnalysisContext'

/**
 * FunctionExplorer Component
 * GitHub-themed interface for browsing functions in a single file.
 * Allows switching between files if backend analysis data is available.
 */
function FunctionExplorer(props: FunctionExplorerProps) {
  const { state } = useAnalysis()
  const [selectedFunctionIndex, setSelectedFunctionIndex] = useState(0)

  // Local state to track which file is currently being viewed
  // Initialize with the file passed in props
  const [currentFile, setCurrentFile] = useState({
    filePath: props.filePath,
    fileName: props.fileName,
    language: props.language,
    functions: props.functions || [],
    totalLines: props.totalLines,
    fileSize: props.fileSize
  })

  // Effect to update current file if props change (e.g. from parent)
  useEffect(() => {
    setCurrentFile({
      filePath: props.filePath,
      fileName: props.fileName,
      language: props.language,
      functions: props.functions || [],
      totalLines: props.totalLines,
      fileSize: props.fileSize
    })
    setSelectedFunctionIndex(0)
  }, [props.filePath, props.functions])

  // Extract all available files from backendJson to populate dropdown
  const allFiles = useMemo(() => {
    if (!state.backendJson || typeof state.backendJson !== 'object') return []

    // Assume backendJson has a structure with 'files' array
    // based on the analysis context we saw earlier
    const json = state.backendJson as any
    if (Array.isArray(json.files)) {
      return json.files.filter((f: any) => f.filePath && Array.isArray(f.functions) && f.functions.length > 0)
    }

    // Fallback: If current file is not in list (or list is empty), return just current
    return []
  }, [state.backendJson])

  // Handle file selection change
  const handleFileChange = (filePath: string) => {
    const file = allFiles.find((f: any) => f.filePath === filePath)
    if (file) {
      setCurrentFile({
        filePath: file.filePath,
        fileName: file.fileName || file.filePath.split('/').pop(),
        language: file.language || 'Unknown',
        functions: file.functions || [],
        totalLines: file.totalLines,
        fileSize: file.fileSize
      })
      setSelectedFunctionIndex(0)
    }
  }

  const currentFunctions = currentFile.functions || []

  if (!currentFunctions || currentFunctions.length === 0) {
    return (
      <div className="function-explorer-empty">
        <p>No functions found in this file or insufficient data to visualize.</p>
      </div>
    )
  }

  const selectedFunction = currentFunctions[selectedFunctionIndex]
  const languageColor = getLanguageColor(currentFile.language || 'Unknown')

  return (
    <div className="function-explorer-container">
      <div className="function-explorer-header">
        <div className="function-explorer-file-info">
          <div className="function-explorer-header-top">
            <div className="function-explorer-file-path">{currentFile.filePath}</div>

            {/* File Selector Dropdown */}
            {allFiles.length > 1 && (
              <div className="function-explorer-file-selector">
                <select
                  value={currentFile.filePath}
                  onChange={(e) => handleFileChange(e.target.value)}
                  className="function-explorer-dropdown"
                >
                  {allFiles.map((file) => (
                    <option key={file.filePath} value={file.filePath}>
                      {file.filePath}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="function-explorer-file-meta">
            <span
              className="function-explorer-language-badge"
              style={{ borderColor: languageColor, color: languageColor }}
            >
              {currentFile.language}
            </span>
            {currentFile.totalLines && (
              <span className="function-explorer-meta-item">
                {currentFile.totalLines} lines
              </span>
            )}
            {currentFile.fileSize && (
              <span className="function-explorer-meta-item">
                {(currentFile.fileSize / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="function-explorer-content">
        {/* Sidebar with function list */}
        <div className="function-explorer-sidebar">
          <div className="function-explorer-list-header">
            <span className="function-explorer-list-title">Functions</span>
            <span className="function-explorer-list-count">{currentFunctions.length}</span>
          </div>
          <div className="function-explorer-list">
            {currentFunctions.map((func, index) => (
              <button
                key={index}
                className={`function-explorer-list-item ${index === selectedFunctionIndex ? 'active' : ''
                  }`}
                onClick={() => setSelectedFunctionIndex(index)}
              >
                <span className="function-explorer-list-item-icon">ƒ</span>
                <span className="function-explorer-list-item-name">{func.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="function-explorer-main">
          {selectedFunction ? (
            <>
              {/* Function header */}
              <div className="function-explorer-func-header">
                <h3 className="function-explorer-func-name">{selectedFunction.name}</h3>
                <div className="function-explorer-func-meta">
                  <span className="function-explorer-line-number">
                    Lines {selectedFunction.startLine}–{selectedFunction.endLine}
                  </span>
                </div>
              </div>

              {/* Function signature */}
              <div className="function-explorer-signature-section">
                <div className="function-explorer-signature">
                  <code>{selectedFunction.signature}</code>
                </div>
              </div>

              {/* Function description */}
              {selectedFunction.description && (
                <div className="function-explorer-description-section">
                  <p className="function-explorer-description">
                    {selectedFunction.description}
                  </p>
                </div>
              )}

              {/* Parameters */}
              {selectedFunction.params && selectedFunction.params.length > 0 && (
                <div className="function-explorer-params-section">
                  <h4 className="function-explorer-section-title">Parameters</h4>
                  <div className="function-explorer-params">
                    {selectedFunction.params.map((param, index) => (
                      <div key={index} className="function-explorer-param">
                        <span className="function-explorer-param-name">{param.name}</span>
                        {param.type && (
                          <span className="function-explorer-param-type">{param.type}</span>
                        )}
                        {param.description && (
                          <span className="function-explorer-param-desc">
                            {param.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Return type */}
              {selectedFunction.returnType && (
                <div className="function-explorer-return-section">
                  <h4 className="function-explorer-section-title">Returns</h4>
                  <div className="function-explorer-return-type">
                    <code>{selectedFunction.returnType}</code>
                  </div>
                </div>
              )}

              {/* Code snippet */}
              <div className="function-explorer-code-section">
                <h4 className="function-explorer-section-title">Code</h4>
                <pre className="function-explorer-code-block">
                  <code>{selectedFunction.code}</code>
                </pre>
              </div>
            </>
          ) : (
            <div className="function-explorer-empty-state">
              <p>Select a function to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FunctionExplorer
