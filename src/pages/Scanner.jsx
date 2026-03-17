// src/pages/Scanner.jsx
import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { scanIP, bulkScanIPs } from '../services/threatService'
import { severityStyle, scoreGradient, TAG_COLORS, isValidIP } from '../utils/helpers'

function Tag({ label }) {
  const color = TAG_COLORS[label] || '#64748B'
  return (
    <span style={{
      fontSize: 10, padding: '3px 9px', borderRadius: 4,
      background: `${color}18`, border: `1px solid ${color}40`,
      color, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>{label}</span>
  )
}

function ScoreRing({ score }) {
  const color = scoreGradient(score)
  const r = 36, c = 2 * Math.PI * r
  const dash = (score / 100) * c
  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={r} fill="none" stroke="#0F1923" strokeWidth={6} />
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 4px ${color})` }}
      />
      <text x={45} y={49} textAnchor="middle" fill={color}
        style={{ fontSize: 18, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace" }}>
        {score}
      </text>
    </svg>
  )
}

function ResultCard({ result }) {
  const sev = severityStyle(result.severity)
  return (
    <div style={{
      background: '#0B1118',
      border: `1px solid ${sev.border}`,
      borderRadius: 12, padding: '22px 24px',
      marginTop: 20,
      animation: 'fadeUp 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
        <ScoreRing score={result.riskScore} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', fontFamily: 'monospace' }}>
              {result.ip}
            </span>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 5,
              background: sev.bg, border: `1px solid ${sev.border}`,
              color: sev.color, fontWeight: 700,
            }}>{result.severity}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {result.tags.map(t => <Tag key={t} label={t} />)}
          </div>
          <div style={{ fontSize: 12, color: '#4B5563' }}>
            {result.city && `${result.city}, `}{result.countryCode} · {result.isp}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 10, padding: '14px 0', borderTop: '1px solid #0F1923', borderBottom: '1px solid #0F1923',
        marginBottom: 14,
      }}>
        {[
          { label: 'AbuseIPDB Score',  value: result.abuseScore,  source: 'AbuseIPDB',      color: '#4FC3F7' },
          { label: 'Proxy Score',      value: result.proxyScore,  source: 'IP-API',         color: '#4ADE80' },
          { label: 'Abuse Reports',    value: result.totalReports,source: 'AbuseIPDB',       color: '#FBBF24' },
          { label: 'Usage Type',       value: result.usageType,   source: 'AbuseIPDB',      color: '#F87171' },
        ].map(item => (
          <div key={item.label} style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 9, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              {item.label}
              <span style={{ marginLeft: 6, color: item.color, fontSize: 8 }}>via {item.source}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>
              {item.value ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Flags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { key: 'isProxy', label: 'Proxy',  color: '#FF6B6B' },
          { key: 'isHosting', label: 'Hosting', color: '#4ADE80' },
        ].map(flag => {
          const val = result.rawIPAPI?.[flag.key]
          return (
            <div key={flag.key} style={{
              fontSize: 10, padding: '4px 10px', borderRadius: 5,
              background: val ? `${flag.color}18` : '#0F1923',
              border: `1px solid ${val ? flag.color + '40' : '#1F2937'}`,
              color: val ? flag.color : '#374151',
            }}>
              {val ? '✓' : '✗'} {flag.label}
              <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>IP-API</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Scanner() {
  const [ip,          setIp]          = useState('')
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState(null)
  const [error,       setError]       = useState(null)
  const [bulkResults, setBulkResults] = useState([])
  const [bulkProgress,setBulkProgress]= useState(null)
  const fileRef = useRef()

  console.log('Scanner render - result:', result)

  async function handleScan() {
    if (!ip.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      console.log('Starting scan for IP:', ip)
      const data = await scanIP(ip)
      console.log('Scan result:', data)
      console.log('Setting result state...')
      setResult(data)
      console.log('Result state set')
    } catch (e) {
      console.error('Scan error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      complete: async ({ data }) => {
        const ips = data.flat().map(s => s.trim()).filter(isValidIP)
        if (!ips.length) return setError('No valid IPs found in CSV')
        setBulkResults([]); setBulkProgress({ done: 0, total: ips.length })
        const results = await bulkScanIPs(ips, (done, total) => setBulkProgress({ done, total }))
        setBulkResults(results)
        setBulkProgress(null)
      }
    })
    e.target.value = ''
  }

  const sev = result ? severityStyle(result.severity) : null

  return (
    <div style={{
      padding: '28px 32px', fontFamily: "'IBM Plex Mono', monospace",
      color: '#E2E8F0', maxWidth: 760,
    }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
          Threat Intelligence
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>IP Scanner</h1>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
          Queries <span style={{ color: '#4FC3F7' }}>AbuseIPDB</span> + <span style={{ color: '#4ADE80' }}>IP-API</span> in parallel.
          Results are stored to Firebase Firestore automatically.
        </p>
      </div>

      {/* Scan input */}
      <div style={{
        background: '#0B1118', border: '1px solid #0F1923',
        borderRadius: 10, padding: '20px',
      }}>
        <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Single IP Scan
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={ip}
            onChange={e => setIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            placeholder="e.g. 8.8.8.8 or 192.168.1.1"
            style={{
              flex: 1, background: '#060A10', border: '1px solid #1F2937',
              borderRadius: 7, padding: '11px 14px', color: '#E2E8F0',
              fontSize: 13, fontFamily: 'monospace', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e  => e.target.style.borderColor = '#FF4444'}
            onBlur={e   => e.target.style.borderColor = '#1F2937'}
          />
          <button
            onClick={handleScan}
            disabled={loading || !ip.trim()}
            style={{
              padding: '11px 22px', borderRadius: 7, cursor: 'pointer',
              background: loading ? '#1F2937' : 'rgba(255,68,68,0.15)',
              border: '1px solid rgba(255,68,68,0.4)',
              color: loading ? '#374151' : '#FF6B6B',
              fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600, letterSpacing: '0.05em',
              transition: 'all 0.15s',
            }}
          >
            {loading ? '◎ Scanning...' : '◎ Scan IP'}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 6,
            background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)',
            fontSize: 12, color: '#FF6B6B',
          }}>
            ✗ {error}
          </div>
        )}
      </div>

      {result && <ResultCard result={result} />}

      {/* Bulk CSV */}
      <div style={{
        background: '#0B1118', border: '1px solid #0F1923',
        borderRadius: 10, padding: '20px', marginTop: 16,
      }}>
        <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Bulk Scan — CSV Upload
        </div>
        <div style={{ fontSize: 11, color: '#1F2937', marginBottom: 12 }}>
          One IP per row (or one-column CSV). Rate-limited to 3 concurrent requests.
        </div>
        <input type="file" accept=".csv,.txt" ref={fileRef} onChange={handleCSV} style={{ display: 'none' }} />
        <button onClick={() => fileRef.current.click()} style={{
          padding: '9px 18px', borderRadius: 7, cursor: 'pointer',
          background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.3)',
          color: '#4FC3F7', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
        }}>
          ↑ Upload CSV
        </button>

        {bulkProgress && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#374151' }}>Scanning {bulkProgress.done} / {bulkProgress.total} IPs</span>
              <span style={{ fontSize: 11, color: '#4FC3F7' }}>{Math.round((bulkProgress.done / bulkProgress.total) * 100)}%</span>
            </div>
            <div style={{ height: 3, background: '#0F1923', borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2, background: '#4FC3F7',
                width: `${(bulkProgress.done / bulkProgress.total) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {bulkResults.length > 0 && (
          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['IP','Score','Severity','Tags','Country'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid #0F1923' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bulkResults.map((r, i) => {
                  const s = severityStyle(r.severity)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #0B1118' }}>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'monospace', color: '#E2E8F0' }}>{r.ip}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: scoreGradient(r.riskScore) }}>{r.riskScore}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{r.severity}</span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>{(r.tags || []).map(t => <Tag key={t} label={t} />)}</div>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: '#6B7280' }}>{r.countryCode}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
