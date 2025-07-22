/**
 * AI Assistant Routes with Claude + Qwen 1.5 Fallback
 * Primary: Claude 3.5 Sonnet | Fallback: Qwen 1.5 (via Ollama/HuggingFace)
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// AI Configuration
const AI_CONFIG = {
    claude: {
        apiKey: process.env.CLAUDE_API_KEY,
        model: 'claude-3-5-sonnet-20241022',
        baseURL: 'https://api.anthropic.com/v1/messages',
        maxTokens: 4096,
        temperature: 0.7
    },
    qwen: {
        // Option 1: Ollama local installation
        baseURL: process.env.QWEN_API_URL || 'http://localhost:11434/api/generate',
        model: 'qwen:1.5b-chat',
        // Option 2: HuggingFace Inference API
        hfApiKey: process.env.HUGGINGFACE_API_KEY,
        hfBaseURL: 'https://api-inference.huggingface.co/models/Qwen/Qwen1.5-7B-Chat',
        maxTokens: 2048,
        temperature: 0.7
    }
};

/**
 * Chat endpoint with Claude primary, Qwen fallback
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, context, userId } = req.body;
        
        if (!message || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Message and userId are required'
            });
        }

        // Check user's subscription status for usage limits
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('subscription_status, ai_queries_today')
            .eq('id', userId)
            .single();

        // Usage limits: Trial = 10/day, Pro = unlimited
        const dailyLimit = userProfile?.subscription_status === 'trial' ? 10 : 999999;
        const queriesUsed = userProfile?.ai_queries_today || 0;

        if (queriesUsed >= dailyLimit) {
            return res.status(429).json({
                success: false,
                error: 'Daily AI query limit reached. Upgrade to Pro for unlimited queries.',
                upgradeUrl: '/pricing.html'
            });
        }

        let aiResponse;
        let modelUsed = 'claude';
        let error = null;

        // Try Claude first
        try {
            aiResponse = await callClaude(message, context);
        } catch (claudeError) {
            console.log('Claude API failed, trying Qwen fallback:', claudeError.message);
            
            try {
                aiResponse = await callQwen(message, context);
                modelUsed = 'qwen';
            } catch (qwenError) {
                console.error('Both AI models failed:', { claudeError, qwenError });
                error = 'AI services temporarily unavailable. Please try again later.';
            }
        }

        if (error) {
            return res.status(503).json({
                success: false,
                error: error
            });
        }

        // Update usage tracking
        await supabase
            .from('user_profiles')
            .update({
                ai_queries_today: queriesUsed + 1,
                last_ai_query: new Date().toISOString()
            })
            .eq('id', userId);

        // Log AI usage for monitoring
        await supabase
            .from('ai_usage_logs')
            .insert({
                user_id: userId,
                model_used: modelUsed,
                message_length: message.length,
                response_length: aiResponse?.length || 0,
                context_provided: !!context,
                timestamp: new Date().toISOString()
            });

        res.json({
            success: true,
            response: aiResponse,
            model: modelUsed,
            queriesRemaining: Math.max(0, dailyLimit - queriesUsed - 1)
        });

    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Call Claude 3.5 Sonnet API
 */
async function callClaude(message, context = null) {
    const systemPrompt = buildSystemPrompt(context);
    
    const response = await axios.post(AI_CONFIG.claude.baseURL, {
        model: AI_CONFIG.claude.model,
        max_tokens: AI_CONFIG.claude.maxTokens,
        temperature: AI_CONFIG.claude.temperature,
        system: systemPrompt,
        messages: [{
            role: 'user',
            content: message
        }]
    }, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': AI_CONFIG.claude.apiKey,
            'anthropic-version': '2023-06-01'
        },
        timeout: 30000
    });

    if (!response.data?.content?.[0]?.text) {
        throw new Error('Invalid Claude API response format');
    }

    return response.data.content[0].text;
}

/**
 * Call Qwen 1.5 (with multiple backend options)
 */
