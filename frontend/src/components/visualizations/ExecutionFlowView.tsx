import { useEffect, useRef, useState } from 'react'
import { ExecutionFlowViewProps } from '@/types/componentSchemas'
import './ExecutionFlowView.css'

/**
 * ExecutionFlowView Component
 * High-level abstract data flow visualization showing layers and their interactions.
 * Layers are inferred from file paths and flows show data movement between them.
 */
function ExecutionFlowView(props: ExecutionFlowViewProps) {
  const { layers = [], flows = [], title, description } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // State to track container dimensions for responsiveness
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

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

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement
      if (container) {
        setContainerSize({
          width: container.clientWidth,
          height: container.clientHeight
        })
      }
    }

    // Initial resize
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // State for hover interaction
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null)

  // Sync canvas size with state
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas && containerSize.width > 0 && containerSize.height > 0) {
      canvas.width = containerSize.width
      canvas.height = containerSize.height
    }
  }, [containerSize])

  // Draw layer boxes and flows on canvas
  useEffect(() => {
    if (!canvasRef.current || layers.length === 0 || containerSize.width === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Increased spacing to use more space and reduce overlapping
    const padding = 80
    const gap = 120

    // Calculate layer width
    const totalGapWidth = (layers.length - 1) * gap
    const availableWidth = width - 2 * padding - totalGapWidth
    // Ensure nodes aren't too wide but fill space if available
    const layerWidth = Math.min(150, Math.max(110, availableWidth / layers.length))
    const layerHeight = 75

    // Recenter if content is smaller than width
    const totalContentWidth = layers.length * layerWidth + totalGapWidth
    const startX = (width - totalContentWidth) / 2

    const topY = (height - layerHeight) / 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Helper to draw rounded rectangle with shadow and gradient
    const drawRoundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      baseColor: string,
      strokeColor: string,
      isHovered: boolean,
      isDimmed: boolean
    ) => {
      ctx.save()

      if (isDimmed) {
        ctx.globalAlpha = 0.4
      }

      // Shadow / Glow
      if (isHovered) {
        ctx.shadowColor = baseColor
        ctx.shadowBlur = 25
        ctx.shadowOffsetY = 0
        ctx.shadowOffsetX = 0
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 4
        ctx.shadowOffsetX = 0
      }

      // Gradient Fill
      const gradient = ctx.createLinearGradient(x, y, x, y + h)
      if (isHovered) {
        gradient.addColorStop(0, `${baseColor}15`)
        gradient.addColorStop(1, `${baseColor}30`)
      } else {
        gradient.addColorStop(0, `${baseColor}05`)
        gradient.addColorStop(1, `${baseColor}20`)
      }

      ctx.fillStyle = gradient
      ctx.strokeStyle = isHovered ? baseColor : strokeColor
      ctx.lineWidth = isHovered ? 3 : 2

      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, r)
      } else {
        // Fallback for older browsers
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
      }
      ctx.closePath()

      ctx.fill()
      ctx.stroke()

      ctx.restore()
    }

    // Helper to draw arrow between layers
    const drawArrow = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      label: string,
      color: string,
      isHovered: boolean,
      isDimmed: boolean
    ) => {
      if (isDimmed) {
        ctx.save()
        ctx.globalAlpha = 0.3
      }

      const headlen = 10
      const angle = Math.atan2(toY - fromY, toX - fromX)
      const midX = (fromX + toX) / 2
      const midY = (fromY + toY) / 2

      ctx.save()

      // Draw line
      ctx.strokeStyle = isHovered ? '#4a4a4a' : color
      ctx.lineWidth = isHovered ? 2.5 : 1.5
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      // Slight curve if distance is large, otherwise straight
      // straight line is cleaner for this layout
      ctx.lineTo(toX, toY)
      ctx.stroke()

      // Draw arrowhead
      ctx.fillStyle = isHovered ? '#4a4a4a' : color
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fill()

      // Draw label if present and hovered
      if (label && isHovered) {
        ctx.font = '600 12px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

        const metrics = ctx.measureText(label)
        const padding = 10
        const bgWidth = metrics.width + (padding * 2)
        const bgHeight = 22
        const radius = 10 // Pill shape

        // Label background (Pill)
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#b0b0b0'
        ctx.lineWidth = 1

        const rectX = midX - bgWidth / 2
        const rectY = midY - bgHeight / 2

        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(rectX, rectY, bgWidth, bgHeight, radius)
        } else {
          // Simple fallback rect
          ctx.rect(rectX, rectY, bgWidth, bgHeight)
        }
        ctx.fill()
        ctx.stroke()

        // Label text
        ctx.fillStyle = '#4a4a4a' // Darker grey for better readability
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, midX, midY + 1) // +1 for visual centering
      }

      ctx.restore()

      if (isDimmed) {
        ctx.restore()
      }
    }

    // Draw layers
    const layerPositions: { [key: string]: { x: number; y: number } } = {}
    layers.forEach((layer, index) => {
      const x = startX + index * (layerWidth + gap)
      const y = topY
      const color = getLayerColor(layer.name)

      const isHovered = hoveredLayerId === layer.id
      const isDimmed = hoveredLayerId !== null && !isHovered

      drawRoundRect(x, y, layerWidth, layerHeight, 14, color, color, isHovered, isDimmed)

      // Draw layer name
      ctx.save()
      if (isDimmed) ctx.globalAlpha = 0.4

      ctx.fillStyle = '#2a2a2a'
      ctx.font = isHovered
        ? '700 14px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '600 13px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const textY = y + layerHeight / 2 - 8

      // Handle long names
      const maxWidth = layerWidth - 20
      let name = layer.name
      if (ctx.measureText(name).width > maxWidth) {
        // Simple truncate
        while (ctx.measureText(name + '...').width > maxWidth && name.length > 0) {
          name = name.slice(0, -1)
        }
        name += '...'
      }

      ctx.fillText(name, x + layerWidth / 2, textY)

      // Draw file count
      const fileCount = layer.files?.length || 0
      ctx.fillStyle = '#6b6b6b'
      ctx.font = '400 11px Inter, monospace'
      ctx.fillText(`${fileCount} file${fileCount !== 1 ? 's' : ''}`, x + layerWidth / 2, y + layerHeight / 2 + 12)

      ctx.restore()

      layerPositions[layer.id] = { x: x + layerWidth / 2, y: y + layerHeight / 2 }
    })

    // Draw flows/arrows between layers
    flows.forEach((flow) => {
      const fromPos = layerPositions[flow.from]
      const toPos = layerPositions[flow.to]

      if (fromPos && toPos) {
        let isHovered = false
        // Highlight flow if connected layers are hovered
        if (hoveredLayerId) {
          if (flow.from === hoveredLayerId || flow.to === hoveredLayerId) {
            isHovered = true
          }
        }

        const isDimmed = hoveredLayerId !== null && !isHovered

        const flowColor = isHovered ? '#666666' : '#b0b0b0'

        // Calculate intersection points (approximate to box edges)
        const dx = toPos.x - fromPos.x
        // Assuming horizontal flow mostly
        const startX = fromPos.x + (dx > 0 ? layerWidth / 2 : -layerWidth / 2)
        const endX = toPos.x - (dx > 0 ? layerWidth / 2 : -layerWidth / 2) + (dx > 0 ? -4 : 4)

        drawArrow(startX, fromPos.y, endX, toPos.y, flow.label || '', flowColor, isHovered, isDimmed)
      }
    })
  }, [layers, flows, containerSize, hoveredLayerId])

  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const width = canvas.width
    const height = canvas.height
    const padding = 80
    const gap = 120
    const totalGapWidth = (layers.length - 1) * gap
    const availableWidth = width - 2 * padding - totalGapWidth
    const layerWidth = Math.min(150, Math.max(110, availableWidth / layers.length))
    const layerHeight = 75
    const totalContentWidth = layers.length * layerWidth + totalGapWidth
    const startX = (width - totalContentWidth) / 2
    const topY = (height - layerHeight) / 2

    let foundLayerId: string | null = null

    layers.forEach((layer, index) => {
      const x = startX + index * (layerWidth + gap)
      const y = topY

      if (mouseX >= x && mouseX <= x + layerWidth &&
        mouseY >= y && mouseY <= y + layerHeight) {
        foundLayerId = layer.id
      }
    })

    setHoveredLayerId(foundLayerId)
    canvas.style.cursor = foundLayerId ? 'pointer' : 'default'
  }

  const handleMouseLeave = () => {
    setHoveredLayerId(null)
  }

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
        <canvas
          ref={canvasRef}
          className="execution-flow-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
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
