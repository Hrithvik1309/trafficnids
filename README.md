# 🛡 NIDS — Network Intrusion Detection System

A real-time IP threat intelligence dashboard built with React, Firebase, and two free threat APIs.

---

## APIs Used

### 1. AbuseIPDB
- **URL:** https://www.abuseipdb.com
- **Endpoint:** `GET https://api.abuseipdb.com/api/v2/check`
- **Free tier:** 1,000 checks / day — no credit card
- **What it returns:** abuse confidence score, total community reports, ISP, usage type, country
- **Sign up:** https://www.abuseipdb.com/register → Dashboard → API → Create Key

### 2. IPQualityScore (IPQS)
- **URL:** https://www.ipqualityscore.com
- **Endpoint:** `GET https://ipqualityscore.com/api/json/ip/{KEY}/{IP}`
- **Free tier:** 5,000 checks / month — no credit card
- **What it returns:** fraud score, proxy/VPN/TOR/bot flags, abuse velocity, geolocation, org
- **Sign up:** https://www.ipqualityscore.com/create-account → Dashboard → API Keys

### 3. Firebase (Firestore + Hosting)
- **URL:** https://console.firebase.google.com
- **Free tier (Spark plan):** 50k reads/day, 20k writes/day, 1GB storage, free hosting
- **Used for:** storing scan results (threat_logs), alerts, real-time listeners

---

## Risk Score Formula

```
riskScore = (abuseIPDB_score × 0.4) + (IPQS_fraud_score × 0.6)
```

| Score | Severity |
|-------|----------|
| ≥ 80  | Critical — auto-creates alert |
| 60–79 | High |
| 35–59 | Medium |
| 10–34 | Low |
| < 10  | Clean |

---

## Project Structure

```
nids/
├── src/
│   ├── services/
│   │   ├── firebase.js       ← Firestore config, read/write helpers
│   │   └── threatService.js  ← AbuseIPDB + IPQS API wrappers
│   ├── pages/
│   │   ├── Dashboard.jsx     ← Overview, charts, recent logs
│   │   ├── Scanner.jsx       ← Single IP + bulk CSV scan
│   │   ├── Alerts.jsx        ← Critical threat alerts
│   │   └── Logs.jsx          ← Full log table + CSV export
│   ├── utils/
│   │   └── helpers.js        ← Severity colors, formatters
│   └── App.jsx               ← Router + sidebar layout
├── .env.example              ← Copy to .env and fill keys
├── firebase.json             ← Hosting + Firestore config
├── firestore.rules           ← Security rules
└── package.json
```

---

## Setup

### 1. Clone and install
```bash
git clone <your-repo>
cd nids
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Then fill in all values in `.env`:
- `VITE_ABUSEIPDB_API_KEY` — from AbuseIPDB dashboard
- `VITE_IPQS_API_KEY` — from IPQualityScore dashboard
- `VITE_FIREBASE_*` — from Firebase console → Project Settings → Web App

### 3. Firebase setup
```bash
npm install -g firebase-tools
firebase login
firebase init   # select Firestore + Hosting, use existing project
```

### 4. Run locally
```bash
npm run dev     # http://localhost:3000
```

### 5. Deploy
```bash
npm run build
firebase deploy
```

---

## Features

- **Dashboard** — live stat cards, area/bar/pie charts from Firestore
- **IP Scanner** — single IP scan + bulk CSV upload (rate-limited)
- **Alerts** — auto-created for critical threats, mark read/dismiss
- **Logs** — full table with severity filter, search, CSV export
- **Browser notifications** — OS-level alerts for critical scans

---

## CORS Note

AbuseIPDB blocks direct browser requests. The app uses `corsproxy.io` in development.
For production, deploy a simple Firebase Cloud Function proxy:

```js
// functions/index.js
const functions = require('firebase-functions')
const axios     = require('axios')

exports.abuseCheck = functions.https.onCall(async ({ ip }, context) => {
  const { data } = await axios.get('https://api.abuseipdb.com/api/v2/check', {
    params: { ipAddress: ip, maxAgeInDays: 90 },
    headers: { Key: process.env.ABUSEIPDB_KEY, Accept: 'application/json' },
  })
  return data
})
```

Then update `threatService.js` to call this function instead of the direct URL.
