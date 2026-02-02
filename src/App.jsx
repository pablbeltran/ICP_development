import { useState, useEffect } from 'react'
import Papa from 'papaparse'

const CSV_FILES = {
  hubspot: {
    name: 'Master List of Accounts',
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
            label="Master List of Accounts"
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
          <h2>Master List of Accounts</h2>
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
    </div>
  )
}

export default App
