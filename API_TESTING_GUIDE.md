# 🧪 API Testing & Debugging Guide

## 🎯 Current Status

Your application now has comprehensive API testing capabilities for both **PageSpeed Insights** and **IPQualityScore** APIs.

---

## 🛠️ Test Buttons Available

### 1. **Website Analyzer Page** (`/website-analyzer`)
- **🧪 Test API** - Tests Google PageSpeed Insights API
- **🛡️ Test IP** - Tests IPQualityScore API
- **🔍 Analyze** - Main website analysis (uses both APIs)

### 2. **IP Scanner Page** (`/scanner`)
- **🛡️ Test API** - Tests IPQualityScore API
- **◎ Scan IP** - Main IP scanning (uses IPQS + AbuseIPDB)

---

## 🔍 How to Debug API Issues

### **Step 1: Test Individual APIs**
1. **Restart your server** to load latest changes
2. **Click the test buttons** to see detailed diagnostics
3. **Check server console** for detailed error logs

### **Step 2: Interpret Test Results**

#### ✅ **Success Response Example:**
```json
{
  "success": true,
  "keyPresent": true,
  "keyPrefix": "AIzaSyAteB...",
  "testIP": "8.8.8.8",
  "results": {
    "country": "US",
    "fraudScore": 0
  },
  "message": "✅ API is working correctly!"
}
```

#### ❌ **Error Response Example:**
```json
{
  "success": false,
  "keyPresent": true,
  "error": "Authentication failed",
  "status": 401,
  "possibleCauses": [
    "API key is incorrect or expired",
    "API not enabled in Google Cloud Console"
  ],
  "solutions": [
    "1. Go to Google Cloud Console → APIs & Services",
    "2. Enable PageSpeed Insights API"
  ]
}
```

---

## 🔧 Common Issues & Solutions

### **Issue 1: PageSpeed API - 401 Authentication Failed**

**Symptoms:**
- Test button shows "Authentication failed"
- Server logs show 401 error

**Solutions:**
1. **Enable the API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" → "Library"
   - Search "PageSpeed Insights API" → Enable

2. **Check API Key:**
   - Go to "APIs & Services" → "Credentials"
   - Verify your API key exists and is correct
   - Copy the key to `server/.env`

3. **Remove Restrictions:**
   - Edit your API key in Google Cloud Console
   - Under "Application restrictions" → Select "None"
   - Under "API restrictions" → Select "PageSpeed Insights API"

### **Issue 2: IPQS API - Success: false**

**Symptoms:**
- IPQS returns data but `success: false`
- May show authentication errors

**Solutions:**
1. **Check Your Dashboard:**
   - Go to [IPQS Dashboard](https://www.ipqualityscore.com/user/proxy-detection-api)
   - Verify you have remaining credits
   - Check if your account is active

2. **Get New API Key:**
   - Copy the API key from your IPQS dashboard
   - Update `server/.env` with the new key
   - Restart the server

3. **Check Rate Limits:**
   - Free tier: 5,000 requests/month
   - If exceeded, wait for next month or upgrade

### **Issue 3: Network/Timeout Errors**

**Symptoms:**
- "timeout of 10000ms exceeded"
- Connection errors

**Solutions:**
1. **Check Internet Connection**
2. **Try Different Test IP** (use 8.8.8.8 for testing)
3. **Increase Timeout** (already set to 15-20 seconds)

---

## 📊 API Endpoints for Manual Testing

### **Test IPQS API:**
```bash
GET /api/test-ipqs
```

### **Test PageSpeed API:**
```bash
GET /api/test-pagespeed
```

### **Scan Specific IP:**
```bash
GET /api/scan-ip?ip=8.8.8.8
```

### **Analyze Website:**
```bash
GET /api/analyze-website?domain=google.com
```

---

## 🎯 Expected Behavior

### **Working IPQS API:**
- Should return fraud score, country, city
- Risk score between 0-100
- Flags for proxy/VPN/TOR detection

### **Working PageSpeed API:**
- Should return load time (e.g., "1.2s")
- Performance score (0-100)
- Mobile-friendly status

### **Fallback Behavior:**
- If APIs fail, app uses realistic mock data
- No crashes or broken functionality
- Clear error messages in console

---

## 🚀 Next Steps

1. **Test both APIs** using the test buttons
2. **Fix any authentication issues** following the solutions above
3. **Verify website analysis works** with real data
4. **Check IP scanning functionality** on the Scanner page

---

## 📞 Troubleshooting Checklist

- [ ] Server restarted after adding API keys
- [ ] API keys are in `server/.env` (not just `.env.local`)
- [ ] No extra spaces in API key values
- [ ] Google Cloud Console APIs are enabled
- [ ] IPQS dashboard shows active account
- [ ] Test buttons show success messages
- [ ] Server console shows detailed logs

If you're still having issues, run the test buttons and share the exact error messages!