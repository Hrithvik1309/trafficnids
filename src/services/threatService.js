// src/services/threatService.js
// ─────────────────────────────────────────────────────────────────────────────
//  Threat Intelligence Service
//  Aggregates data from two free APIs and normalises into a single ThreatReport
//
//  APIs Used:
//  ┌─────────────────────────────────────────────────────────────────────────┐
//  │ 1. AbuseIPDB                                                            │
//  │    Site:     https://www.abuseipdb.com                                  │
//  │    Endpoint: GET https://api.abuseipdb.com/api/v2/check                 │
//  │    Params:   ipAddress (string), maxAgeInDays (int, default 90)         │
//  │    Headers:  Key: <VITE_ABUSEIPDB_API_KEY>, Accept: application/json   │
//  │    Returns:  abuseConfidenceScore (0–100), totalReports, countryCode,  │
//  │              usageType, isp, domain, lastReportedAt                     │
//  │    Free tier: 1,000 checks / day                                        │
//  ├─────────────────────────────────────────────────────────────────────────┤
//  │ 2. IPQualityScore (IPQS)                                                │
//  │    Site:     https://www.ipqualityscore.com                             │
//  │    Endpoint: GET https://ipqualityscore.com/api/json/ip/{KEY}/{IP}      │
//  │    Params:   strictness (0–3), allow_public_access_points (bool)        │
//  │    Returns:  fraud_score (0–100), proxy, vpn, tor, bot_status,         │
//  │              abuse_velocity, timezone, city, region, country_code      │
//  │    Free tier: 5,000 checks / month                                      │
//  └─────────────────────────────────────────────────────────────────────────┘
//
//  Both APIs are called in parallel via Promise.allSettled so a failure
//  in one doesn't block the other.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios'
import { saveThreatLog, saveAlert } from './firebase'

const ABUSEIPDB_KEY = import.meta.env.VITE_ABUSEIPDB_API_KEY
const IPQS_KEY      = import.meta.env.VITE_IPQS_API_KEY

// ── CORS proxy needed for both APIs in browser environments ──────────────────
// Both APIs block direct browser requests. Using cors-anywhere alternative
const CORS_PROXY = 'https://corsproxy.io/?'

