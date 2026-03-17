// src/services/threatService.js
// ─────────────────────────────────────────────────────────────────────────────
//  Threat Intelligence Service
//  Aggregates data from two free APIs and normalises into a single ThreatReport
//
//  APIs Used:
//  ┌─────────────────────────────────────────────────────────────────────────┐
//  │ 1. AbuseIPDB (via Vercel serverless function)                          │
//  │    Endpoint: GET /api/abuseipdb?ip={ip}                                 │
//  │    Returns:  abuseConfidenceScore (0–100), totalReports, countryCode,  │
//  │              usageType, isp, domain, lastReportedAt                     │
//  │    Free tier: 1,000 checks / day                                        │
//  ├─────────────────────────────────────────────────────────────────────────┤
//  │ 2. IP-API.com                                                           │
//  │    Endpoint: GET http://ip-api.com/json/{ip}                            │
//  │    Returns:  country, countryCode, city, isp, org, proxy, hosting      │
//  │    Free tier: 45 requests / minute (no API key needed)                 │
//  │    NOTE: Must use http:// not https:// on free tier                    │
//  └─────────────────────────────────────────────────────────────────────────┘
//
//  Both APIs are called in parallel via Promise.allSettled so a failure
//  in one doesn't block the other.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios'
import { saveThreatLog, saveAlert } from './firebase'

// ─────────────────────────────────────────────────────────────────────────────
//  1. AbuseIPDB — Check IP against crowd-sourced abuse reports
//     Endpoint: GET /api/abuseipdb?ip={ip} (Vercel serverless function)
// ─────────────────────────────────────────────────────────────────────────────
async function checkAbuseIPDB(ip) {
  console.log('AbuseIPDB Request for IP:', ip)
  
  const { data } = await axios.get(`/api/abuseipdb?ip=${ip}`, {
    timeout: 15000,
  })
  
  console.log('AbuseIPDB Response:', data)

  const d = data.data
  return {
    source:               'AbuseIPDB',
    abuseScore:           d?.abuseConfidencePercentage ?? 0,   // 0–100
    totalReports:         d?.totalReports          ?? 0,
    countryCode:          d?.countryCode           ?? 'XX',
    usageType:            d?.usageType             ?? 'Unknown',
    isp:                  d?.isp                   ?? 'Unknown',
    domain:               d?.domain                ?? '',
    lastReportedAt:       d?.lastReportedAt        ?? null,
    isWhitelisted:        d?.isWhitelisted         ?? false,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. IP-API.com — Geolocation and proxy/hosting detection
//     Endpoint: GET http://ip-api.com/json/{ip}
// ─────────────────────────────────────────────────────────────────────────────
async function checkIPAPI(ip) {
  const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,isp,org,proxy,hosting,query`
  
  console.log('IP-API Request URL:', url)
  
  const { data } = await axios.get(url, {
    timeout: 15000,
  })
  
  console.log('IP-API Response:', data)

  if (data.status !== 'success') {
    throw new Error(data.message || 'IP-API check failed')
  }

  return {
    source:      'IP-API',
    country:     data.country      ?? 'Unknown',
    countryCode: data.countryCode  ?? 'XX',
    region:      data.region       ?? '',
    regionName:  data.regionName   ?? '',
    city:        data.city         ?? '',
    isp:         data.isp          ?? 'Unknown',
    org:         data.org          ?? 'Unknown',
    isProxy:     data.proxy        ?? false,
    isHosting:   data.hosting      ?? false,
    query:       data.query        ?? ip,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Combine both sources into a single normalised ThreatReport
// ─────────────────────────────────────────────────────────────────────────────
function buildThreatReport(ip, abuseResult, ipapiResult) {
  // Calculate proxy score based on IP-API data
  let proxyScore = 0
  if (ipapiResult?.isProxy && ipapiResult?.isHosting) {
    proxyScore = 90  // Both proxy AND hosting
  } else if (ipapiResult?.isProxy) {
    proxyScore = 80  // Proxy only
  } else if (ipapiResult?.isHosting) {
    proxyScore = 40  // Hosting only
  } else {
    proxyScore = 0   // Neither
  }

  // Updated weighted composite risk score formula
  // AbuseIPDB abuse score → 60% weight
  // Proxy score          → 40% weight
  const abuseScore = abuseResult?.abuseScore ?? 0
  const riskScore  = Math.round((abuseScore * 0.6) + (proxyScore * 0.4))

  // Severity tier
  let severity = 'Clean'
  if      (riskScore >= 80) severity = 'Critical'
  else if (riskScore >= 60) severity = 'High'
  else if (riskScore >= 35) severity = 'Medium'
  else if (riskScore >= 10) severity = 'Low'

  // Threat type tags
  const tags = []
  if (ipapiResult?.isProxy)      tags.push('Proxy')
  if (ipapiResult?.isHosting)    tags.push('Hosting')
  if (abuseResult?.totalReports > 0) tags.push('Reported')
  if (tags.length === 0)         tags.push('Clean')

  return {
    ip,
    riskScore,
    severity,
    tags,
    countryCode:   ipapiResult?.countryCode || abuseResult?.countryCode || 'XX',
    city:          ipapiResult?.city        || '',
    region:        ipapiResult?.regionName  || '',
    isp:           abuseResult?.isp         || ipapiResult?.isp || 'Unknown',
    usageType:     abuseResult?.usageType   || 'Unknown',
    abuseScore,
    proxyScore,    // Changed from fraudScore to proxyScore
    totalReports:  abuseResult?.totalReports ?? 0,
    lastReportedAt:abuseResult?.lastReportedAt ?? null,
    rawAbuseIPDB:  abuseResult,
    rawIPAPI:      ipapiResult,  // Changed from rawIPQS to rawIPAPI
    scannedAt:     new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main export: scanIP
//  - Calls both APIs in parallel
//  - Saves result to Firestore threat_logs
//  - Auto-creates alert if riskScore > 80
// ─────────────────────────────────────────────────────────────────────────────
export async function scanIP(ip) {
  const trimmedIP = ip.trim()

  // Basic IPv4/IPv6 validation
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6 = /^[0-9a-fA-F:]+$/
  if (!ipv4.test(trimmedIP) && !ipv6.test(trimmedIP)) {
    throw new Error('Invalid IP address format')
  }

  // Call both APIs in parallel — one failure won't block the other
  const [abuseSettled, ipapiSettled] = await Promise.allSettled([
    checkAbuseIPDB(trimmedIP),
    checkIPAPI(trimmedIP),
  ])

  const abuseResult = abuseSettled.status === 'fulfilled' ? abuseSettled.value : null
  const ipapiResult = ipapiSettled.status === 'fulfilled' ? ipapiSettled.value : null

  // Log errors for debugging
  if (abuseSettled.status === 'rejected') {
    console.error('AbuseIPDB Error:', abuseSettled.reason)
  }
  if (ipapiSettled.status === 'rejected') {
    console.error('IP-API Error:', ipapiSettled.reason)
  }

  if (!abuseResult && !ipapiResult) {
    const errors = []
    if (abuseSettled.status === 'rejected') errors.push(`AbuseIPDB: ${abuseSettled.reason.message}`)
    if (ipapiSettled.status === 'rejected') errors.push(`IP-API: ${ipapiSettled.reason.message}`)
    throw new Error(`Both API calls failed.\n${errors.join('\n')}`)
  }

  const report = buildThreatReport(trimmedIP, abuseResult, ipapiResult)

  // ── Persist to Firestore ─────────────────────────────────
  try {
    await saveThreatLog(report)
    console.log('Saved to Firestore successfully')
  } catch (err) {
    console.error('Firestore save error:', err)
    // Continue even if Firestore fails
  }

  // ── Auto-alert on Critical threats ───────────────────────
  if (report.riskScore >= 80) {
    try {
      await saveAlert({
        ip:         report.ip,
        riskScore:  report.riskScore,
        severity:   report.severity,
        tags:       report.tags,
        countryCode:report.countryCode,
        message:    `Critical threat detected: ${trimmedIP} scored ${report.riskScore}/100`,
      })

      // Browser notification (if permission granted)
      if (Notification.permission === 'granted') {
        new Notification('⚠ Critical Threat Detected', {
          body: `IP ${trimmedIP} — Risk Score: ${report.riskScore}/100 (${report.tags.join(', ')})`,
          icon: '/favicon.ico',
        })
      }
    } catch (err) {
      console.error('Alert save error:', err)
      // Continue even if alert fails
    }
  }

  return report
}

// ─────────────────────────────────────────────────────────────────────────────
//  Bulk scan — accepts array of IPs, rate-limited to 3 concurrent
// ─────────────────────────────────────────────────────────────────────────────
export async function bulkScanIPs(ips, onProgress) {
  const results = []
  const BATCH = 3

  for (let i = 0; i < ips.length; i += BATCH) {
    const batch = ips.slice(i, i + BATCH)
    const batchResults = await Promise.allSettled(batch.map(ip => scanIP(ip)))
    batchResults.forEach((r, idx) => {
      results.push(
        r.status === 'fulfilled'
          ? r.value
          : { ip: batch[idx], error: r.reason?.message, riskScore: 0, severity: 'Error', tags: ['Error'] }
      )
    })
    onProgress?.(Math.min(i + BATCH, ips.length), ips.length)
    // Small delay to respect rate limits
    if (i + BATCH < ips.length) await new Promise(res => setTimeout(res, 300))
  }

  return results
}
