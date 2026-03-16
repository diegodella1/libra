'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { authFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

// D3 imports
import { scaleTime, scaleLinear, scaleOrdinal } from 'd3-scale'
import { brushX } from 'd3-brush'
import { select } from 'd3-selection'
import { axisBottom, axisLeft } from 'd3-axis'
import { max } from 'd3-array'

const TYPE_COLORS: Record<string, string> = {
  conversacion: '#3b82f6',
  audio: '#a855f7',
  imagen: '#ec4899',
  pdf: '#ef4444',
  llamadas: '#16a34a',
  documento: '#6b7280',
  rrss: '#06b6d4',
  transcripcion: '#d97706',
  planilla: '#10b981',
  forense: '#f97316',
  presentacion: '#6366f1',
  texto: '#9ca3af',
}

interface TimelineBar {
  date: string
  types: Record<string, number>
}

interface TimelineEvent {
  date: string
  label: string
  color: string
}

interface TimelineData {
  bars: TimelineBar[]
  events: TimelineEvent[]
  totalWithDate: number
  totalDocs: number
  pctWithDate: number
}

const MARGIN = { top: 30, right: 20, bottom: 50, left: 50 }

export function InteractiveTimeline() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    authFetch('/api/timeline')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const renderChart = useCallback(() => {
    if (!data || !svgRef.current || data.bars.length === 0) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const container = svgRef.current.parentElement
    const width = container ? container.clientWidth : 600
    const height = 320
    svg.attr('width', width).attr('height', height)

    const innerW = width - MARGIN.left - MARGIN.right
    const innerH = height - MARGIN.top - MARGIN.bottom

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Parse dates
    const dates = data.bars.map(b => new Date(b.date + 'T00:00:00'))
    const dateExtent = [dates[0], dates[dates.length - 1]] as [Date, Date]

    // Get all types
    const allTypes = Array.from(new Set(data.bars.flatMap(b => Object.keys(b.types))))

    // Stack data manually
    const maxTotal = max(data.bars, b => Object.values(b.types).reduce((a, c) => a + c, 0)) || 1

    const x = scaleTime().domain(dateExtent).range([0, innerW])
    const y = scaleLinear().domain([0, maxTotal]).nice().range([innerH, 0])
    const color = scaleOrdinal<string>().domain(allTypes).range(allTypes.map(t => TYPE_COLORS[t] || '#d7d7e0'))

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(axisBottom(x).ticks(6))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', '#8a8ba5')

    // Y axis
    g.append('g')
      .call(axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', '#8a8ba5')

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#ededf1')
      .attr('stroke-width', 0.5)

    // Bars (stacked)
    const barW = Math.max(2, Math.min(12, innerW / data.bars.length - 1))

    for (const bar of data.bars) {
      const bx = x(new Date(bar.date + 'T00:00:00')) - barW / 2
      let cumY = 0
      for (const type of allTypes) {
        const val = bar.types[type] || 0
        if (val === 0) continue
        g.append('rect')
          .attr('x', bx)
          .attr('y', y(cumY + val))
          .attr('width', barW)
          .attr('height', y(cumY) - y(cumY + val))
          .attr('fill', color(type))
          .attr('rx', 1)
        cumY += val
      }
    }

    // Event markers
    for (const evt of data.events) {
      const evtDate = new Date(evt.date + 'T00:00:00')
      const ex = x(evtDate)
      if (ex < 0 || ex > innerW) continue

      g.append('line')
        .attr('x1', ex)
        .attr('x2', ex)
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', evt.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3')

      g.append('circle')
        .attr('cx', ex)
        .attr('cy', 0)
        .attr('r', 4)
        .attr('fill', evt.color)

      g.append('text')
        .attr('x', ex)
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('fill', evt.color)
        .text(evt.label.length > 25 ? evt.label.slice(0, 22) + '...' : evt.label)
    }

    // Brush for zoom selection
    const brush = brushX<unknown>()
      .extent([[0, 0], [innerW, innerH]])
      .on('end', (event) => {
        if (!event.selection) return
        const [x0, x1] = (event.selection as [number, number]).map(x.invert)
        const from = x0.toISOString().slice(0, 10)
        const to = x1.toISOString().slice(0, 10)
        // Clear brush
        g.select<SVGGElement>('.brush').call(brush.move, null)
        // Navigate
        router.push(`/explorador?date_from=${from}&date_to=${to}`)
      })

    g.append('g')
      .attr('class', 'brush')
      .call(brush)
      .selectAll('rect')
      .attr('rx', 3)

  }, [data, router])

  useEffect(() => {
    renderChart()
    const handleResize = () => renderChart()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [renderChart])

  if (loading) return <div className="bg-white rounded-xl border border-ink-200 p-5 h-[400px] animate-pulse" />

  if (!data || data.bars.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-ink-200 p-5 text-center text-ink-400 text-sm">
        No hay datos de fechas disponibles.
      </div>
    )
  }

  // Legend: top types
  const allTypes = Array.from(new Set(data.bars.flatMap(b => Object.keys(b.types))))
  const typeCounts = new Map<string, number>()
  for (const bar of data.bars) {
    for (const [type, count] of Object.entries(bar.types)) {
      typeCounts.set(type, (typeCounts.get(type) || 0) + count)
    }
  }
  const topTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="bg-white rounded-xl border border-ink-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink-800">Timeline de documentos</h3>
        <span className="text-[10px] font-mono text-ink-400">
          Arrastra para filtrar por rango
        </span>
      </div>

      {/* Banner: % with dates */}
      <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        Solo {data.pctWithDate}% de los documentos ({data.totalWithDate.toLocaleString('es-AR')} de {data.totalDocs.toLocaleString('es-AR')}) tienen fecha asignada.
        La timeline muestra clusters de actividad en los documentos fechados.
      </div>

      <div className="overflow-x-auto">
        <svg ref={svgRef} className="w-full" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {topTypes.map(([type]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TYPE_COLORS[type] || '#d7d7e0' }} />
            <span className="text-[10px] text-ink-500 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
