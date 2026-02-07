import { useEffect, useRef } from 'react'
import { ExecutionFlowViewProps, getLanguageColor } from '@/types/componentSchemas'
import './ExecutionFlowView.css'

/**
 * ExecutionFlowView Component
 * High-level abstract data flow visualization showing layers and their interactions.
 * Layers are inferred from file paths and flows show data movement between them.
 */
function ExecutionFlowView(props: ExecutionFlowViewProps) {
  const { layers = [], flows = [], title, description } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Auto-infer layer colors based on name patterns
  const getLayerColor = (layerName: string): string => {
    const name = layerName.toLowerCase()
    if (name.includes('frontend') || name.includes('ui') || name.includes('client')) return '#f7df1e' // Yellow
    if (name.includes('api') || name.includes('server') || name.includes('backend')) return '#3178c6' // Blue
    if (name.includes('database') || name.includes('db') || name.includes('data')) return '#3776ab' // Python Blue
    if (name.includes('cache') || name.includes('queue')) return '#00add8' // Cyan
    if (name.includes('auth') || name.includes('security')) return '#c41e3a' // Red
    return '#6b6b6b' // Gray
  }

  // Draw layer boxes and flows on canvas
  useEffect(() => {
    if (!canvasRef.current || layers.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 40
    const layerWidth = Math.max(120, (width - 2 * padding - (layers.length - 1) * 20) / layers.length)
    const layerHeight = 80
    const topY = (height - layerHeight) / 2

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Helper to draw rounded rectangle
    const drawRoundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      fillColor: string,
      strokeColor: string
    ) => {
      ctx.fillStyle = fillColor
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    // Helper to draw arrow between layers
    const drawArrow = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      label: string,
      color: string
    ) => {
      const headlen = 12
      const angle = Math.atan2(toY - fromY, toX - fromX)

      // Draw line
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
      ctx.stroke()

      // Draw arrowhead
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fill()

      // Draw label if present
      if (label) {
        const midX = (fromX + toX) / 2
        const midY = (fromY + toY) / 2 - 12
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(midX - 30, midY - 10, 60, 20)
        ctx.fillStyle = color
        ctx.font = '11px Monaco, monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, midX, midY)
      }
    }

    // Draw layers
    const layerPositions: { [key: string]: { x: number; y: number } } = {}
    layers.forEach((layer, index) => {
      const x = padding + index * (layerWidth + 20)
      const y = topY
      const color = getLayerColor(layer.name)
      const bgColor = color + '20' // 20% opacity

      drawRoundRect(x, y, layerWidth, layerHeight, 6, bgColor, color)

      // Draw layer name
      ctx.fillStyle = color
      ctx.font = 'bold 13px Monaco, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(layer.name, x + layerWidth / 2, y + layerHeight / 2 - 10)

      // Draw file count
      const fileCount = layer.files?.length || 0
      ctx.fillStyle = '#9a9a9a'
      ctx.font = '11px Monaco, monospace'
      ctx.fillText(`${fileCount} file${fileCount !== 1 ? 's' : ''}`, x + layerWidth / 2, y + layerHeight / 2 + 12)

      layerPositions[layer.id] = { x: x + layerWidth / 2, y: y + layerHeight / 2 }
    })

    // Draw flows/arrows between layers
    flows.forEach((flow) => {
      const fromPos = layerPositions[flow.from]
      const toPos = layerPositions[flow.to]

      if (fromPos && toPos) {
        const flowColor = getLanguageColor('TypeScript') // Use a default color for flows
        drawArrow(fromPos.x + layerWidth / 2, fromPos.y, toPos.x - layerWidth / 2, toPos.y, flow.label || '', flowColor)
      }
    })
  }, [layers, flows])

  // Empty state
  if (layers.length === 0) {
    return (
      <div className="execution-flow-container">
        <div className="execution-flow-empty">
          No execution flows found or insufficient data to visualize
        </div>
      </div>
    )
  }

  return (
    <div className="execution-flow-container">
      {(title || description) && (
        <div className="execution-flow-header">
          {title && <h2 className="execution-flow-title">{title}</h2>}
          {description && <p className="execution-flow-description">{description}</p>}
        </div>
      )}
      <div className="execution-flow-canvas-wrapper">
        <canvas ref={canvasRef} className="execution-flow-canvas" width={800} height={300} />
      </div>
      {layers.length > 0 && (
        <div className="execution-flow-legend">
          <h3 className="execution-flow-legend-title">Layers</h3>
          <div className="execution-flow-legend-items">
            {layers.map((layer) => (
              <div key={layer.id} className="execution-flow-legend-item">
                <div
                  className="execution-flow-legend-color"
                  style={{ backgroundColor: getLayerColor(layer.name) }}
                />
                <span className="execution-flow-legend-label">{layer.name}</span>
                {layer.files && layer.files.length > 0 && (
                  <span className="execution-flow-legend-count">({layer.files.length})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExecutionFlowView
