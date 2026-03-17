# Vercel Deployment Guide - Environment Variables

## Changes Made

All environment variables have been updated to work **without the `VITE_` prefix**.

### Files Updated:
1. `api/abuseipdb.js` - Now reads `ABUSEIPDB_API_KEY` (with fallback to `VITE_ABUSEIPDB_API_KEY`)
2. `src/services/firebase.js` - Now reads Firebase vars without `VITE_` prefix (with fallbacks)
3. `vite.config.js` - Configured to expose environment variables to the client
4. `.env.example` - Updated variable names
5. `.env.local` - Updated variable names
6. `add-vercel-env.ps1` - Updated script to add variables without `VITE_` prefix

## Environment Variables Required

Add these to your Vercel project (without `VITE_` prefix):

```
ABUSEIPDB_API_KEY
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
```

## How to Add Environment Variables to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/hrithvik1309s-projects/trafficnids/settings/environment-variables

2. Add each variable:
   - Click "Add New"
   - Enter variable name (e.g., `ABUSEIPDB_API_KEY`)
   - Enter value
   - Select all environments: **Production**, **Preview**, **Development**
   - Click "Save"

3. Variables to add:
```
ABUSEIPDB_API_KEY = b488083b773bcbba82eefb5964d2529dc9dd37cfc95c8990bcf767018b67d7f527d0a3e050509c9e

FIREBASE_API_KEY = AIzaSyA7sjgvUsVSuy5PHUN2l9P-wD8cgs2FLjo
FIREBASE_AUTH_DOMAIN = trafficred-df988.firebaseapp.com
FIREBASE_PROJECT_ID = trafficred-df988
FIREBASE_STORAGE_BUCKET = trafficred-df988.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = 349919199118
FIREBASE_APP_ID = 1:349919199118:web:0236963a512dc4717caedf
```

4. After adding all variables, redeploy:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Option 2: Vercel CLI

1. Install Vercel CLI (if not already installed):
```powershell
npm i -g vercel
```

2. Login to Vercel:
```powershell
vercel login
```

3. Run the automated script:
```powershell
.\add-vercel-env.ps1
```

4. Redeploy:
```powershell
vercel --prod
```

## How It Works

### For Serverless Functions (api/abuseipdb.js)
- Reads directly from `process.env.ABUSEIPDB_API_KEY`
- Vercel automatically injects environment variables into serverless functions

### For Frontend (React/Vite)
- Vite config (`vite.config.js`) exposes variables using `define`
- Variables are replaced at build time
- Code uses `import.meta.env.FIREBASE_API_KEY` etc.
- Fallback to `VITE_` prefix for backward compatibility

## Testing Locally

1. Make sure `.env.local` has all variables (without `VITE_` prefix)
2. Run development server:
```powershell
npm run dev
```
3. Test the Scanner page - it should work correctly

## Verification After Deployment

1. Visit: https://trafficnids.vercel.app/scanner
2. Enter an IP address (e.g., `8.8.8.8`)
3. Click "Scan IP"
4. You should see results with:
   - AbuseIPDB Score
   - Proxy Score
   - Country, ISP, etc.

If you see errors, check:
1. Environment variables are set in Vercel dashboard
2. All variables are added to all three environments (Production, Preview, Development)
3. Project has been redeployed after adding variables

## Troubleshooting

### "API key not configured" error
- Environment variables not set in Vercel
- Solution: Add variables via dashboard and redeploy

### Firebase initialization error
- Firebase variables not set correctly
- Solution: Double-check all 6 Firebase variables are added

### CORS errors
- Not related to environment variables
- The serverless function handles CORS automatically

## Notes

- The code maintains backward compatibility with `VITE_` prefix
- Local development uses `.env.local` file
- Vercel deployment uses environment variables from dashboard
- Variables are exposed to client-side code at build time (not runtime)
