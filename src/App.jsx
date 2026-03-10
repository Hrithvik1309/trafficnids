// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Logs from './pages/Logs'
import Scanner from './pages/Scanner'
import Traffic from './pages/Traffic'
import WebsiteAnalyzer from './pages/WebsiteAnalyzer'
import { subscribeAlerts } from './services/firebase'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
})

function Sidebar({ alertCount }) {
  const location = useLocation()

  const links = [
    { to: '/',         icon: '⬡', label: 'Dashboard' },
    { to: '/scanner',  icon: '◎', label: 'IP Scanner' },
    { to: '/analyzer', icon: '🔍', label: 'Website Analyzer' },
    { to: '/traffic',  icon: '📊', label: 'Traffic' },
    { to: '/alerts',   icon: '◈', label: 'Alerts', badge: alertCount },
    { to: '/logs',     icon: '≡',  label: 'Threat Logs' },
  ]

  return (
    <aside style={{
      width: 220, height: '100vh', position: 'fixed', left: 0, top: 0,
      background: '#060A10',
      borderRight: '1px solid #0F1923',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'IBM Plex Mono', monospace",
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #0F1923' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,68,68,0.15)',
            border: '1px solid rgba(255,68,68,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🛡</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em' }}>NIDS</div>
            <div style={{ fontSize: 9, color: '#FF4444', letterSpacing: '0.15em' }}>INTRUSION DETECT</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 10px' }}>
        {links.map(link => {
          const active = link.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(link.to)
          return (
            <NavLink key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 7, marginBottom: 4,
                background: active ? 'rgba(255,68,68,0.1)' : 'transparent',
                border: active ? '1px solid rgba(255,68,68,0.25)' : '1px solid transparent',
                transition: 'all 0.15s', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 14, color: active ? '#FF6B6B' : '#374151', width: 18, textAlign: 'center' }}>
                  {link.icon}
                </span>
                <span style={{ fontSize: 13, color: active ? '#F1F5F9' : '#4B5563', fontWeight: active ? 600 : 400 }}>
                  {link.label}
                </span>
                {link.badge > 0 && (
                  <div style={{
                    marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9,
                    background: '#FF4444', color: '#fff',
                    fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, padding: '0 4px',
                  }}>
                    {link.badge > 99 ? '99+' : link.badge}
                  </div>
                )}
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* API Status */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid #0F1923' }}>
        <div style={{ fontSize: 9, color: '#1F2937', letterSpacing: '0.15em', marginBottom: 8, textTransform: 'uppercase' }}>
          API Sources
        </div>
        {[
          { name: 'AbuseIPDB', color: '#4ADE80' },
          { name: 'IPQualityScore', color: '#4ADE80' },
          { name: 'Firebase', color: '#4ADE80' },
        ].map(api => (
          <div key={api.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: api.color, boxShadow: `0 0 6px ${api.color}` }} />
            <span style={{ fontSize: 10, color: '#374151' }}>{api.name}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function AppShell() {
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  useEffect(() => {
    // Request browser notification permission on load
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const unsub = subscribeAlerts(alerts => {
      setUnreadAlerts(alerts.filter(a => !a.read).length)
    })
    return () => unsub()
  }, [])

  return (
    <div style={{ display: 'flex', background: '#080D15', minHeight: '100vh' }}>
      <Sidebar alertCount={unreadAlerts} />
      <main style={{ marginLeft: 220, flex: 1, overflowX: 'hidden' }}>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/scanner"  element={<Scanner />} />
          <Route path="/analyzer" element={<WebsiteAnalyzer />} />
          <Route path="/traffic"  element={<Traffic />} />
          <Route path="/alerts"   element={<Alerts />} />
          <Route path="/logs"     element={<Logs />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
