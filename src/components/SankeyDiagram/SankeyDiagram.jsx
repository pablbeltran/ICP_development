import { useRef, useState } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'
import html2canvas from 'html2canvas'
import { useSankeyData } from './useSankeyData'

const Plot = createPlotlyComponent(Plotly)

const BASE_WIDTH = 1200
const BASE_HEIGHT = 2600
const ZOOM_STEP = 0.2
const MIN_ZOOM = 0.2
const MAX_ZOOM = 3

export default function SankeyDiagram({ reconciledData }) {
  const sankeyData = useSankeyData(reconciledData)
  const [zoom, setZoom] = useState(1)
  const wrapperRef = useRef(null)

  const exportScreenshot = () => {
    const el = wrapperRef.current
    if (!el) return
    html2canvas(el, { backgroundColor: '#0f172a', scale: 2 }).then(canvas => {
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = 'sankey-pipeline.png'
      a.click()
    })
  }

  if (!sankeyData) return <p>No data available for Sankey diagram.</p>

  const width = Math.round(BASE_WIDTH * zoom)
  const height = Math.round(BASE_HEIGHT * zoom)

  // Text scales gently — shrinks when zoomed out but stays readable
  const textScale = (base, min) => Math.max(min, Math.round(base * Math.sqrt(zoom)))
  const nodeTextSize = textScale(20, 12)
  const layoutFontSize = textScale(16, 10)
  const annotationSize = textScale(18, 12)

  const t = sankeyData.totals

  const data = [{
    type: 'sankey',
    orientation: 'h',
    node: sankeyData.node,
    link: sankeyData.link,
    textfont: { size: nodeTextSize, color: '#f1f5f9', family: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  }]

  const layout = {
    font: {
      family: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      size: layoutFontSize,
      color: '#e2e8f0',
    },
    height: height,
    margin: { l: 10, r: 150, t: 70, b: 20 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    annotations: [
      { x: 0.0, y: 1.04, text: '<b>Connects by Industry</b>', showarrow: false, xref: 'paper', yref: 'paper', font: { size: annotationSize, color: '#e2e8f0' } },
      { x: 0.2, y: 1.04, text: `<b>Total Connects: ${t.connects}</b>`, showarrow: false, xref: 'paper', yref: 'paper', font: { size: annotationSize, color: '#e2e8f0' } },
      { x: 0.4, y: 1.04, text: `<b>Conversations: ${t.conversations} (${t.convRate}%)</b>`, showarrow: false, xref: 'paper', yref: 'paper', font: { size: annotationSize, color: '#e2e8f0' } },
      { x: 0.6, y: 1.04, text: `<b>Meetings: ${t.meetings} (${t.meetRate}%)</b>`, showarrow: false, xref: 'paper', yref: 'paper', font: { size: annotationSize, color: '#e2e8f0' } },
      { x: 0.8, y: 1.04, text: `<b>Applications: ${t.apps} (${t.appRate}%)</b>`, showarrow: false, xref: 'paper', yref: 'paper', font: { size: annotationSize, color: '#e2e8f0' } },
      { x: 1.0, y: 1.04, text: `<b>Outcome</b>`, showarrow: false, xref: 'paper', yref: 'paper', font: { size: annotationSize, color: '#e2e8f0' } },
    ],
  }

  const config = {
    responsive: false,
    displayModeBar: false,
    displaylogo: false,
  }

  return (
    <div>
      <div className="sankey-zoom-controls">
        <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}>-</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}>+</button>
        <button onClick={() => setZoom(1)}>Reset</button>
        <button className="sankey-export-btn" onClick={exportScreenshot}>Screenshot</button>
      </div>
      <div className="sankey-scroll-wrapper" ref={wrapperRef}>
        <div className="sankey-container" style={{ minWidth: width, minHeight: height }}>
          <Plot data={data} layout={layout} config={config} style={{ width: width + 'px' }} />
        </div>
      </div>
    </div>
  )
}
