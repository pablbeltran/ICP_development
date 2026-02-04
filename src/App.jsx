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
    name: 'Nooks',
    path: '/data/nooks.csv',
    category: 'outreach'
  },
  instantly: {
    name: 'Instantly',
    path: '/data/instantly.csv',
    category: 'outreach'
  },
  unify: {
    name: 'Unify',
    path: '/data/unify.csv',
    category: 'outreach'
  }
}

function CSVTable({ data, columns }) {
  if (!data || data.length === 0) return <p>No data available</p>

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => (
                <td key={j}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const NUMERIC_COLUMNS = ['Dials', 'Connects', 'Conversations', 'Meetings Set', 'Emails Sent', 'Email Opens', 'Email Clicks']
const FILTERABLE_COLUMNS = ['Industry', 'Company Size', 'Lifecycle Stage', 'Application Status']

function ReconciledTable({ data, columns }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  if (!data || data.length === 0) return <p>No data available</p>

  // Get unique values for filter dropdowns
  const getUniqueValues = (column) => {
    const values = [...new Set(data.map(row => row[column]).filter(Boolean))]
    return values.sort()
  }

  // Apply filters and search
  const filteredData = data.filter(row => {
    // Check search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchLower)
      )
      if (!matchesSearch) return false
    }

    // Check filters
    for (const [column, value] of Object.entries(filters)) {
      if (value && row[column] !== value) return false
    }

    return true
  })

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0

    let aVal = a[sortConfig.key]
    let bVal = b[sortConfig.key]

    // Handle numeric sorting
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

  // Calculate totals
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
    setFilters(prev => ({
      ...prev,
      [column]: value
    }))
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
                <th
                  key={i}
                  onClick={() => handleSort(col)}
                  className="sortable-header"
                >
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

function CSVCard({ title, data, columns, stats }) {
  return (
    <div className="csv-card">
      <div className="csv-card-header">
        <h3>{title}</h3>
      </div>
      <CSVTable data={data} columns={columns} />
      {stats && (
        <div className="stats">
          {stats.map((stat, i) => (
            <div key={i} className="stat">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FileUploader({ onUpload, label, dataKey }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        onUpload(dataKey, {
          name: label,
          rows: result.data,
          columns: result.meta.fields
        })
      }
    })
  }

  return (
    <div className="file-uploader">
      <label>{label}</label>
      <input type="file" accept=".csv" onChange={handleFileChange} />
    </div>
  )
}

function App() {
  const [csvData, setCsvData] = useState({})
  const [loading, setLoading] = useState(true)

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

  const downloadReconciledCSV = () => {
    const data = reconciledData
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header] || ''
          // Wrap in quotes if contains comma
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

  const calculateStats = (key) => {
    const data = csvData[key]?.rows
    if (!data || data.length === 0) return null

    if (key === 'nooks') {
      const totalDials = data.reduce((sum, row) => sum + parseInt(row['Dials'] || 0), 0)
      const totalConnects = data.reduce((sum, row) => sum + parseInt(row['Connects'] || 0), 0)
      const totalMeetings = data.reduce((sum, row) => sum + parseInt(row['Meetings Set'] || 0), 0)
      return [
        { label: 'Total Dials', value: totalDials.toLocaleString() },
        { label: 'Total Connects', value: totalConnects.toLocaleString() },
        { label: 'Total Meetings', value: totalMeetings },
        { label: 'Avg Connect Rate', value: ((totalConnects / totalDials) * 100).toFixed(1) + '%' }
      ]
    }

    if (key === 'instantly') {
      const totalSent = data.reduce((sum, row) => sum + parseInt(row['Emails Sent'] || 0), 0)
      const totalOpens = data.reduce((sum, row) => sum + parseInt(row['Opens'] || 0), 0)
      const totalClicks = data.reduce((sum, row) => sum + parseInt(row['Clicks'] || 0), 0)
      return [
        { label: 'Total Emails', value: totalSent.toLocaleString() },
        { label: 'Total Opens', value: totalOpens.toLocaleString() },
        { label: 'Total Clicks', value: totalClicks },
        { label: 'Avg Open Rate', value: ((totalOpens / totalSent) * 100).toFixed(1) + '%' }
      ]
    }

    if (key === 'unify') {
      return [
        { label: 'Companies Tracked', value: data.length }
      ]
    }

    return null
  }

  if (loading) {
    return <div className="container"><p>Loading data...</p></div>
  }

  return (
    <div className="container">
      <h1>ICP Development</h1>

      <div className="section upload-section">
        <div className="section-header">
          <h2>Upload Your Own CSV Files</h2>
        </div>
        <p className="upload-description">Replace the sample data with your own CSV files.</p>
        <div className="upload-grid">
          <FileUploader
            label="Master List of Accounts (CRM)"
            dataKey="hubspot"
            onUpload={handleUpload}
          />
          <FileUploader
            label="Nooks"
            dataKey="nooks"
            onUpload={handleUpload}
          />
          <FileUploader
            label="Instantly"
            dataKey="instantly"
            onUpload={handleUpload}
          />
          <FileUploader
            label="Unify"
            dataKey="unify"
            onUpload={handleUpload}
          />
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Master List of Accounts (CRM)</h2>
        </div>
        {csvData.hubspot && (
          <CSVCard
            title={csvData.hubspot.name}
            data={csvData.hubspot.rows}
            columns={csvData.hubspot.columns}
            stats={[
              { label: 'Total Companies', value: csvData.hubspot.rows.length }
            ]}
          />
        )}
      </div>

      <div className="section outreach-section">
        <div className="section-header">
          <h2>Mock Data from Outreach Platforms</h2>
        </div>

        <div className="outreach-grid">
          {csvData.nooks && (
            <CSVCard
              title={csvData.nooks.name}
              data={csvData.nooks.rows}
              columns={csvData.nooks.columns}
              stats={calculateStats('nooks')}
            />
          )}

          {csvData.instantly && (
            <CSVCard
              title={csvData.instantly.name}
              data={csvData.instantly.rows}
              columns={csvData.instantly.columns}
              stats={calculateStats('instantly')}
            />
          )}

          {csvData.unify && (
            <CSVCard
              title={csvData.unify.name}
              data={csvData.unify.rows}
              columns={csvData.unify.columns}
              stats={calculateStats('unify')}
            />
          )}
        </div>
      </div>

      <div className="section reconciled-section">
        <div className="section-header">
          <h2>Reconciled Account Data</h2>
          <button className="download-btn" onClick={downloadReconciledCSV}>
            Download CSV
          </button>
        </div>
        <p className="reconciled-description">
          Combined view of all account data from CRM, Nooks, Instantly, and Unify.
        </p>
        {csvData.hubspot && (
          <div className="csv-card">
            <div className="csv-card-header">
              <h3>Reconciled Accounts</h3>
            </div>
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
        )}
      </div>

      {reconciledData.length > 0 && (
        <div className="section sankey-section">
          <div className="section-header">
            <h2>Cold Call Pipeline Flow</h2>
          </div>
          <p className="sankey-description">
            Tracking cold call pipeline from dials to outcomes by industry. Gray flows indicate drop-offs at each stage.
          </p>
          <SankeyDiagram reconciledData={reconciledData} />
        </div>
      )}
    </div>
  )
}

export default App