async function callQwen(message, context = null) {
    const systemPrompt = buildSystemPrompt(context);
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;

    // Try Ollama first (if available locally)
    try {
        const response = await axios.post(AI_CONFIG.qwen.baseURL, {
            model: AI_CONFIG.qwen.model,
            prompt: fullPrompt,
            stream: false,
            options: {
                temperature: AI_CONFIG.qwen.temperature,
                top_p: 0.9,
                max_tokens: AI_CONFIG.qwen.maxTokens
            }
        }, {
            timeout: 30000
        });

        if (response.data?.response) {
            return response.data.response.trim();
        }
    } catch (ollamaError) {
        console.log('Ollama failed, trying HuggingFace:', ollamaError.message);
    }

    // Fallback to HuggingFace Inference API
    if (AI_CONFIG.qwen.hfApiKey) {
        const response = await axios.post(AI_CONFIG.qwen.hfBaseURL, {
            inputs: fullPrompt,
            parameters: {
                max_new_tokens: AI_CONFIG.qwen.maxTokens,
                temperature: AI_CONFIG.qwen.temperature,
                top_p: 0.9,
                do_sample: true,
                return_full_text: false
            }
        }, {
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.qwen.hfApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 45000
        });

        if (response.data?.[0]?.generated_text) {
            return response.data[0].generated_text.trim();
        }
    }

    throw new Error('All Qwen backends failed');
}

/**
 * Build system prompt based on context
 */
function buildSystemPrompt(context) {
    let systemPrompt = `You are Klein, an AI coding assistant for EzEdit.co, a web-based FTP code editor. You help developers understand code, fix bugs, write features, and optimize performance.

Key capabilities:
- Explain code and functions clearly
- Identify and fix bugs
- Suggest improvements and optimizations
- Write new code features
- Answer development questions
- Provide best practices and security advice

Style: Be concise, helpful, and focus on practical solutions. Use code examples when helpful.`;

    if (context) {
        if (context.currentFile) {
            systemPrompt += `\n\nCurrent context:
- User is editing: ${context.currentFile}
- File language: ${context.language || 'unknown'}`;
        }

        if (context.fileContent) {
            systemPrompt += `\n- Current file content:\n\`\`\`${context.language || 'text'}\n${context.fileContent.slice(0, 2000)}${context.fileContent.length > 2000 ? '...' : ''}\n\`\`\``;
        }
    }

    return systemPrompt;
}

/**
 * Get AI usage statistics
 */
router.get('/usage/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('subscription_status, ai_queries_today')
            .eq('id', userId)
            .single();

        const dailyLimit = userProfile?.subscription_status === 'trial' ? 10 : 999999;
        const queriesUsed = userProfile?.ai_queries_today || 0;

        res.json({
            success: true,
            usage: {
                queriesUsed: queriesUsed,
                dailyLimit: dailyLimit,
                queriesRemaining: Math.max(0, dailyLimit - queriesUsed),
                subscriptionStatus: userProfile?.subscription_status || 'trial'
            }
        });

    } catch (error) {
        console.error('Usage stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get usage statistics'
        });
    }
});

/**
 * Health check for AI services
 */
router.get('/health', async (req, res) => {
    const health = {
        claude: false,
        qwen: false,
        timestamp: new Date().toISOString()
    };

    // Test Claude
    try {
        await axios.post(AI_CONFIG.claude.baseURL, {
            model: AI_CONFIG.claude.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AI_CONFIG.claude.apiKey,
                'anthropic-version': '2023-06-01'
            },
            timeout: 10000
        });
        health.claude = true;
    } catch (error) {
        console.log('Claude health check failed:', error.message);
    }

    // Test Qwen (Ollama)
    try {
        await axios.post(AI_CONFIG.qwen.baseURL, {
            model: AI_CONFIG.qwen.model,
            prompt: 'Hi',
            stream: false
        }, {
            timeout: 10000
        });
        health.qwen = true;
    } catch (error) {
        console.log('Qwen health check failed:', error.message);
    }

    res.json({
        success: true,
        services: health,
        status: health.claude || health.qwen ? 'operational' : 'degraded'
    });
});

module.exports = router;