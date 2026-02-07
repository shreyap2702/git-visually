import { useState } from 'react'
import './FunctionExplorer.css'
import { FunctionExplorerProps, getLanguageColor } from '@/types/componentSchemas'

/**
 * FunctionExplorer Component
 * GitHub-themed interface for browsing functions in a single file.
 */
function FunctionExplorer(props: FunctionExplorerProps) {
  const [selectedFunctionIndex, setSelectedFunctionIndex] = useState(0)

  if (!props.functions || props.functions.length === 0) {
    return (
      <div className="function-explorer-empty">
        <p>No functions found in this file or insufficient data to visualize.</p>
      </div>
    )
  }

  const selectedFunction = props.functions[selectedFunctionIndex]
  const languageColor = getLanguageColor(props.language)

  return (
    <div className="function-explorer-container">
      <div className="function-explorer-header">
        <div className="function-explorer-file-info">
          <div className="function-explorer-file-path">{props.filePath}</div>
          <div className="function-explorer-file-meta">
            <span
              className="function-explorer-language-badge"
              style={{ borderColor: languageColor, color: languageColor }}
            >
              {props.language}
            </span>
            {props.totalLines && (
              <span className="function-explorer-meta-item">
                {props.totalLines} lines
              </span>
            )}
            {props.fileSize && (
              <span className="function-explorer-meta-item">
                {(props.fileSize / 1024).toFixed(1)} KB
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
            <span className="function-explorer-list-count">{props.functions.length}</span>
          </div>
          <div className="function-explorer-list">
            {props.functions.map((func, index) => (
              <button
                key={index}
                className={`function-explorer-list-item ${
                  index === selectedFunctionIndex ? 'active' : ''
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
        </div>
      </div>
    </div>
  )
}

export default FunctionExplorer
