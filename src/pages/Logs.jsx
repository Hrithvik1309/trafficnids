// src/pages/Logs.jsx
import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { subscribeThreatLogs } from '../services/firebase'
import { severityStyle, formatTimestamp, scoreGradient, TAG_COLORS } from '../utils/helpers'

function Tag({ label }) {
  const color = TAG_COLORS[label] || '#64748B'
  return (
    <span style={{
      fontSize: 9, padding: '2px 7px', borderRadius: 3,
      background: `${color}18`, color, border: `1px solid ${color}30`,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>{label}</span>
  )
}

export default function Logs() {
  const [logs,    setLogs]    = useState([])
  const [search,  setSearch]  = useState('')
  const [sevFilter, setSevFilter] = useState('All')

  useEffect(() => subscribeThreatLogs(setLogs), [])

  function exportCSV() {
    const rows = logs.map(l => ({
      IP:           l.ip,
      RiskScore:    l.riskScore,
      Severity:     l.severity,
      Tags:         (l.tags || []).join(' | '),
      Country:      l.countryCode,
      ISP:          l.isp,
      AbuseScore:   l.abuseScore,
      FraudScore:   l.proxyScore,
      TotalReports: l.totalReports,
      ScannedAt:    formatTimestamp(l.createdAt || l.scannedAt),
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `nids_logs_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low', 'Clean']

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.ip.includes(search) || (l.isp || '').toLowerCase().includes(search.toLowerCase())
    const matchSev    = sevFilter === 'All' || l.severity === sevFilter
    return matchSearch && matchSev
  })

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'IBM Plex Mono', monospace", color: '#E2E8F0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
            Firebase Firestore · threat_logs
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>Threat Logs</h1>
        </div>
        <button onClick={exportCSV} style={{
          padding: '9px 18px', borderRadius: 7, cursor: 'pointer',
          background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)',
          color: '#4ADE80', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
        }}>
          ↓ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search IP or ISP..."
          style={{
            background: '#0B1118', border: '1px solid #1F2937', borderRadius: 7,
            padding: '8px 14px', color: '#E2E8F0', fontSize: 12,
            fontFamily: 'monospace', outline: 'none', width: 220,
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {severities.map(s => {
            const active = sevFilter === s
            const sc = s !== 'All' ? severityStyle(s) : null
            return (
              <button key={s} onClick={() => setSevFilter(s)} style={{
                padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 10,
                background: active && sc ? sc.bg : active ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: active && sc ? `1px solid ${sc.border}` : active ? '1px solid #374151' : '1px solid #1F2937',
                color: active && sc ? sc.color : active ? '#E2E8F0' : '#374151',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>{s}</button>
            )
          })}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#374151', alignSelf: 'center' }}>
          {filtered.length} / {logs.length} entries
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#1F2937', fontSize: 13 }}>
            No logs match your filters
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#060A10' }}>
                  {['IP Address','Risk','Severity','Tags','Country','ISP','Abuse','Proxy','Reports','Time'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: 9,
                      color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase',
                      borderBottom: '1px solid #0F1923', whiteSpace: 'nowrap', fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const sev = severityStyle(log.severity)
                  return (
                    <tr key={log.id || i} style={{
                      borderBottom: '1px solid #0B1118',
                      background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                    >
                      <td style={{ padding: '9px 14px', fontSize: 12, color: '#E2E8F0', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {log.ip}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 28, height: 3, borderRadius: 2, background: '#0F1923', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${log.riskScore}%`, background: scoreGradient(log.riskScore), borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: scoreGradient(log.riskScore) }}>{log.riskScore}</span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, letterSpacing: '0.08em' }}>
                          {log.severity}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap' }}>
                          {(log.tags || []).slice(0, 3).map(t => <Tag key={t} label={t} />)}
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: 11, color: '#6B7280' }}>{log.countryCode}</td>
                      <td style={{ padding: '9px 14px', fontSize: 11, color: '#4B5563', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.isp}
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: 11, color: '#4FC3F7', fontWeight: 600 }}>{log.abuseScore}</td>
                      <td style={{ padding: '9px 14px', fontSize: 11, color: '#4ADE80', fontWeight: 600 }}>{log.proxyScore}</td>
                      <td style={{ padding: '9px 14px', fontSize: 11, color: '#FBBF24' }}>{log.totalReports}</td>
                      <td style={{ padding: '9px 14px', fontSize: 10, color: '#374151', whiteSpace: 'nowrap' }}>
                        {formatTimestamp(log.createdAt || log.scannedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
