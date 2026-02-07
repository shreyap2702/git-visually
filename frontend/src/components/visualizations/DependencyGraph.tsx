import { useEffect, useRef } from 'react'
import './DependencyGraph.css'
import {
  DependencyGraphProps,
  getLanguageColor,
} from '@/types/componentSchemas'

interface Position {
  x: number
  y: number
}

/**
 * DependencyGraph Component
 * Renders file-to-file dependencies as an interactive force-directed graph.
 * Nodes are colored by programming language with a subtle glow effect.
 */
function DependencyGraph(props: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const positionsRef = useRef<Map<string, Position>>(new Map())
  const velocitiesRef = useRef<Map<string, { vx: number; vy: number }>>(new Map())

  // Initialize forces simulation
  useEffect(() => {
    if (!props.nodes || props.nodes.length === 0) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    // Initialize positions randomly
    props.nodes.forEach((node) => {
      if (!positionsRef.current.has(node.id)) {
        positionsRef.current.set(node.id, {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
        })
        velocitiesRef.current.set(node.id, { vx: 0, vy: 0 })
      }
    })

    let animationId: number

    const simulate = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const positions = positionsRef.current
      const velocities = velocitiesRef.current
      const k = 0.1 // Force constant
      const damping = 0.99

      // Apply forces
      props.nodes.forEach((node) => {
        const pos = positions.get(node.id)!
        const vel = velocities.get(node.id)!

        let fx = 0
        let fy = 0

        // Repulsion from other nodes
        props.nodes.forEach((other) => {
          if (other.id === node.id) return

          const otherPos = positions.get(other.id)!
          const dx = pos.x - otherPos.x
          const dy = pos.y - otherPos.y
          const dist = Math.sqrt(dx * dx + dy * dy) + 1
          const repulsion = (k * 50) / (dist * dist)

          fx += (dx / dist) * repulsion
          fy += (dy / dist) * repulsion
        })

        // Attraction from connected nodes
        props.edges.forEach((edge) => {
          if (edge.source === node.id) {
            const targetPos = positions.get(edge.target)
            if (targetPos) {
              const dx = targetPos.x - pos.x
              const dy = targetPos.y - pos.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const attraction = (k * dist) / 50

              fx += (dx / (dist + 1)) * attraction
              fy += (dy / (dist + 1)) * attraction
            }
          } else if (edge.target === node.id) {
            const sourcePos = positions.get(edge.source)
            if (sourcePos) {
              const dx = sourcePos.x - pos.x
              const dy = sourcePos.y - pos.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const attraction = (k * dist) / 50

              fx += (dx / (dist + 1)) * attraction
              fy += (dy / (dist + 1)) * attraction
            }
          }
        })

        // Update velocity and position
        vel.vx = (vel.vx + fx) * damping
        vel.vy = (vel.vy + fy) * damping

        pos.x += vel.vx
        pos.y += vel.vy

        // Boundary conditions
        pos.x = Math.max(30, Math.min(canvas.width - 30, pos.x))
        pos.y = Math.max(30, Math.min(canvas.height - 30, pos.y))
      })

      // Draw edges
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 1
      props.edges.forEach((edge) => {
        const source = positions.get(edge.source)
        const target = positions.get(edge.target)
        if (source && target) {
          ctx.beginPath()
          ctx.moveTo(source.x, source.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
        }
      })

      // Draw nodes with glow
      props.nodes.forEach((node) => {
        const pos = positions.get(node.id)!
        const color = getLanguageColor(node.language)

        // Draw glow
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 20)
        gradient.addColorStop(0, `${color}30`)
        gradient.addColorStop(1, `${color}00`)
        ctx.fillStyle = gradient
        ctx.fillRect(pos.x - 20, pos.y - 20, 40, 40)

        // Draw node
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2)
        ctx.fill()

        // Draw border
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2)
        ctx.stroke()
      })

      animationId = requestAnimationFrame(simulate)
    }

    simulate()

    return () => cancelAnimationFrame(animationId)
  }, [props.nodes, props.edges])

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (canvas && container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!props.nodes || props.nodes.length === 0) {
    return (
      <div className="dependency-graph-empty">
        <p>No dependencies found or insufficient data to visualize.</p>
      </div>
    )
  }

  return (
    <div className="dependency-graph-container">
      {props.title && <h2 className="dependency-graph-title">{props.title}</h2>}
      {props.description && (
        <p className="dependency-graph-description">{props.description}</p>
      )}
      <div className="dependency-graph-canvas-wrapper" ref={containerRef}>
        <canvas ref={canvasRef} className="dependency-graph-canvas" />
      </div>
      <div className="dependency-graph-legend">
        <p className="dependency-graph-legend-title">Languages</p>
        <div className="dependency-graph-legend-items">
          {Array.from(new Set(props.nodes.map((n) => n.language))).map(
            (language) => (
              <div key={language} className="dependency-graph-legend-item">
                <div
                  className="dependency-graph-legend-color"
                  style={{ backgroundColor: getLanguageColor(language) }}
                />
                <span>{language}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default DependencyGraph
