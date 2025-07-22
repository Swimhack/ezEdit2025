/**
 * EzEdit.co AI Configuration
 * Manages Claude + Qwen 1.5 fallback system
 */

module.exports = {
    // Primary AI Model (Claude)
    primary: {
        name: 'Claude',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: process.env.CLAUDE_API_KEY,
        baseURL: 'https://api.anthropic.com/v1/messages',
        maxTokens: 4096,
        temperature: 0.7,
        timeout: 30000,
        retryAttempts: 2,
        rateLimitPerMinute: 50,
        costPerToken: 0.000015 // $0.015 per 1K tokens
    },

    // Fallback AI Model (Qwen 1.5)
    fallback: {
        name: 'Qwen',
        provider: 'qwen',
        
        // Local Ollama setup (preferred)
        local: {
            enabled: true,
            baseURL: process.env.QWEN_API_URL || 'http://localhost:11434/api/generate',
            model: process.env.QWEN_MODEL || 'qwen:1.5b-chat',
            maxTokens: 2048,
            temperature: 0.7,
            timeout: 30000,
            costPerToken: 0 // Free when running locally
        },

        // HuggingFace API (secondary fallback)
        remote: {
            enabled: !!process.env.HUGGINGFACE_API_KEY,
            baseURL: 'https://api-inference.huggingface.co/models/Qwen/Qwen1.5-7B-Chat',
            apiKey: process.env.HUGGINGFACE_API_KEY,
            maxTokens: 2048,
            temperature: 0.7,
            timeout: 45000,
            rateLimitPerMinute: 30,
            costPerToken: 0.000002 // Estimated HF pricing
        }
    },

    // Usage limits by subscription tier
    usageLimits: {
        trial: {
            dailyQueries: 10,
            maxTokensPerQuery: 1000,
            allowedModels: ['claude', 'qwen']
        },
        pro: {
            dailyQueries: 999999, // Unlimited
            maxTokensPerQuery: 4000,
            allowedModels: ['claude', 'qwen'],
            priorityAccess: true
        },
        lifetime: {
            dailyQueries: 999999, // Unlimited
            maxTokensPerQuery: 4000,
            allowedModels: ['claude', 'qwen'],
            priorityAccess: true,
            advancedFeatures: true
        }
    },

    // System prompts
    systemPrompts: {
        default: `You are Klein, an AI coding assistant for EzEdit.co, a web-based FTP code editor. You help developers understand code, fix bugs, write features, and optimize performance.

Key capabilities:
- Explain code and functions clearly
- Identify and fix bugs  
- Suggest improvements and optimizations
- Write new code features
- Answer development questions
- Provide best practices and security advice

Style: Be concise, helpful, and focus on practical solutions. Use code examples when helpful.`,

        contextual: (context) => {
            let prompt = module.exports.systemPrompts.default;
            
            if (context?.currentFile) {
                prompt += `\n\nCurrent context:
- User is editing: ${context.currentFile}
- File language: ${context.language || 'unknown'}`;
                
                if (context.fileContent) {
                    const truncatedContent = context.fileContent.slice(0, 2000);
                    const isTruncated = context.fileContent.length > 2000;
                    prompt += `\n- Current file content:\n\`\`\`${context.language || 'text'}\n${truncatedContent}${isTruncated ? '\n... (truncated)' : ''}\n\`\`\``;
                }
            }
            
            return prompt;
        }
    },

    // Monitoring and health checks
    monitoring: {
        healthCheckInterval: 5 * 60 * 1000, // 5 minutes
        responseTimeThreshold: 10000, // 10 seconds
        errorRateThreshold: 0.1, // 10% error rate
        logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
    },

    // Feature flags
    features: {
        autoFallback: true,
        usageTracking: true,
        responseStreaming: false, // Future feature
        multiModelComparison: false, // Future feature
        customPrompts: false, // Future pro feature
        codeGeneration: true,
        bugDetection: true,
        performanceAnalysis: true
    },

    // Model selection strategy
    modelSelection: {
        strategy: 'primary_with_fallback', // 'primary_only', 'primary_with_fallback', 'load_balance'
        fallbackTriggers: [
            'rate_limit_exceeded',
            'api_timeout',
            'api_error',
            'model_unavailable'
        ],
        loadBalancing: {
            enabled: false,
            weights: {
                claude: 0.8,
                qwen: 0.2
            }
        }
    },

    // Performance optimization
    optimization: {
        caching: {
            enabled: true,
            ttl: 60 * 60 * 1000, // 1 hour
            maxSize: 1000 // Max cached responses
        },
        requestDeduplication: {
            enabled: true,
            windowMs: 5000 // 5 seconds
        },
        contextOptimization: {
            enabled: true,
            maxContextSize: 2000 // chars
        }
    }
};