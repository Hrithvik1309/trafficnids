import { useState } from 'react'
import axios from 'axios'

export default function WebsiteAnalyzer() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function testComprehensiveIP() {
    try {
      setLoading(true)
      setError(null)
      
      const { data } = await axios.get('/api/test-comprehensive-ip')
      
      if (data.success) {
        const sources = data.result.sources.join(', ')
        const riskScore = data.result.riskScore
        const country = data.result.country
        const city = data.result.city
        
        alert(`✅ Comprehensive IP Scanner Working!\n\nTest IP: ${data.testIP}\nSources Used: ${sources}\nCountry: ${country}\nCity: ${city}\nRisk Score: ${riskScore}%\n\nThis uses multiple FREE APIs for better accuracy!`)
      } else {
        setError(`❌ Comprehensive IP Test Failed: ${data.error}`)
      }
    } catch (e) {
      setError(`❌ Comprehensive IP Test Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function testServerConnection() {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Testing server connection...')
      const { data } = await axios.get('/api/debug')
      
      console.log('Server response:', data)
      alert(`✅ Server Connection OK!\nTimestamp: ${data.timestamp}\nIPQS Key: ${data.environment.hasIPQSKey ? 'Present' : 'Missing'}\nPageSpeed Key: ${data.environment.hasPageSpeedKey ? 'Present' : 'Missing'}`)
    } catch (e) {
      console.error('Server connection error:', e)
      setError(`❌ Server Connection Failed: ${e.message}`)
      
      // Additional debugging info
      if (e.response) {
        console.log('Response status:', e.response.status)
        console.log('Response data:', e.response.data)
      } else if (e.request) {
        console.log('No response received:', e.request)
      }
    } finally {
      setLoading(false)
    }
  }

  async function testIPQSAPI() {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/test-ipqs')
      
      if (data.success) {
        setError(null)
        alert(`✅ IPQS API is working!\nKey: ${data.keyPrefix}\nTest IP: ${data.testIP}\nCountry: ${data.results.country}\nFraud Score: ${data.results.fraudScore}%`)
      } else {
        setError(`❌ IPQS API Test Failed: ${data.error}`)
        console.log('IPQS Error Details:', data)
      }
    } catch (e) {
      setError(`❌ IPQS Test Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function testPageSpeedAPI() {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/test-pagespeed')
      
      if (data.success) {
        setError(null)
        alert(`✅ PageSpeed API is working!\nKey: ${data.keyPrefix}...\nTest Score: ${data.performanceScore}`)
      } else {
        setError(`❌ API Test Failed: ${data.error}`)
      }
    } catch (e) {
      setError(`❌ Test Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function analyzeWebsite() {
    if (!url.trim()) return
    
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Clean URL (remove http/https and trailing slash)
      const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
      
      console.log('Analyzing domain:', domain)

      // Use proxy API URL
      const API_URL = '/api'
      const { data } = await axios.get(`${API_URL}/analyze-website?domain=${domain}`)
      
      setResult(data)
    } catch (e) {
      console.error('Analysis error:', e)
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'IBM Plex Mono', monospace", color: '#E2E8F0', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
          Traffic Intelligence
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#F9FAFB' }}>Website Analyzer</h1>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
          Analyze any website's traffic, performance, and security metrics
        </p>
      </div>

      {/* Input */}
      <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Enter Website URL
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyzeWebsite()}
            placeholder="e.g. example.com or https://example.com"
            style={{
              flex: 1, minWidth: 200, background: '#060A10', border: '1px solid #1F2937',
              borderRadius: 7, padding: '11px 14px', color: '#E2E8F0',
              fontSize: 13, fontFamily: 'monospace', outline: 'none',
            }}
          />
          <button
            onClick={testServerConnection}
            disabled={loading}
            style={{
              padding: '11px 14px', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.4)',
              color: '#3B82F6',
              fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
            }}
          >
            🔗 Server
          </button>
          <button
            onClick={testComprehensiveIP}
            disabled={loading}
            style={{
              padding: '11px 14px', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
              background: 'rgba(168,85,247,0.15)',
              border: '1px solid rgba(168,85,247,0.4)',
              color: '#A855F7',
              fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
            }}
          >
            🔍 Multi-IP
          </button>
          <button
            onClick={testIPQSAPI}
            disabled={loading}
            style={{
              padding: '11px 14px', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
              background: 'rgba(255,165,0,0.15)',
              border: '1px solid rgba(255,165,0,0.4)',
              color: '#FFA500',
              fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
            }}
          >
            🛡️ IPQS
          </button>
          <button
            onClick={testPageSpeedAPI}
            disabled={loading}
            style={{
              padding: '11px 14px', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#22C55E',
              fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
            }}
          >
            🧪 PageSpeed
          </button>
          <button
            onClick={analyzeWebsite}
            disabled={loading || !url.trim()}
            style={{
              padding: '11px 22px', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#1F2937' : 'rgba(192,132,252,0.15)',
              border: '1px solid rgba(192,132,252,0.4)',
              color: loading ? '#374151' : '#C084FC',
              fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
            }}
          >
            {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
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

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <MetricCard label="Monthly Visits" value={formatNumber(result?.visits)} color="#4FC3F7" icon="👁" />
            <MetricCard label="Avg Visit Duration" value={result?.avgDuration || 'N/A'} color="#C084FC" icon="⏱" />
            <MetricCard label="Pages per Visit" value={result?.pagesPerVisit || 'N/A'} color="#4ADE80" icon="📄" />
            <MetricCard label="Bounce Rate" value={result?.bounceRate || 'N/A'} color="#FF8C00" icon="↩" />
          </div>

          {/* Traffic Sources */}
          <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '20px' }}>
            <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Traffic Sources
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {result?.trafficSources?.map((source, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{source.icon}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{source.name}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: source.color }}>{source.percentage}%</div>
                </div>
              )) || <div style={{ color: '#6B7280', fontSize: 12 }}>No traffic source data available</div>}
            </div>
          </div>

          {/* Geography & Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Top Countries */}
            <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '20px' }}>
              <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                Top Countries
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result?.topCountries?.map((country, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{country.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, background: '#0F1923', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${country.percentage}%`, height: '100%', background: '#4FC3F7', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#4FC3F7', fontWeight: 700, minWidth: 35, textAlign: 'right' }}>
                        {country.percentage}%
                      </span>
                    </div>
                  </div>
                )) || <div style={{ color: '#6B7280', fontSize: 12 }}>No country data available</div>}
              </div>
            </div>

            {/* Performance Metrics */}
            <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '20px' }}>
              <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                Performance & Security
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result?.performance?.map((metric, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{metric.label}</span>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 5,
                      background: metric.status === 'Good' ? 'rgba(74,222,128,0.1)' : metric.status === 'Warning' ? 'rgba(245,197,24,0.1)' : 'rgba(255,68,68,0.1)',
                      color: metric.status === 'Good' ? '#4ADE80' : metric.status === 'Warning' ? '#F5C518' : '#FF4444',
                      border: `1px solid ${metric.status === 'Good' ? 'rgba(74,222,128,0.3)' : metric.status === 'Warning' ? 'rgba(245,197,24,0.3)' : 'rgba(255,68,68,0.3)'}`,
                    }}>
                      {metric.value}
                    </span>
                  </div>
                )) || <div style={{ color: '#6B7280', fontSize: 12 }}>No performance data available</div>}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div style={{ background: '#0B1118', border: '1px solid #0F1923', borderRadius: 10, padding: '20px' }}>
            <div style={{ fontSize: 10, color: '#374151', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              💡 Recommendations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result?.recommendations?.map((rec, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 6,
                  background: 'rgba(79,195,247,0.05)', border: '1px solid rgba(79,195,247,0.2)',
                  fontSize: 12, color: '#94A3B8', lineHeight: 1.6,
                }}>
                  <span style={{ color: '#4FC3F7', marginRight: 8 }}>→</span>
                  {rec}
                </div>
              )) || <div style={{ color: '#6B7280', fontSize: 12 }}>No recommendations available</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color, icon }) {
  return (
    <div style={{ background: '#0B1118', border: `1px solid ${color}25`, borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB', fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function formatNumber(num) {
  // Handle undefined, null, or non-numeric values
  if (num === undefined || num === null || isNaN(num)) return 'N/A'
  
  const numValue = Number(num)
  if (numValue >= 1000000) return (numValue / 1000000).toFixed(1) + 'M'
  if (numValue >= 1000) return (numValue / 1000).toFixed(1) + 'K'
  return numValue.toString()
}
