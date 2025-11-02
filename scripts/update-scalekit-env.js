/**
 * Helper script to update ScaleKit environment variables
 * This script will help you properly update your .env.local file
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const envPath = path.join(__dirname, '..', '.env.local')

function readEnvFile() {
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!')
    process.exit(1)
  }

  return fs.readFileSync(envPath, 'utf8')
}

function writeEnvFile(content) {
  fs.writeFileSync(envPath, content, 'utf8')
}

function updateEnvVar(fileContent, key, value) {
  // Match the key and replace its value
  const regex = new RegExp(`^${key}=.*$`, 'm')
  const newLine = `${key}=${value}`
  
  if (regex.test(fileContent)) {
    return fileContent.replace(regex, newLine)
  } else {
    // If key doesn't exist, append it
    return fileContent + '\n' + newLine
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('🔧 ScaleKit Environment Variable Updater\n')
  console.log('This script will help you update your ScaleKit credentials in .env.local\n')
  console.log('📋 Get your credentials from: https://scalekit.com → Settings → API Config\n')

  let envContent = readEnvFile()
  
  // Get current values
  const currentUrl = envContent.match(/SCALEKIT_ENVIRONMENT_URL=(.+)/)?.[1] || ''
  const currentClientId = envContent.match(/SCALEKIT_CLIENT_ID=(.+)/)?.[1] || ''
  const currentSecret = envContent.match(/SCALEKIT_CLIENT_SECRET=(.+)/)?.[1] || ''

  console.log('Current values:')
  console.log(`  Environment URL: ${currentUrl.substring(0, 50)}...`)
  console.log(`  Client ID: ${currentClientId.substring(0, 30)}...`)
  console.log(`  Client Secret: ${currentSecret.substring(0, 30)}...`)
  console.log('')

  // Ask for new values
  console.log('Enter your ScaleKit credentials (or press Enter to skip):\n')

  const newUrl = await question('ScaleKit Environment URL: ')
  if (newUrl.trim()) {
    envContent = updateEnvVar(envContent, 'SCALEKIT_ENVIRONMENT_URL', newUrl.trim())
    console.log('✅ Environment URL updated\n')
  }

  const newClientId = await question('ScaleKit Client ID: ')
  if (newClientId.trim()) {
    envContent = updateEnvVar(envContent, 'SCALEKIT_CLIENT_ID', newClientId.trim())
    console.log('✅ Client ID updated\n')
  }

  const newSecret = await question('ScaleKit Client Secret: ')
  if (newSecret.trim()) {
    envContent = updateEnvVar(envContent, 'SCALEKIT_CLIENT_SECRET', newSecret.trim())
    console.log('✅ Client Secret updated\n')
  }

  // Write updated file
  writeEnvFile(envContent)
  console.log('✅ .env.local file updated successfully!\n')
  console.log('⚠️  IMPORTANT: Restart your dev server for changes to take effect:')
  console.log('   1. Stop server (Ctrl+C)')
  console.log('   2. Run: npm run dev\n')

  rl.close()
}

main().catch(console.error)

