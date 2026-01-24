// Vercel Serverless Function - Proxy for chat API
// 60 second timeout on free tier

const http = require('http');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, session_id } = req.body;

    const apiResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({ query, session_id });

      const request = http.request({
        hostname: '98.70.58.228',
        port: 9001,
        path: '/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 55000, // 55 seconds (under Vercel's 60s limit)
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve({ statusCode: response.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: response.statusCode, body: data });
          }
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });

      request.write(postData);
      request.end();
    });

    return res.status(apiResponse.statusCode).json(apiResponse.body);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch from API', 
      message: error.message 
    });
  }
}
