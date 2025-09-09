const { createClient } = require('@supabase/supabase-js');

// Simple in-memory storage for demo (in production, use a database)
let urlDatabase = new Map();

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { originalUrl } = JSON.parse(event.body);
      
      // Generate short code
      const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Extract title from URL
      const title = new URL(originalUrl).hostname.replace('www.', '');
      
      // Store in memory (in production, use a database)
      urlDatabase.set(shortCode, {
        originalUrl,
        title,
        clicks: 0,
        createdAt: new Date().toISOString()
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          shortCode,
          shortUrl: `https://ts.ly/${shortCode}`,
          originalUrl,
          title,
          clicks: 0
        })
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL' })
      };
    }
  }

  if (event.httpMethod === 'GET') {
    const shortCode = event.queryStringParameters?.code;
    
    if (!shortCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Short code required' })
      };
    }

    const urlData = urlDatabase.get(shortCode);
    
    if (!urlData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'URL not found' })
      };
    }

    // Increment clicks
    urlData.clicks += 1;
    urlDatabase.set(shortCode, urlData);

    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': urlData.originalUrl
      }
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};