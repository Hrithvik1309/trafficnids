// src/utils/helpers.js
// ─────────────────────────────────────────────────────────────
//  Shared utility functions for styling and formatting
// ─────────────────────────────────────────────────────────────

export const TAG_COLORS = {
  Proxy:    '#C084FC',
  VPN:      '#A78BFA',
  TOR:      '#F97316',
  Bot:      '#FF4444',
  Reported: '#FBBF24',
  Clean:    '#4ADE80',
}

export function severityStyle(severity) {
  const styles = {
    Critical: { bg: 'rgba(255,68,68,0.12)',  border: 'rgba(255,68,68,0.4)',  color: '#FF4444' },
    High:     { bg: 'rgba(255,140,0,0.12)',  border: 'rgba(255,140,0,0.4)',  color: '#FF8C00' },
    Medium:   { bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.4)', color: '#F5C518' },
    Low:      { bg: 'rgba(79,195,247,0.12)', border: 'rgba(79,195,247,0.4)', color: '#4FC3F7' },
    Clean:    { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.4)', color: '#4ADE80' },
  }
  return styles[severity] || styles.Clean
}

export function scoreGradient(score) {
  if (score >= 80) return '#FF4444'
  if (score >= 60) return '#FF8C00'
  if (score >= 35) return '#F5C518'
  if (score >= 10) return '#4FC3F7'
  return '#4ADE80'
}

export function formatTimestamp(ts) {
  if (!ts) return '—'
  const date = ts?.toDate?.() ?? new Date(ts)
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24)  return `${hrs}h ago`
  if (days < 7)  return `${days}d ago`
  return date.toLocaleDateString()
}

export function isValidIP(str) {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6 = /^[0-9a-fA-F:]+$/
  return ipv4.test(str) || ipv6.test(str)
}