// ─────────────────────────────────────────────────────────────────────────────
//  1. AbuseIPDB — Check IP against crowd-sourced abuse reports
//     Endpoint: GET https://api.abuseipdb.com/api/v2/check
// ─────────────────────────────────────────────────────────────────────────────
async function checkAbuseIPDB(ip) {
  const apiUrl = `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose=true`
  const url = `${CORS_PROXY}${apiUrl}`
  
  console.log('AbuseIPDB Request URL:', url)
  
  const { data } = await axios.get(url, {
    headers: {
      Key:    ABUSEIPDB_KEY,
      Accept: 'application/json',
    },
    timeout: 15000,
  })
  
  console.log('AbuseIPDB Response:', data)
  
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data

  const d = parsedData.data
  return {
    source:               'AbuseIPDB',
    abuseScore:           d?.abuseConfidenceScore ?? 0,   // 0–100
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
//  2. IPQualityScore — Proxy / VPN / Bot / Fraud detection
//     Endpoint: GET https://ipqualityscore.com/api/json/ip/{KEY}/{IP}
// ─────────────────────────────────────────────────────────────────────────────
async function checkIPQS(ip) {
  // IPQS also needs CORS proxy in browser
  const apiUrl = `https://ipqualityscore.com/api/json/ip/${IPQS_KEY}/${ip}?strictness=1&allow_public_access_points=true`
  const url = `${CORS_PROXY}${apiUrl}`
  
  console.log('IPQS Request URL:', url)
  
  const { data } = await axios.get(url, {
    timeout: 15000,
  })
  
  console.log('IPQS Response:', data)
  
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data

  if (!parsedData.success) throw new Error(parsedData.message || 'IPQS check failed')

  return {
    source:      'IPQualityScore',
    fraudScore:  parsedData.fraud_score   ?? 0,   // 0–100
    isProxy:     parsedData.proxy         ?? false,
    isVPN:       parsedData.vpn           ?? false,
    isTOR:       parsedData.tor           ?? false,
    isBot:       parsedData.bot_status    ?? false,
    abuseVelocity: parsedData.abuse_velocity ?? 'none',  // none / low / medium / high
    city:        parsedData.city          ?? '',
    region:      parsedData.region        ?? '',
    country:     parsedData.country_code  ?? 'XX',
    timezone:    parsedData.timezone      ?? '',
    org:         parsedData.organization  ?? '',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Combine both sources into a single normalised ThreatReport
// ─────────────────────────────────────────────────────────────────────────────
function buildThreatReport(ip, abuseResult, ipqsResult) {
  // Weighted composite risk score
  //   AbuseIPDB abuse score     → 40% weight
  //   IPQS fraud score          → 60% weight
  const abuseScore = abuseResult?.abuseScore ?? 0
  const fraudScore = ipqsResult?.fraudScore  ?? 0
  const riskScore  = Math.round((abuseScore * 0.4) + (fraudScore * 0.6))

  // Severity tier
  let severity = 'Clean'
  if      (riskScore >= 80) severity = 'Critical'
  else if (riskScore >= 60) severity = 'High'
  else if (riskScore >= 35) severity = 'Medium'
  else if (riskScore >= 10) severity = 'Low'

  // Threat type tags
  const tags = []
  if (ipqsResult?.isProxy)      tags.push('Proxy')
  if (ipqsResult?.isVPN)        tags.push('VPN')
  if (ipqsResult?.isTOR)        tags.push('TOR')
  if (ipqsResult?.isBot)        tags.push('Bot')
  if (abuseResult?.totalReports > 0) tags.push('Reported')
  if (tags.length === 0)        tags.push('Clean')

  return {
    ip,
    riskScore,
    severity,
    tags,
    countryCode:   ipqsResult?.country     || abuseResult?.countryCode || 'XX',
    city:          ipqsResult?.city        || '',
    region:        ipqsResult?.region      || '',
    isp:           abuseResult?.isp        || ipqsResult?.org || 'Unknown',
    usageType:     abuseResult?.usageType  || 'Unknown',
    abuseScore,
    fraudScore,
    totalReports:  abuseResult?.totalReports ?? 0,
    abuseVelocity: ipqsResult?.abuseVelocity ?? 'none',
    lastReportedAt:abuseResult?.lastReportedAt ?? null,
    rawAbuseIPDB:  abuseResult,
    rawIPQS:       ipqsResult,
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
  const [abuseSettled, ipqsSettled] = await Promise.allSettled([
    checkAbuseIPDB(trimmedIP),
    checkIPQS(trimmedIP),
  ])

  const abuseResult = abuseSettled.status === 'fulfilled' ? abuseSettled.value : null
  const ipqsResult  = ipqsSettled.status  === 'fulfilled' ? ipqsSettled.value  : null

  // Log errors for debugging
  if (abuseSettled.status === 'rejected') {
    console.error('AbuseIPDB Error:', abuseSettled.reason)
  }
  if (ipqsSettled.status === 'rejected') {
    console.error('IPQS Error:', ipqsSettled.reason)
  }

  if (!abuseResult && !ipqsResult) {
    const errors = []
    if (abuseSettled.status === 'rejected') errors.push(`AbuseIPDB: ${abuseSettled.reason.message}`)
    if (ipqsSettled.status === 'rejected') errors.push(`IPQS: ${ipqsSettled.reason.message}`)
    throw new Error(`Both API calls failed.\n${errors.join('\n')}`)
  }

  const report = buildThreatReport(trimmedIP, abuseResult, ipqsResult)

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
