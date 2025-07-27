// Authentication API for EzEdit.co
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { action, email, password } = JSON.parse(event.body || '{}');

    switch (action) {
      case 'login':
        // Demo authentication
        if (email === 'demo@ezedit.co' && password === 'demo123') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              user: {
                id: 1,
                email: email,
                name: 'Demo User'
              },
              token: 'demo-token-' + Date.now()
            })
          };
        } else {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'Invalid credentials'
            })
          };
        }

      case 'register':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Registration successful',
            user: {
              id: Math.floor(Math.random() * 1000),
              email: email,
              name: 'New User'
            }
          })
        };

      case 'logout':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Logged out successfully'
          })
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid action'
          })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Server error: ' + error.message
      })
    };
  }
};