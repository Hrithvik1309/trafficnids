// src/pages/Traffic.jsx
import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, subscribeTrafficLogs } from '../services/firebase'
import { formatTimestamp, scoreGradient } from '../utils/helpers'

export default function Traffic() {
  const [traffic, setTraffic] = useState([])
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    avgSessionTime: 0,
    bounceRate: 0,
    topPages: [],
    topCountries: [],
    threatVisitors: 0,
  })

  useEffect(() => {
    return subscribeTrafficLogs(logs => {
      setTraffic(logs)
      calculateStats(logs)
    })
  }, [])

  // Generate demo traffic for testing
  async function generateDemoTraffic() {
    const demoIPs = [
      { ip: '8.8.8.8', country: 'US', city: 'Mountain View', risk: 0 },
      { ip: '1.1.1.1', country: 'AU', city: 'Sydney', risk: 0 },
      { ip: '185.220.101.1', country: 'DE', city: 'Frankfurt', risk: 85 },
      { ip: '45.142.120.10', country: 'RU', city: 'Moscow', risk: 75 },
      { ip: '104.21.48.200', country: 'US', city: 'San Francisco', risk: 0 },
    ]

    const pages = ['/', '/about', '/products', '/contact', '/blog', '/pricing']
    const referrers = ['google.com', 'facebook.com', 'twitter.com', 'direct', 'linkedin.com']

    for (const demo of demoIPs) {
      await addDoc(collection(db, 'traffic_logs'), {
        ip: demo.ip,
        page: pages[Math.floor(Math.random() * pages.length)],
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        country: demo.country,
        city: demo.city,
        riskScore: demo.risk,
        isProxy: demo.risk > 50,
        isVPN: demo.risk > 60,
        isTOR: demo.risk > 80,
        sessionTime: Math.floor(Math.random() * 300),
        bounced: Math.random() > 0.6,
        timestamp: serverTimestamp(),
        userAgent: 'Mozilla/5.0 (Demo Traffic)',
      })
    }

    alert('✅ Generated 5 demo visitors!')
  }

  function calculateStats(logs) {
    const uniqueIPs = new Set(logs.map(l => l.ip))
    const threatCount = logs.filter(l => l.riskScore >= 35).length
    
    const pageViews = {}
    const countries = {}
    let totalTime = 0
    let bounces = 0

    logs.forEach(log => {
      pageViews[log.page] = (pageViews[log.page] || 0) + 1
      countries[log.country] = (countries[log.country] || 0) + 1
      if (log.sessionTime) totalTime += log.sessionTime
      if (log.bounced) bounces++
    })

    const topPages = Object.entries(pageViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([page, views]) => ({ page, views }))

    const topCountries = Object.entries(countries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country, visits]) => ({ country, visits }))

    setStats({
      totalVisits: logs.length,
      uniqueVisitors: uniqueIPs.size,
      avgSessionTime: logs.length ? Math.round(totalTime / logs.length) : 0,
      bounceRate: logs.length ? Math.round((bounces / logs.length) * 100) : 0,
      topPages,
      topCountries,
      threatVisitors: threatCount,
    })
  }

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'IBM Plex Mono', monospace", color: '#E2E8F0' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
          Real-time Analytics
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>Website Traffic</h1>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
          Track visitors and automatically scan for threats
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Visits" value={stats.totalVisits} color="#4FC3F7" icon="👁" />
        <StatCard label="Unique Visitors" value={stats.uniqueVisitors} color="#C084FC" icon="👤" />
        <StatCard label="Avg Session" value={`${stats.avgSessionTime}s`} color="#4ADE80" icon="⏱" />
        <StatCard label="Threat Visitors" value={stats.threatVisitors} color="#FF4444" icon="⚠" />
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        {/* Top Pages */}
        <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Top Pages
          </div>
          {stats.topPages.length === 0 ? (
            <div style={{ color: '#1F2937', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
              No traffic data yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.topPages.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {item.page}
                  </span>
                  <span style={{ fontSize: 12, color: '#4FC3F7', fontWeight: 700 }}>{item.views}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Countries */}
        <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Top Countries
          </div>
          {stats.topCountries.length === 0 ? (
            <div style={{ color: '#1F2937', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
              No traffic data yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.topCountries.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{item.country}</span>
                  <span style={{ fontSize: 12, color: '#C084FC', fontWeight: 700 }}>{item.visits}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tracking Code */}
      <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              Installation — Add to your website
            </div>
            <div style={{ fontSize: 11, color: '#4B5563' }}>
              Copy this script and paste it before the closing &lt;/body&gt; tag on your website
            </div>
          </div>
          <button
            onClick={generateDemoTraffic}
            style={{
              padding: '9px 18px', borderRadius: 7, cursor: 'pointer',
              background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.3)',
              color: '#C084FC', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
            }}
          >
            🎲 Generate Demo Traffic
          </button>
        </div>
        <pre style={{
          background: '#060A10', border: '1px solid #1F2937', borderRadius: 7,
          padding: '14px', fontSize: 11, color: '#4FC3F7', overflow: 'auto',
          fontFamily: 'monospace',
        }}>
{`<script>
(function() {
  const API_URL = 'http://localhost:5000/api/track';
  const data = {
    page: window.location.pathname,
    referrer: document.referrer,
    timestamp: Date.now()
  };
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(err => console.error('Tracking error:', err));
})();
</script>`}
        </pre>
      </div>

      {/* Live Traffic Table */}
      <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #0F1923' }}>
          <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Live Visitors
          </div>
        </div>

        {traffic.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#1F2937', fontSize: 13 }}>
            No visitors yet — Add the tracking script to your website
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#060A10' }}>
                  {['IP Address', 'Page', 'Country', 'Risk Score', 'Time'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: 9,
                      color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase',
                      borderBottom: '1px solid #0F1923', whiteSpace: 'nowrap', fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {traffic.slice(0, 50).map((log, i) => (
                  <tr key={log.id || i} style={{
                    borderBottom: '1px solid #0B1118',
                    background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  }}>
                    <td style={{ padding: '9px 14px', fontSize: 12, color: '#E2E8F0', fontFamily: 'monospace' }}>
                      {log.ip}
                    </td>
                    <td style={{ padding: '9px 14px', fontSize: 11, color: '#6B7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.page}
                    </td>
                    <td style={{ padding: '9px 14px', fontSize: 11, color: '#6B7280' }}>{log.country}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: scoreGradient(log.riskScore || 0) }}>
                        {log.riskScore || 0}
                      </span>
                    </td>
                    <td style={{ padding: '9px 14px', fontSize: 10, color: '#374151', whiteSpace: 'nowrap' }}>
                      {formatTimestamp(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: '#0B1118', border: `1px solid ${color}25`,
      borderRadius: 10, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#F9FAFB', fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{label}</div>
    </div>
  )
}
