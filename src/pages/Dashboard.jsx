// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { subscribeThreatLogs, subscribeAlerts } from '../services/firebase'
import { severityStyle, formatTimestamp, scoreGradient, TAG_COLORS } from '../utils/helpers'

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: '#0B1118', border: `1px solid ${color}25`,
      borderRadius: 10, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 60, height: 60,
        background: `radial-gradient(circle at top right, ${color}18, transparent 70%)`,
      }} />
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#F9FAFB', fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: color, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0B1118', border: '1px solid #1F2937',
      borderRadius: 7, padding: '8px 12px', fontSize: 12,
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <div style={{ color: '#94A3B8', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

// ── Tag pill ──────────────────────────────────────────────────────────────────
function Tag({ label }) {
  const color = TAG_COLORS[label] || '#64748B'
  return (
    <span style={{
      fontSize: 9, padding: '2px 7px', borderRadius: 3,
      background: `${color}18`, border: `1px solid ${color}40`,
      color, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>{label}</span>
  )
}

export default function Dashboard() {
  const [logs,   setLogs]   = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const u1 = subscribeThreatLogs(setLogs)
    const u2 = subscribeAlerts(setAlerts)
    return () => { u1(); u2() }
  }, [])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const total    = logs.length
  const critical = logs.filter(l => l.riskScore >= 80).length
  const high     = logs.filter(l => l.riskScore >= 60 && l.riskScore < 80).length
  const clean    = logs.filter(l => l.riskScore < 35).length

  // ── Area chart: threats over last 24 hours by hour ─────────────────────────
  const hourlyData = (() => {
    const now   = Date.now()
    const hours = Array.from({ length: 12 }, (_, i) => {
      const h = new Date(now - (11 - i) * 3_600_000)
      return {
        label: h.getHours().toString().padStart(2, '0') + ':00',
        threats: 0, clean: 0,
      }
    })
    logs.forEach(log => {
      const ts = log.createdAt?.toDate?.() ?? new Date(log.scannedAt)
      const diffH = Math.floor((now - ts.getTime()) / 3_600_000)
      if (diffH < 12) {
        const idx = 11 - diffH
        if (log.riskScore >= 35) hours[idx].threats++
        else hours[idx].clean++
      }
    })
    return hours
  })()

  // ── Pie chart: severity breakdown ─────────────────────────────────────────
  const pieData = [
    { name: 'Critical', value: logs.filter(l => l.riskScore >= 80).length,              color: '#FF4444' },
    { name: 'High',     value: logs.filter(l => l.riskScore >= 60 && l.riskScore < 80).length, color: '#FF8C00' },
    { name: 'Medium',   value: logs.filter(l => l.riskScore >= 35 && l.riskScore < 60).length, color: '#F5C518' },
    { name: 'Clean',    value: logs.filter(l => l.riskScore < 35).length,               color: '#4ADE80' },
  ].filter(d => d.value > 0)

  // ── Bar chart: top countries ───────────────────────────────────────────────
  const countryMap = {}
  logs.forEach(l => {
    if (l.riskScore >= 35) countryMap[l.countryCode] = (countryMap[l.countryCode] || 0) + 1
  })
  const countryData = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([country, count]) => ({ country, count }))

  return (
    <div style={{
      padding: '28px 32px',
      fontFamily: "'IBM Plex Mono', monospace",
      color: '#E2E8F0',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
            Overview
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>Threat Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80', animation: 'blink 2s infinite' }} />
          <span style={{ fontSize: 11, color: '#374151' }}>Live — Firebase Realtime</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Scans"      value={total}    color="#4FC3F7" icon="◎" sub={`${logs.length} IPs analyzed`} />
        <StatCard label="Critical Threats" value={critical} color="#FF4444" icon="⚠" sub="Score ≥ 80" />
        <StatCard label="High Risk"        value={high}     color="#FF8C00" icon="◈" sub="Score 60–79" />
        <StatCard label="Clean IPs"        value={clean}    color="#4ADE80" icon="✓" sub="Score < 35" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 14, marginBottom: 24 }}>

        {/* Area chart */}
        <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '18px 16px' }}>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Activity — Last 12 Hours
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="gThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ADE80" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#0F1923" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#374151', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#374151', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="threats" stroke="#FF4444" fill="url(#gThreats)" strokeWidth={1.5} name="Threats" dot={false} />
              <Area type="monotone" dataKey="clean"   stroke="#4ADE80" fill="url(#gClean)"   strokeWidth={1.5} name="Clean"   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart — countries */}
        <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '18px 16px' }}>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Top Threat Origins
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={countryData} barSize={18}>
              <CartesianGrid stroke="#0F1923" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="country" tick={{ fill: '#374151', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#374151', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Threats" radius={[3, 3, 0, 0]}>
                {countryData.map((_, i) => (
                  <Cell key={i} fill={['#FF4444','#FF6B6B','#FF8C00','#F5C518','#4FC3F7','#C084FC'][i % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '18px 16px' }}>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Severity Breakdown
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 10, color: '#4B5563' }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F2937', fontSize: 12 }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent threats table */}
      <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #0F1923',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Recent Threat Logs
          </div>
          <div style={{ fontSize: 10, color: '#1F2937' }}>{logs.length} entries</div>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#1F2937', fontSize: 13 }}>
            No scans yet — head to IP Scanner to run your first check
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['IP Address','Risk Score','Severity','Tags','Country','ISP','Scanned At'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 9, color: '#374151', letterSpacing: '0.12em',
                      textTransform: 'uppercase', borderBottom: '1px solid #0F1923',
                      whiteSpace: 'nowrap', fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 20).map((log, i) => {
                  const sev = severityStyle(log.severity)
                  return (
                    <tr key={log.id || i} style={{
                      borderBottom: '1px solid #0B1118',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#E2E8F0', fontFamily: 'monospace' }}>
                        {log.ip}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 36, height: 4, borderRadius: 2, background: '#0F1923', overflow: 'hidden'
                          }}>
                            <div style={{ height: '100%', width: `${log.riskScore}%`, background: scoreGradient(log.riskScore), borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 12, color: scoreGradient(log.riskScore), fontWeight: 700 }}>
                            {log.riskScore}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: 10, padding: '3px 8px', borderRadius: 4,
                          background: sev.bg, border: `1px solid ${sev.border}`,
                          color: sev.color, letterSpacing: '0.08em',
                        }}>
                          {log.severity}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(log.tags || []).map(t => <Tag key={t} label={t} />)}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#6B7280' }}>{log.countryCode}</td>
                      <td style={{ padding: '10px 16px', fontSize: 11, color: '#4B5563', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.isp}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 11, color: '#374151', whiteSpace: 'nowrap' }}>
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

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
