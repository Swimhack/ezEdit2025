// Health check endpoint for EzEdit.co
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'healthy',
      service: 'ezedit.co',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      platform: 'netlify',
      region: process.env.AWS_REGION || 'us-east-1',
      environment: 'production'
    })
  };
};