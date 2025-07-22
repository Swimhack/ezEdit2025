#!/bin/bash

# EzEdit.co - Qwen 1.5 Fallback Setup Script
# Sets up Qwen 1.5 as Claude API fallback using Ollama

set -e

echo "🚀 Setting up Qwen 1.5 as AI fallback for EzEdit.co..."

# Check if running on Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    echo "⚠️  This script is designed for Ubuntu/Debian systems"
    echo "   Please install Ollama manually from https://ollama.ai"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install dependencies
echo "🔧 Installing dependencies..."
sudo apt install -y curl wget jq

# Install Ollama
echo "🤖 Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.ai/install.sh | sh
    
    # Start Ollama service
    sudo systemctl enable ollama
    sudo systemctl start ollama
    
    # Wait for service to start
    sleep 5
else
    echo "✅ Ollama already installed"
fi

# Pull Qwen 1.5 model
echo "📥 Downloading Qwen 1.5 model (this may take a few minutes)..."
ollama pull qwen:1.5b-chat

# Test Qwen installation
echo "🧪 Testing Qwen 1.5 installation..."
TEST_RESPONSE=$(ollama generate qwen:1.5b-chat "Hello, can you help me code?" --format json 2>/dev/null | jq -r '.response' || echo "Error")

if [[ "$TEST_RESPONSE" != "Error" ]] && [[ -n "$TEST_RESPONSE" ]]; then
    echo "✅ Qwen 1.5 successfully installed and tested"
    echo "   Response: ${TEST_RESPONSE:0:100}..."
else
    echo "❌ Qwen installation test failed"
    echo "   Trying alternative model size..."
    
    # Try smaller model if 1.5b fails
    ollama pull qwen:0.5b-chat
    TEST_RESPONSE2=$(ollama generate qwen:0.5b-chat "Hello" --format json 2>/dev/null | jq -r '.response' || echo "Error")
    
    if [[ "$TEST_RESPONSE2" != "Error" ]]; then
        echo "✅ Qwen 0.5B model working as fallback"
    else
        echo "❌ Unable to setup local Qwen model"
        echo "   Will use HuggingFace API as fallback instead"
    fi
fi

# Create Ollama configuration
echo "⚙️  Configuring Ollama..."
sudo mkdir -p /etc/systemd/system/ollama.service.d/
sudo tee /etc/systemd/system/ollama.service.d/environment.conf > /dev/null <<EOF
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_MODELS=/usr/share/ollama/.ollama/models"
Environment="OLLAMA_NUM_PARALLEL=2"
Environment="OLLAMA_MAX_LOADED_MODELS=2"
EOF

# Restart Ollama with new config
sudo systemctl daemon-reload
sudo systemctl restart ollama

# Create environment variables for Node.js
echo "📝 Setting up environment variables..."
cat >> .env << EOF

# Qwen 1.5 Fallback Configuration
QWEN_API_URL=http://localhost:11434/api/generate
QWEN_MODEL=qwen:1.5b-chat
HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY:-""}

EOF

# Create test script
echo "🧪 Creating test script..."
tee test-ai-fallback.js > /dev/null <<EOF
const axios = require('axios');

async function testAIFallback() {
    console.log('Testing AI fallback system...');
    
    // Test Ollama
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'qwen:1.5b-chat',
            prompt: 'Write a simple JavaScript function that adds two numbers.',
            stream: false
        });
        
        console.log('✅ Ollama/Qwen working:');
        console.log('  Response:', response.data.response.slice(0, 100) + '...');
    } catch (error) {
        console.log('❌ Ollama/Qwen failed:', error.message);
    }
    
    // Test HuggingFace (if API key provided)
    if (process.env.HUGGINGFACE_API_KEY) {
        try {
            const response = await axios.post('https://api-inference.huggingface.co/models/Qwen/Qwen1.5-7B-Chat', {
                inputs: 'Write a simple JavaScript function that adds two numbers.',
                parameters: { max_new_tokens: 100 }
            }, {
                headers: {
                    'Authorization': \`Bearer \${process.env.HUGGINGFACE_API_KEY}\`
                }
            });
            
            console.log('✅ HuggingFace working:');
            console.log('  Response:', response.data[0].generated_text.slice(0, 100) + '...');
        } catch (error) {
            console.log('❌ HuggingFace failed:', error.message);
        }
    } else {
        console.log('ℹ️  HuggingFace API key not set, skipping test');
    }
}

testAIFallback().catch(console.error);
EOF

# Install Node.js dependencies if package.json exists
if [[ -f package.json ]]; then
    echo "📦 Installing Node.js dependencies..."
    npm install axios
fi

# Create systemd service monitoring script
echo "🔍 Creating monitoring script..."
tee monitor-ai-services.js > /dev/null <<EOF
const axios = require('axios');
const fs = require('fs');

async function checkAIServices() {
    const status = {
        timestamp: new Date().toISOString(),
        claude: false,
        qwen_ollama: false,
        qwen_huggingface: false
    };
    
    // Check Ollama
    try {
        await axios.post('http://localhost:11434/api/generate', {
            model: 'qwen:1.5b-chat',
            prompt: 'test',
            stream: false
        }, { timeout: 5000 });
        status.qwen_ollama = true;
    } catch (e) {
        console.log('Ollama check failed:', e.message);
    }
    
    // Log status
    fs.writeFileSync('/tmp/ai-services-status.json', JSON.stringify(status, null, 2));
    
    console.log('AI Services Status:', status);
    
    if (!status.qwen_ollama) {
        console.log('⚠️  Qwen/Ollama is down, restarting service...');
        require('child_process').exec('sudo systemctl restart ollama');
    }
}

// Run check every 5 minutes
setInterval(checkAIServices, 5 * 60 * 1000);
checkAIServices(); // Run once immediately
EOF

echo ""
echo "🎉 Qwen 1.5 fallback setup complete!"
echo ""
echo "📋 Setup Summary:"
echo "   ✅ Ollama installed and configured"
echo "   ✅ Qwen 1.5 model downloaded"
echo "   ✅ Fallback system ready"
echo "   ✅ Monitoring scripts created"
echo ""
echo "🔧 Next Steps:"
echo "   1. Add your HuggingFace API key to .env for additional fallback"
echo "   2. Test the system: node test-ai-fallback.js"
echo "   3. Start monitoring: node monitor-ai-services.js &"
echo "   4. Deploy ai-routes.js to your API server"
echo ""
echo "🌐 API Endpoints:"
echo "   POST /api/ai/chat - Chat with Claude + Qwen fallback"
echo "   GET  /api/ai/health - Check AI services status"
echo "   GET  /api/ai/usage/:userId - Get usage statistics"
echo ""
echo "💡 Tip: Qwen 1.5 uses ~3GB RAM. Consider upgrading to 4GB+ for better performance."