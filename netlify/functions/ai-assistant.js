// AI Assistant API for EzEdit.co
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { message, code, language } = JSON.parse(event.body || '{}');

    // Demo AI responses (in production, would integrate with actual AI service)
    const responses = [
      "I can help you with that! Here's a suggestion for improving your code:",
      "This looks good! Consider adding error handling for better reliability.",
      "You might want to optimize this function for better performance.",
      "Here's a more efficient way to write this code:",
      "This code follows good practices. You could also add some comments for clarity."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response: randomResponse,
        suggestions: [
          "Add input validation",
          "Implement error handling",
          "Consider using modern ES6+ features",
          "Add unit tests for this function"
        ],
        language: language || 'javascript',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'AI Assistant error: ' + error.message
      })
    };
  }
};