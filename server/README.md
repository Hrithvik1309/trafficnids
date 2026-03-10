# NIDS Backend Server

Backend API for tracking website visitors and analyzing threats.

## Setup

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Get Firebase Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in the `server/` folder

3. **Create .env file:**
```bash
cp .env.example .env
```

Add your IPQS API key to `.env`

4. **Start the server:**
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## API Endpoints

### POST /api/track
Track a website visitor
```javascript
fetch('http://localhost:5000/api/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    page: '/home',
    referrer: 'https://google.com',
    timestamp: Date.now()
  })
})
```

### GET /api/traffic/stats
Get traffic statistics
```javascript
fetch('http://localhost:5000/api/traffic/stats')
```

### GET /health
Health check endpoint

## Deployment

For production, deploy to:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **Vercel**: Add as serverless function
- **AWS/GCP**: Deploy as container

## Security Notes

- Never commit `serviceAccountKey.json` to git
- Use environment variables for API keys
- Enable rate limiting in production
- Add authentication for sensitive endpoints
