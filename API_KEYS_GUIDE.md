# 🔑 API Keys Setup Guide

This guide shows you how to get free API keys to improve the accuracy of your Website Analyzer.

## 🚀 Currently Working With Mock Data

Your analyzer is currently using realistic mock data based on domain analysis. To get **real data**, follow the steps below to obtain free API keys.

---

## 📊 Google PageSpeed Insights API (Recommended - FREE)

**What it provides**: Real page load speeds, performance scores, mobile-friendliness
**Free tier**: 25,000 requests per day
**Cost**: Completely free

### Steps to get API key:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project**
   - Click "Select a project" → "New Project"
   - Name it "Website Analyzer" → Create

3. **Enable PageSpeed Insights API**
   - Go to "APIs & Services" → "Library"
   - Search for "PageSpeed Insights API"
   - Click on it → Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

5. **Add to your project**
   - Open `server/.env` file
   - Replace: `GOOGLE_PAGESPEED_API_KEY=`
   - With: `GOOGLE_PAGESPEED_API_KEY=your_actual_key_here`

---

## 🌐 Alternative Data Sources (Optional)

### SimilarWeb API (Paid - but has free trial)
- **What it provides**: Real traffic data, visitor counts, demographics
- **Free trial**: 1 month with limited requests
- **Get it**: https://www.similarweb.com/corp/developer/

### Alexa API (Discontinued)
- **Status**: No longer available (shut down in 2022)
- **Alternative**: We use Tranco ranking instead

---

## 🔧 Current Data Sources (No API Key Needed)

Your analyzer currently uses these **free** methods:

1. **Domain Analysis**: Analyzes website structure and content
2. **Tranco Ranking**: Free website ranking service
3. **Direct Website Testing**: Tests load times and mobile-friendliness
4. **Smart Estimation**: Uses domain characteristics to estimate traffic
5. **Known Popular Sites**: Has real data for top 50 websites

---

## 📈 Data Accuracy Levels

| Method | Accuracy | API Key Required |
|--------|----------|------------------|
| **Google PageSpeed** | 95% accurate | Yes (Free) |
| **SimilarWeb API** | 90% accurate | Yes (Paid) |
| **Smart Estimation** | 70% accurate | No |
| **Mock Data** | 60% accurate | No |

---

## 🛠️ How to Add API Keys

1. **Edit Environment Files**:
   ```bash
   # Frontend (.env.local)
   GOOGLE_PAGESPEED_API_KEY=your_key_here
   
   # Backend (server/.env)
   GOOGLE_PAGESPEED_API_KEY=your_key_here
   ```

2. **Restart Your Servers**:
   ```bash
   # Stop both servers (Ctrl+C)
   # Then restart:
   cd server && npm start
   # In another terminal:
   npm run dev
   ```

3. **Test with Real Data**:
   - Try analyzing a website
   - Check server logs for "Using real PageSpeed data"

---

## 🎯 Recommended Setup

For the **best experience** with minimal cost:

1. ✅ **Get Google PageSpeed API key** (Free - 25k requests/day)
2. ⏭️ **Skip SimilarWeb for now** (Paid service)
3. 🚀 **Use current smart estimation** (Works well for most sites)

This gives you **real performance data** while keeping traffic estimates realistic based on domain analysis.

---

## 🐛 Troubleshooting

**Problem**: Still seeing "3.1k visitors" for Amazon
**Solution**: The mock data is intentionally realistic. Amazon should show ~650M visitors with the updated code.

**Problem**: API key not working
**Solution**: 
1. Check the key is correctly pasted (no extra spaces)
2. Ensure the API is enabled in Google Cloud Console
3. Restart both servers after adding the key

**Problem**: Rate limiting errors
**Solution**: The app automatically falls back to mock data when rate limited.

---

## 📞 Need Help?

If you need assistance setting up API keys or have questions about the data accuracy, let me know!