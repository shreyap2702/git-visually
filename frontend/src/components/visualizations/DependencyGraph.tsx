import { useEffect, useRef, useState, useMemo } from 'react'
import './DependencyGraph.css'
import {
  DependencyGraphProps,
  getLanguageColor,
  DependencyGraphNode
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

  // State for positions/velocities to keep simulation running
  const positionsRef = useRef<Map<string, Position>>(new Map())
  const velocitiesRef = useRef<Map<string, { vx: number; vy: number }>>(new Map())

  // Interactive state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number, y: number, node: DependencyGraphNode } | null>(null)

  // Calculate Metrics
  const metrics = useMemo(() => {
    if (!props.nodes || props.nodes.length === 0) return null

    const nodeCount = props.nodes.length
    const edgeCount = props.edges.length

    // In-degree / Out-degree maps
    const inDegree = new Map<string, number>()
    const outDegree = new Map<string, number>()
    const adjList = new Map<string, string[]>()

    props.nodes.forEach(n => {
      inDegree.set(n.id, 0)
      outDegree.set(n.id, 0)
      adjList.set(n.id, [])
    })

    props.edges.forEach(e => {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
      outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1)
      adjList.get(e.source)?.push(e.target)
      adjList.get(e.target)?.push(e.source) // Undirected for CC check
    })

    const avgInDegree = edgeCount / nodeCount
    const density = nodeCount > 1 ? edgeCount / (nodeCount * (nodeCount - 1)) : 0

    // Connected Components
    let connectedComponents = 0
    const visited = new Set<string>()

    props.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        connectedComponents++
        // BFS
        const queue = [node.id]
        visited.add(node.id)
        while (queue.length > 0) {
          const curr = queue.shift()!
          const neighbors = adjList.get(curr) || []
          neighbors.forEach(next => {
            if (!visited.has(next)) {
              visited.add(next)
              queue.push(next)
            }
          })
        }
      }
    })

    // Most Connected Files (Centrality approximation by degree)
    const mostConnected = [...props.nodes]
      .map(n => ({
        ...n,
        degree: (inDegree.get(n.id) || 0) + (outDegree.get(n.id) || 0),
        in: inDegree.get(n.id) || 0,
        out: outDegree.get(n.id) || 0
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5)

    return {
      nodeCount,
      edgeCount,
      avgInDegree: avgInDegree.toFixed(2),
      density: density.toFixed(3),
      connectedComponents,
      mostConnected
    }
  }, [props.nodes, props.edges])

  // Initialize forces simulation
  useEffect(() => {
    if (!props.nodes || props.nodes.length === 0) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    // Initialize positions randomly if not set
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
    let ticks = 0
    const MAX_TICKS = 300 // Stop simulation after some time for "static" feel

    const simulate = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const positions = positionsRef.current
      const velocities = velocitiesRef.current
      const k = 0.05 // Force constant
      const damping = 0.90 // Higher damping for faster settling

      // Run physics simulation only for a limited time
      if (ticks < MAX_TICKS) {
        ticks++
        props.nodes.forEach((node) => {
          const pos = positions.get(node.id)!
          const vel = velocities.get(node.id)!

          let fx = 0
          let fy = 0

          // Repulsion from other nodes - INCREASED SIGNIFICANTLY
          props.nodes.forEach((other) => {
            if (other.id === node.id) return

            const otherPos = positions.get(other.id)!
            const dx = pos.x - otherPos.x
            const dy = pos.y - otherPos.y
            const dist = Math.sqrt(dx * dx + dy * dy) + 1

            // Stronger repulsion to prevent knitting and fill space - MAXIMIZED
            const repulsion = (k * 8000) / (dist * dist)

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
                const attraction = (k * dist) / 200 // Even weaker attraction for max spread

                fx += (dx / (dist + 1)) * attraction
                fy += (dy / (dist + 1)) * attraction
              }
            } else if (edge.target === node.id) {
              const sourcePos = positions.get(edge.source)
              if (sourcePos) {
                const dx = sourcePos.x - pos.x
                const dy = sourcePos.y - pos.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const attraction = (k * dist) / 200 // Even weaker attraction

                fx += (dx / (dist + 1)) * attraction
                fy += (dy / (dist + 1)) * attraction
              }
            }
          })

          // Center gravity - Minimized to let nodes go to edges
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          const dx = centerX - pos.x
          const dy = centerY - pos.y
          const gravity = 0.0001 // Almost zero gravity
          fx += dx * gravity
          fy += dy * gravity

          // Update velocity and position
          vel.vx = (vel.vx + fx) * damping
          vel.vy = (vel.vy + fy) * damping

          pos.x += vel.vx
          pos.y += vel.vy

          // Boundary conditions - Increased padding prevents cut-off
          const padding = 60
          pos.x = Math.max(padding, Math.min(canvas.width - padding, pos.x))
          pos.y = Math.max(padding, Math.min(canvas.height - padding, pos.y))
        })
      }

      // Draw edges with arrows
      ctx.lineWidth = 1.5
      const headlen = 8 // length of head in pixels

      props.edges.forEach((edge) => {
        const source = positions.get(edge.source)
        const target = positions.get(edge.target)

        if (source && target) {
          // Determine if edge should be highlighted or dimmed
          const isHovered = hoveredNodeId === edge.source || hoveredNodeId === edge.target
          const isDimmed = hoveredNodeId && !isHovered

          ctx.strokeStyle = isDimmed ? '#e0e0e0' : (isHovered ? '#333333' : '#999999')
          ctx.fillStyle = ctx.strokeStyle

          // Draw straight line for cleaner look
          const dx = target.x - source.x
          const dy = target.y - source.y
          const angle = Math.atan2(dy, dx)

          // Calculate end point (subtract node radius to stop at edge)
          const nodeRadius = 8
          const endX = target.x - nodeRadius * Math.cos(angle)
          const endY = target.y - nodeRadius * Math.sin(angle)
          const startX = source.x + nodeRadius * Math.cos(angle)
          const startY = source.y + nodeRadius * Math.sin(angle)

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()

          // Draw arrowhead
          ctx.beginPath()
          ctx.moveTo(endX, endY)
          ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6))
          ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6))
          ctx.lineTo(endX, endY)
          ctx.fill()
        }
      })

      // Draw nodes
      props.nodes.forEach((node) => {
        const pos = positions.get(node.id)!
        const color = getLanguageColor(node.language)
        const isHovered = hoveredNodeId === node.id
        const isDimmed = hoveredNodeId && !isHovered && !isConnectedToHovered(node.id)

        // Draw glow
        if (!isDimmed) {
          const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, isHovered ? 25 : 20)
          gradient.addColorStop(0, `${color}40`)
          gradient.addColorStop(1, `${color}00`)
          ctx.fillStyle = gradient
          ctx.fillRect(pos.x - 25, pos.y - 25, 50, 50)
        }

        // Draw node
        ctx.fillStyle = isDimmed ? '#e0e0e0' : color
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, isHovered ? 10 : 8, 0, Math.PI * 2)
        ctx.fill()

        // Draw border
        ctx.strokeStyle = isDimmed ? '#cccccc' : (isHovered ? '#000000' : color)
        ctx.lineWidth = isHovered ? 3 : 2
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, isHovered ? 10 : 8, 0, Math.PI * 2)
        ctx.stroke()
      })

      animationId = requestAnimationFrame(simulate)
    }

    simulate()

    return () => cancelAnimationFrame(animationId)
  }, [props.nodes, props.edges, hoveredNodeId])

  // Helper to check if a node is connected to the hovered node
  const isConnectedToHovered = (nodeId: string) => {
    if (!hoveredNodeId) return false
    return props.edges.some(e =>
      (e.source === hoveredNodeId && e.target === nodeId) ||
      (e.target === hoveredNodeId && e.source === nodeId)
    )
  }

  // Handle canvas interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      let foundNode: DependencyGraphNode | null = null

      // Check collision with nodes
      props.nodes.forEach(node => {
        const pos = positionsRef.current.get(node.id)
        if (pos) {
          const dx = mouseX - pos.x
          const dy = mouseY - pos.y
          if (dx * dx + dy * dy <= 100) { // Radius 10 squared
            foundNode = node
          }
        }
      })

      if (foundNode) {
        setHoveredNodeId((foundNode as DependencyGraphNode).id)
        setTooltip({
          x: mouseX,
          y: mouseY,
          node: foundNode
        })
        canvas.style.cursor = 'pointer'
      } else {
        setHoveredNodeId(null)
        setTooltip(null)
        canvas.style.cursor = 'default'
      }
    }

    const handleMouseLeave = () => {
      setHoveredNodeId(null)
      setTooltip(null)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [props.nodes])

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

      {/* Legend Moved to Top */}
      <div className="dependency-graph-legend top-legend">
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

      <div className="dependency-graph-content vertical-layout">
        <div className="dependency-graph-canvas-wrapper" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="dependency-graph-canvas"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;

              let foundNode: DependencyGraphNode | null = null;

              // Check collision with nodes (using refs for latest positions)
              props.nodes.forEach(node => {
                const pos = positionsRef.current.get(node.id);
                if (pos) {
                  const dx = mouseX - pos.x;
                  const dy = mouseY - pos.y;
                  if (dx * dx + dy * dy <= 100) { // Radius 10 squared
                    foundNode = node;
                  }
                }
              });

              if (foundNode) {
                setHoveredNodeId((foundNode as DependencyGraphNode).id);
                setTooltip({
                  x: mouseX,
                  y: mouseY,
                  node: foundNode
                });
                e.currentTarget.style.cursor = 'pointer';
              } else {
                setHoveredNodeId(null);
                setTooltip(null);
                e.currentTarget.style.cursor = 'default';
              }
            }}
            onMouseLeave={() => {
              setHoveredNodeId(null);
              setTooltip(null);
            }}
          />

          {/* Tooltip Overlay */}
          {tooltip && (
            <div
              className="dependency-graph-tooltip"
              style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
            >
              <div className="dependency-graph-tooltip-title">{tooltip.node.label}</div>
              <div className="dependency-graph-tooltip-meta">
                <span className="dependency-graph-tooltip-label">Language:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getLanguageColor(tooltip.node.language),
                      display: 'inline-block'
                    }}
                  />
                  {tooltip.node.language}
                </span>

                {tooltip.node.lines !== undefined && (
                  <>
                    <span className="dependency-graph-tooltip-label">Lines:</span>
                    <span>{tooltip.node.lines}</span>
                  </>
                )}
                {tooltip.node.functionCount !== undefined && (
                  <>
                    <span className="dependency-graph-tooltip-label">Functions:</span>
                    <span>{tooltip.node.functionCount}</span>
                  </>
                )}
                {tooltip.node.dependencyCount !== undefined && (
                  <>
                    <span className="dependency-graph-tooltip-label">Depends on:</span>
                    <span>{tooltip.node.dependencyCount} files</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metrics Dashboard (Below Graph) */}
        {metrics && (
          <div className="dependency-graph-metrics">
            <h3 className="metrics-title">Graph Analysis Metrics</h3>

            <div className="metrics-grid">
              <div className="metric-card">
                <label>NODES (FILES)</label>
                <div className="metric-value">{metrics.nodeCount}</div>
              </div>
              <div className="metric-card">
                <label>AVG IN-DEGREE</label>
                <div className="metric-value">{metrics.avgInDegree}</div>
              </div>
              <div className="metric-card">
                <label>CONNECTED COMPONENTS</label>
                <div className="metric-value">{metrics.connectedComponents} {metrics.connectedComponents === 1 ? '(fully connected)' : ''}</div>
              </div>
              <div className="metric-card">
                <label>EDGES (DEPENDENCIES)</label>
                <div className="metric-value">{metrics.edgeCount}</div>
              </div>
              <div className="metric-card">
                <label>DENSITY</label>
                <div className="metric-value">{metrics.density}</div>
              </div>
              <div className="metric-card">
                <label>CIRCULAR DEPENDENCIES</label>
                <div className="metric-value">0</div> {/* Placeholder or calc if complex */}
              </div>
            </div>

            <div className="most-connected-section">
              <h4 className="metrics-subtitle">Most Connected Files</h4>
              <ul className="most-connected-list">
                {metrics.mostConnected.map((node, i) => (
                  <li key={node.id}>
                    <span className="rank">{i + 1}. {node.label}</span>
                    <span className="details">
                      - In: {node.in}, Out: {node.out}, Language: {node.language}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DependencyGraph
