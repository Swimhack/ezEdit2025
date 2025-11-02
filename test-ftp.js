const { Client } = require('basic-ftp');

async function testFTPConnection() {
  const website = {
    host: '72.167.42.141',
    port: 21,
    username: 'eastgateus',
    password: 'Eastgate411!',
    path: '/public_html'
  };

  console.log('Testing FTP connection...');
  console.log('Host:', website.host);
  console.log('Port:', website.port);
  console.log('Username:', website.username);
  console.log('Password:', website.password ? '***' : 'NOT SET');
  console.log('Path:', website.path);

  const client = new Client();
  
  // Enable verbose logging
  client.ftp.verbose = true;

  try {
    console.log('\n=== Step 1: Connecting to FTP server ===');
    await client.access({
      host: website.host,
      port: website.port,
      user: website.username,
      password: website.password,
      secure: false,
      connTimeout: 10000,
      pasvTimeout: 5000,
      keepalive: 30000
    });
    console.log('✓ Connection successful!');

    console.log('\n=== Step 2: Getting current directory ===');
    const pwd = await client.pwd();
    console.log('Current directory:', pwd);

    console.log('\n=== Step 3: Changing to working directory ===');
    if (website.path && website.path !== '/') {
      try {
        await client.cd(website.path);
        console.log(`✓ Changed to: ${website.path}`);
        const newPwd = await client.pwd();
        console.log('New directory:', newPwd);
      } catch (cdError) {
        console.warn('⚠ Could not change directory:', cdError.message);
        console.log('Continuing with current directory...');
      }
    }

    console.log('\n=== Step 4: Listing root directory ===');
    const rootList = await client.list('/');
    console.log(`✓ Found ${rootList.length} items in root:`);
    rootList.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (${item.isDirectory ? 'DIR' : 'FILE'})`);
    });

    console.log('\n=== Step 5: Listing working directory ===');
    const workDir = website.path || '/';
    const workList = await client.list(workDir);
    console.log(`✓ Found ${workList.length} items in ${workDir}:`);
    workList.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (${item.isDirectory ? 'DIR' : 'FILE'})`);
    });

    console.log('\n=== Step 6: Testing list with empty path ===');
    const emptyList = await client.list('');
    console.log(`✓ Found ${emptyList.length} items with empty path:`);
    emptyList.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (${item.isDirectory ? 'DIR' : 'FILE'})`);
    });

    console.log('\n=== Step 7: Testing list with current directory ===');
    const currentPwd = await client.pwd();
    const currentList = await client.list(currentPwd);
    console.log(`✓ Found ${currentList.length} items in ${currentPwd}:`);
    currentList.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (${item.isDirectory ? 'DIR' : 'FILE'})`);
    });

    console.log('\n✓ All tests passed!');
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ FTP Test Failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testFTPConnection();
