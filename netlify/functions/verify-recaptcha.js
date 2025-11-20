// Netlify Function: Verify Google reCAPTCHA v2 token
// Reads secret from environment variable RECAPTCHA_SECRET

const https = require('https');

function postFormUrlEncoded(url, body) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const data = body instanceof URLSearchParams ? body.toString() : String(body || '');
      const options = {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname + (u.search || ''),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data)
        }
      };
      const req = https.request(options, (res) => {
        let chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          try { resolve({ status: res.statusCode || 200, json: JSON.parse(text) }); }
          catch (_) { resolve({ status: res.statusCode || 200, json: {} }); }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({ success: false, error: 'Missing RECAPTCHA_SECRET' })
      };
    }

    const { token } = JSON.parse(event.body || '{}');
    if (!token) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({ success: false, error: 'Missing token' })
      };
    }

    // Optional: get client IP for verification context
    const remoteip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (remoteip) params.append('remoteip', remoteip);

    let data;
    if (typeof fetch === 'function') {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      data = await response.json().catch(() => ({}));
    } else {
      const resp = await postFormUrlEncoded('https://www.google.com/recaptcha/api/siteverify', params);
      data = resp.json || {};
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({
        success: !!data.success,
        errorCodes: data['error-codes'] || [],
        hostname: data.hostname || null
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ success: false, error: 'Verification failed' })
    };
  }
};


