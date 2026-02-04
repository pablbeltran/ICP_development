import { useState } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'
import { useSankeyData } from './useSankeyData'

const Plot = createPlotlyComponent(Plotly)

const BASE_WIDTH = 1400
const BASE_HEIGHT = 2000
const ZOOM_STEP = 0.2
const MIN_ZOOM = 0.2
const MAX_ZOOM = 3

export default function SankeyDiagram({ reconciledData }) {
  const sankeyData = useSankeyData(reconciledData)
  const [zoom, setZoom] = useState(1)

  if (!sankeyData) return <p>No data available for Sankey diagram.</p>

  const width = Math.round(BASE_WIDTH * zoom)
  const height = Math.round(BASE_HEIGHT * zoom)

  const data = [{
    type: 'sankey',
    orientation: 'h',
    node: sankeyData.node,
    link: sankeyData.link,
    textfont: { size: Math.round(24 * zoom), color: '#f1f5f9', family: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  }]

  const layout = {
    font: {
      family: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      size: Math.round(20 * zoom),
      color: '#e2e8f0',
    },
    height: height,
    margin: { l: 10, r: Math.round(150 * zoom), t: 70, b: 20 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    annotations: [
      { x: 0.0, y: 1.04, text: '<b>Connects by Industry</b>', showarrow: false, xref: 'paper', yref: 'paper', font: { size: Math.round(22 * zoom), color: '#e2e8f0' } },
      { x: 0.2, y: 1.04, text: '<b>Total Connects</b>', showarrow: false, xref: 'paper', yref: 'paper', font: { size: Math.round(22 * zoom), color: '#e2e8f0' } },
      { x: 0.4, y: 1.04, text: '<b>Conversations</b>', showarrow: false, xref: 'paper', yref: 'paper', font: { size: Math.round(22 * zoom), color: '#e2e8f0' } },
      { x: 0.6, y: 1.04, text: '<b>Meetings</b>', showarrow: false, xref: 'paper', yref: 'paper', font: { size: Math.round(22 * zoom), color: '#e2e8f0' } },
      { x: 0.8, y: 1.04, text: '<b>Applications</b>', showarrow: false, xref: 'paper', yref: 'paper', font: { size: Math.round(22 * zoom), color: '#e2e8f0' } },
      { x: 1.0, y: 1.04, text: '<b>Outcome</b>', showarrow: false, xref: 'paper', yref: 'paper', font: { size: Math.round(22 * zoom), color: '#e2e8f0' } },
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
      </div>
      <div className="sankey-scroll-wrapper">
        <div className="sankey-container" style={{ minWidth: width, minHeight: height }}>
          <Plot data={data} layout={layout} config={config} style={{ width: width + 'px' }} />
        </div>
      </div>
    </div>
  )
}
