// Simple test script for FTP connection
const fetch = require('node-fetch');

async function testFtpConnection() {
  try {
    const response = await fetch('http://localhost:3000/ftp/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: 'ftp.test.rebex.net',
        username: 'demo',
        password: 'password',
        port: 21,
        secure: false
      }),
    });

    const data = await response.json();
    console.log('FTP Connection Test Result:', data);
    return data;
  } catch (error) {
    console.error('Error testing FTP connection:', error);
    throw error;
  }
}

testFtpConnection()
  .then(result => {
    console.log('Test completed with result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
