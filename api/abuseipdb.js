// Vercel serverless function for AbuseIPDB API proxy
// Fixes CORS issues by calling AbuseIPDB server-side

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ip } = req.query;

    // Validate IP parameter
    if (!ip) {
      return res.status(400).json({ error: 'IP parameter is required' });
    }

    // Validate IP format (basic validation)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ error: 'Invalid IP address format' });
    }

    // Get API key from environment (try both with and without VITE_ prefix)
    const apiKey = process.env.ABUSEIPDB_API_KEY || process.env.VITE_ABUSEIPDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AbuseIPDB API key not configured' });
    }

    console.log(`AbuseIPDB API call for IP: ${ip}`);

    // Call AbuseIPDB API server-side
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose=`, {
      method: 'GET',
      headers: {
        'Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'NIDS-Dashboard/1.0'
      }
    });

    if (!response.ok) {
      console.error(`AbuseIPDB API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `AbuseIPDB API error: ${response.statusText}` 
      });
    }

    const data = await response.json();
    
    console.log(`AbuseIPDB response for ${ip}:`, data.data?.abuseConfidencePercentage || 0);

    // Return the AbuseIPDB response
    return res.status(200).json(data);

  } catch (error) {
    console.error('AbuseIPDB serverless function error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}