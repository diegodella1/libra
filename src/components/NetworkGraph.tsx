'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '@/lib/api'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { select } from 'd3-selection'
import { drag } from 'd3-drag'

interface GraphNode extends SimulationNodeDatum {
  id: string
  name: string
  role: string
  doc_count: number
}

interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
  weight: number
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function NetworkGraph() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    authFetch('/api/graph')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError('Error cargando el grafo')
        setLoading(false)
      })
  }, [])

  const renderGraph = useCallback(() => {
    if (!data || !svgRef.current || !containerRef.current) return
    if (data.nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const nodeCount = data.nodes.length
    const height = Math.max(500, Math.min(900, nodeCount * 18, window.innerHeight - 150))

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    // Clone data to avoid mutating state
    const nodes: GraphNode[] = data.nodes.map((n) => ({ ...n }))
    const edges: GraphEdge[] = data.edges.map((e) => ({ ...e }))

    // Scale node radius by doc_count (logarithmic for better distribution)
    const maxDocs = Math.max(...nodes.map((n) => n.doc_count))
    const logMax = Math.log(maxDocs + 1)
    const radius = (n: GraphNode) => {
      const logVal = Math.log(n.doc_count + 1) / logMax
      return Math.max(14, logVal * 40)
    }

    // Scale edge width by weight (logarithmic)
    const maxWeight = Math.max(...edges.map((e) => e.weight), 1)
    const logMaxW = Math.log(maxWeight + 1)

    const simulation = forceSimulation(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance((d) => {
            const logW = Math.log(d.weight + 1) / logMaxW
            return 180 - logW * 80
          })
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'collide',
        forceCollide<GraphNode>().radius((d) => radius(d) + 10)
      )

    // Edges
    const link = svg
      .append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#c4b5a0')
      .attr('stroke-opacity', (d) => {
        const logW = Math.log(d.weight + 1) / logMaxW
        return 0.2 + logW * 0.6
      })
      .attr('stroke-width', (d) => {
        const logW = Math.log(d.weight + 1) / logMaxW
        return 1 + logW * 5
      })

    // Edge labels (weight)
    const linkLabel = svg
      .append('g')
      .selectAll('text')
      .data(edges.filter((e) => e.weight > 1))
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10')
      .attr('fill', '#8b7355')
      .attr('font-family', 'ui-monospace, monospace')
      .text((d) => String(d.weight))

    // Node groups
    const node = svg
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        router.push(`/explorador?q=${encodeURIComponent(d.name)}`)
      })

    // Native browser tooltip on hover
    node.append('title')
      .text((d) => `${d.name}\n${d.doc_count} documentos\nClick para ver`)

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => radius(d))
      .attr('fill', (d) => (d.role === 'investigado' ? '#f5c542' : '#b3b4c5'))
      .attr('stroke', (d) => (d.role === 'investigado' ? '#d4a017' : '#8b8ca0'))
      .attr('stroke-width', 2)

    // Node labels
    node
      .append('text')
      .text((d) => {
        // Short name for small nodes
        const parts = d.name.split(' ')
        if (radius(d) < 30) return parts[0]
        return parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : d.name
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('font-size', (d) => (radius(d) < 25 ? '9' : '11'))
      .attr('font-weight', '600')
      .attr('fill', (d) => (d.role === 'investigado' ? '#5c4a1e' : '#3a3b50'))
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .attr('pointer-events', 'none')

    // Doc count below name
    node
      .append('text')
      .text((d) => `${d.doc_count} docs`)
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('font-size', '9')
      .attr('fill', (d) => (d.role === 'investigado' ? '#8b7355' : '#6b6c80'))
      .attr('font-family', 'ui-monospace, monospace')
      .attr('pointer-events', 'none')

    // Drag behavior
    const dragBehavior = drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    node.call(dragBehavior)

    // Tick
    simulation.on('tick', () => {
      // Keep nodes within bounds
      nodes.forEach((d) => {
        const r = radius(d)
        d.x = Math.max(r, Math.min(width - r, d.x!))
        d.y = Math.max(r, Math.min(height - r, d.y!))
      })

      link
        .attr('x1', (d) => (d.source as GraphNode).x!)
        .attr('y1', (d) => (d.source as GraphNode).y!)
        .attr('x2', (d) => (d.target as GraphNode).x!)
        .attr('y2', (d) => (d.target as GraphNode).y!)

      linkLabel
        .attr('x', (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [data, router])

  useEffect(() => {
    const cleanup = renderGraph()

    const handleResize = () => renderGraph()
    window.addEventListener('resize', handleResize)
    return () => {
      cleanup?.()
      window.removeEventListener('resize', handleResize)
    }
  }, [renderGraph])

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-400 font-mono text-sm">Cargando red...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-400 text-sm">No hay datos de conexiones.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full" />
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-ink-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#f5c542] border border-[#d4a017]" />
          Investigado
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#b3b4c5] border border-[#8b8ca0]" />
          Mencionado
        </div>
        <span className="text-ink-400">Click en un nodo para ver sus documentos</span>
      </div>
    </div>
  )
}
