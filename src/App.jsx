import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import SankeyDiagram from './components/SankeyDiagram/SankeyDiagram'

const CSV_FILES = {
  hubspot: {
    name: 'Master List of Accounts (CRM)',
    path: '/data/master_list_hubspot.csv',
    category: 'master'
  },
  nooks: {
    name: 'Cold Calls',
    path: '/data/nooks.csv',
    category: 'outreach'
  },
  instantly: {
    name: 'Email Outreach',
    path: '/data/instantly.csv',
    category: 'outreach'
  },
  unify: {
    name: 'Website Visits',
    path: '/data/unify.csv',
    category: 'outreach'
  }
}

const NUMERIC_COLUMNS = ['Dials', 'Connects', 'Conversations', 'Meetings Set', 'Emails Sent', 'Email Opens', 'Email Clicks']
const FILTERABLE_COLUMNS = ['Industry', 'Company Size', 'Lifecycle Stage', 'Application Status']

function ReconciledTable({ data, columns }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  if (!data || data.length === 0) return <p>No data available</p>

  const getUniqueValues = (column) => {
    const values = [...new Set(data.map(row => row[column]).filter(Boolean))]
    return values.sort()
  }

  const filteredData = data.filter(row => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchLower)
      )
      if (!matchesSearch) return false
    }
    for (const [column, value] of Object.entries(filters)) {
      if (value && row[column] !== value) return false
    }
    return true
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0
    let aVal = a[sortConfig.key]
    let bVal = b[sortConfig.key]
    if (NUMERIC_COLUMNS.includes(sortConfig.key)) {
      aVal = parseInt(aVal) || 0
      bVal = parseInt(bVal) || 0
    } else if (sortConfig.key === 'Connect Rate' || sortConfig.key === 'Meeting Rate') {
      aVal = parseFloat(aVal) || 0
      bVal = parseFloat(bVal) || 0
    } else {
      aVal = String(aVal).toLowerCase()
      bVal = String(bVal).toLowerCase()
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const totals = {}
  columns.forEach(col => {
    if (NUMERIC_COLUMNS.includes(col)) {
      totals[col] = filteredData.reduce((sum, row) => sum + (parseInt(row[col]) || 0), 0)
    } else if (col === 'Company Name') {
      totals[col] = `Total (${filteredData.length})`
    } else if (col === 'Connect Rate') {
      const totalDials = totals['Dials'] || filteredData.reduce((sum, row) => sum + (parseInt(row['Dials']) || 0), 0)
      const totalConnects = totals['Connects'] || filteredData.reduce((sum, row) => sum + (parseInt(row['Connects']) || 0), 0)
      totals[col] = totalDials > 0 ? ((totalConnects / totalDials) * 100).toFixed(1) + '%' : '0%'
    } else if (col === 'Meeting Rate') {
      const totalDials = totals['Dials'] || filteredData.reduce((sum, row) => sum + (parseInt(row['Dials']) || 0), 0)
      const totalMeetings = totals['Meetings Set'] || filteredData.reduce((sum, row) => sum + (parseInt(row['Meetings Set']) || 0), 0)
      totals[col] = totalDials > 0 ? ((totalMeetings / totalDials) * 100).toFixed(1) + '%' : '0%'
    } else {
      totals[col] = ''
    }
  })

  const handleSort = (column) => {
    setSortConfig(prev => ({
      key: column,
      direction: prev.key === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column]: value }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  return (
    <div className="reconciled-table-wrapper">
      <div className="table-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          {FILTERABLE_COLUMNS.map(col => (
            <select
              key={col}
              value={filters[col] || ''}
              onChange={(e) => handleFilterChange(col, e.target.value)}
            >
              <option value="">All {col}</option>
              {getUniqueValues(col).map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          ))}
          <button className="clear-filters-btn" onClick={clearFilters}>Clear</button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} onClick={() => handleSort(col)} className="sortable-header">
                  {col}
                  {sortConfig.key === col && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j}>{row[col]}</td>
                ))}
              </tr>
            ))}
            <tr className="totals-row">
              {columns.map((col, j) => (
                <td key={j}>{totals[col]}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CSVPreviewModal({ data, columns, title, onClose }) {
  if (!data || !columns) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 100).map((row, i) => (
                  <tr key={i}>
                    {columns.map((col, j) => (
                      <td key={j}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length > 100 && (
            <p className="preview-note">Showing first 100 of {data.length} records</p>
          )}
        </div>
      </div>
    </div>
  )
}

function FileUploader({ onUpload, onPreview, label, description, icon, dataKey, hasData, defaultFileName }) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [rowCount, setRowCount] = useState(null)

  const parseFile = (file) => {
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setFileName(file.name)
        setRowCount(result.data.length)
        onUpload(dataKey, {
          name: label,
          rows: result.data,
          columns: result.meta.fields
        })
      }
    })
  }

  const handleFileChange = (e) => {
    parseFile(e.target.files[0])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      parseFile(file)
    }
  }

  const handlePreviewClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onPreview(dataKey)
  }

  return (
    <div
      className={`file-uploader-dropzone ${isDragging ? 'dragging' : ''} ${fileName || hasData ? 'has-file' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="dropzone-icon">{icon}</div>
      <div className="dropzone-label">{label}</div>
      <div className="dropzone-description">{description}</div>
      <div className="dropzone-content">
        {fileName || hasData ? (
          <div className="file-info">
            <span className="file-name">{fileName || defaultFileName}</span>
            <span className="file-rows">{rowCount || hasData} records</span>
          </div>
        ) : (
          <span className="dropzone-hint">Drop CSV here or click to browse</span>
        )}
      </div>
      {(fileName || hasData) && (
        <button className="preview-btn-small" onClick={handlePreviewClick}>
          Preview
        </button>
      )}
      <input type="file" accept=".csv" onChange={handleFileChange} />
    </div>
  )
}

function App() {
  const [csvData, setCsvData] = useState({})
  const [loading, setLoading] = useState(true)
  const [analysisRun, setAnalysisRun] = useState(false)
  const [previewKey, setPreviewKey] = useState(null)

  const handlePreview = (key) => {
    setPreviewKey(key)
  }

  const closePreview = () => {
    setPreviewKey(null)
  }

  const runAnalysis = () => {
    setAnalysisRun(true)
  }

  const clearAll = () => {
    setCsvData({})
    setAnalysisRun(false)
  }

  const downloadReconciledCSV = () => {
    if (!reconciledData || reconciledData.length === 0) return

    const headers = Object.keys(reconciledData[0])
    const csvContent = [
      headers.join(','),
      ...reconciledData.map(row =>
        headers.map(header => {
          const value = String(row[header] || '')
          return value.includes(',') ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'reconciled_accounts.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const hasRequiredData = csvData.hubspot?.rows?.length > 0

  const generateReconciledCSV = () => {
    const hubspotData = csvData.hubspot?.rows || []
    const nooksData = csvData.nooks?.rows || []
    const instantlyData = csvData.instantly?.rows || []
    const unifyData = csvData.unify?.rows || []

    // Create lookup maps by company name
    const nooksMap = {}
    nooksData.forEach(row => {
      nooksMap[row['Company Name']] = row
    })

    const instantlyMap = {}
    instantlyData.forEach(row => {
      instantlyMap[row['Company Name']] = row
    })

    const unifyMap = {}
    unifyData.forEach(row => {
      unifyMap[row['Company Name']] = row
    })

    // Build reconciled data
    const reconciledData = hubspotData.map(company => {
      const companyName = company['Company Name']
      const nooks = nooksMap[companyName] || {}
      const instantly = instantlyMap[companyName] || {}
      const unify = unifyMap[companyName] || {}

      const dials = parseInt(nooks['Dials'] || 0)
      const connects = parseInt(nooks['Connects'] || 0)
      const conversations = parseInt(nooks['Conversations'] || 0)
      const meetings = parseInt(nooks['Meetings Set'] || 0)
      const connectRate = dials > 0 ? ((connects / dials) * 100).toFixed(1) + '%' : '0%'
      const meetingRate = dials > 0 ? ((meetings / dials) * 100).toFixed(1) + '%' : '0%'

      return {
        'Company Name': companyName,
        'Industry': company['Industry'] || '',
        'Company Size': company['Company Size'] || '',
        'Revenue Range': company['Revenue Range'] || '',
        'Lifecycle Stage': company['Lifecycle Stage'] || '',
        'Application Status': company['Application Status'] || '',
        'Dials': dials.toString(),
        'Connects': connects.toString(),
        'Connect Rate': connectRate,
        'Conversations': conversations.toString(),
        'Meetings Set': meetings.toString(),
        'Meeting Rate': meetingRate,
        'Emails Sent': instantly['Emails Sent'] || '0',
        'Email Opens': instantly['Opens'] || '0',
        'Email Clicks': instantly['Clicks'] || '0',
        'Last Website Visit': unify['Date of Last Visit'] || '',
        'Pages Visited': unify['Pages Visited'] || ''
      }
    })

    return reconciledData
  }

  const reconciledData = useMemo(() => {
    if (!csvData.hubspot) return []
    return generateReconciledCSV()
  }, [csvData])

  useEffect(() => {
    const loadCSVs = async () => {
      const data = {}

      for (const [key, config] of Object.entries(CSV_FILES)) {
        try {
          const response = await fetch(config.path)
          const text = await response.text()
          const result = Papa.parse(text, { header: true, skipEmptyLines: true })
          data[key] = {
            ...config,
            rows: result.data,
            columns: result.meta.fields
          }
        } catch (error) {
          console.error(`Error loading ${key}:`, error)
        }
      }

      setCsvData(data)
      setLoading(false)
    }

    loadCSVs()
  }, [])

  const handleUpload = (key, data) => {
    setCsvData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...data
      }
    }))
  }

  if (loading) {
    return <div className="container"><p>Loading data...</p></div>
  }

  return (
    <div className="container">
      <h1>ICP Development</h1>

      <div className="section upload-section">
        <div className="section-header">
          <h2>Upload CSV Files</h2>
        </div>
        <div className="upload-grid">
          <FileUploader
            icon="🏢"
            label="CRM Accounts"
            description="Master list of target companies"
            dataKey="hubspot"
            onUpload={handleUpload}
            onPreview={handlePreview}
            hasData={csvData.hubspot?.rows?.length}
            defaultFileName="master_list_hubspot.csv"
          />
          <FileUploader
            icon="📞"
            label="Cold Calls"
            description="Dials, connects & conversations"
            dataKey="nooks"
            onUpload={handleUpload}
            onPreview={handlePreview}
            hasData={csvData.nooks?.rows?.length}
            defaultFileName="nooks.csv"
          />
          <FileUploader
            icon="✉️"
            label="Email Outreach"
            description="Sends, opens & click data"
            dataKey="instantly"
            onUpload={handleUpload}
            onPreview={handlePreview}
            hasData={csvData.instantly?.rows?.length}
            defaultFileName="instantly.csv"
          />
          <FileUploader
            icon="🌐"
            label="Website Visits"
            description="Intent signals & page views"
            dataKey="unify"
            onUpload={handleUpload}
            onPreview={handlePreview}
            hasData={csvData.unify?.rows?.length}
            defaultFileName="unify.csv"
          />
        </div>

        <div className="run-section">
          <div className="run-buttons">
            <button
              className={`run-btn ${hasRequiredData ? 'active' : 'disabled'}`}
              onClick={runAnalysis}
              disabled={!hasRequiredData}
            >
              Run
            </button>
            <button
              className={`clear-btn ${hasRequiredData ? 'active' : 'disabled'}`}
              onClick={clearAll}
              disabled={!hasRequiredData}
            >
              Clear All
            </button>
          </div>
          {!hasRequiredData && (
            <p className="run-hint">Upload at least the CRM Accounts file to run</p>
          )}
        </div>
      </div>

      {previewKey && csvData[previewKey] && (
        <CSVPreviewModal
          data={csvData[previewKey].rows}
          columns={csvData[previewKey].columns}
          title={csvData[previewKey].name}
          onClose={closePreview}
        />
      )}

      {analysisRun && reconciledData.length > 0 && (
        <>
          <div className="section reconciled-section">
            <div className="section-header">
              <h2>Reconciled Accounts</h2>
              <button className="download-btn" onClick={downloadReconciledCSV}>
                Download CSV
              </button>
            </div>
            <p className="reconciled-description">
              Combined view of all account data from your uploaded files.
            </p>
            <ReconciledTable
              data={reconciledData}
              columns={[
                'Company Name',
                'Industry',
                'Company Size',
                'Revenue Range',
                'Lifecycle Stage',
                'Application Status',
                'Dials',
                'Connects',
                'Connect Rate',
                'Conversations',
                'Meetings Set',
                'Meeting Rate',
                'Emails Sent',
                'Email Opens',
                'Email Clicks',
                'Last Website Visit',
                'Pages Visited'
              ]}
            />
          </div>

          <div className="section sankey-section">
            <div className="section-header">
              <h2>Cold Call Pipeline Flow</h2>
            </div>
            <p className="sankey-description">
              Tracking cold call pipeline from dials to outcomes by industry. Gray flows indicate drop-offs at each stage.
            </p>
            <SankeyDiagram reconciledData={reconciledData} />
          </div>
        </>
      )}
    </div>
  )
}

export default App
