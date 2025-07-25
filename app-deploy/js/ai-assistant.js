/**
 * EzEdit.co AI Assistant JavaScript
 * Handles AI interactions, code suggestions, and natural language processing
 */

class AIAssistant {
    constructor() {
        this.isVisible = false;
        this.currentContext = null;
        this.conversationHistory = [];
        this.apiEndpoint = '/api/ai-assistant.php';
        this.models = {
            primary: 'claude-3-5-sonnet',
            fallback: 'gpt-4'
        };
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadConversationHistory();
        this.initializeUI();
    }
    
    setupEventListeners() {
        // Chat form submission
        const chatForm = document.getElementById('aiChatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleChatSubmit(e));
        }
        
        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-ai-action]')) {
                this.handleQuickAction(e.target.dataset.aiAction);
            }
        });
        
        // Toggle assistant visibility
        const toggleButton = document.getElementById('toggleAssistant');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggle());
        }
        
        // Clear conversation
        const clearButton = document.getElementById('clearConversation');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearConversation());
        }
        
        // Context updates from editor
        document.addEventListener('editorContextChanged', (e) => {
            this.updateContext(e.detail);
        });
        
        // Auto-resize chat input
        const chatInput = document.getElementById('aiChatInput');
        if (chatInput) {
            chatInput.addEventListener('input', () => this.autoResizeInput(chatInput));
        }
    }
    
    initializeUI() {
        // Add initial welcome message
        this.addMessage({
            type: 'assistant',
            content: 'Hello! I\'m Klein, your AI coding assistant. I can help you understand code, generate new code, fix bugs, and optimize your files. What would you like to work on?',
            timestamp: Date.now()
        });
        
        // Set up quick actions
        this.renderQuickActions();
    }
    
    async handleChatSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const input = form.querySelector('#aiChatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Clear input and add user message
        input.value = '';
        this.autoResizeInput(input);
        this.addMessage({
            type: 'user',
            content: message,
            timestamp: Date.now()
        });
        
        // Show thinking indicator
        const thinkingId = this.showThinking();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove thinking indicator
            this.hideThinking(thinkingId);
            
            // Add AI response
            this.addMessage({
                type: 'assistant',
                content: response.content,
                timestamp: Date.now(),
                metadata: response.metadata
            });
            
            // Handle any code suggestions
            if (response.codeSuggestion) {
                this.handleCodeSuggestion(response.codeSuggestion);
            }
            
        } catch (error) {
            // Remove thinking indicator
            this.hideThinking(thinkingId);
            
            // Show error message
            this.addMessage({
                type: 'error',
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                timestamp: Date.now()
            });
            
            console.error('AI Assistant Error:', error);
        }
    }
    
    async getAIResponse(message) {
        const requestData = {
            message: message,
            context: this.currentContext,
            history: this.conversationHistory.slice(-10), // Last 10 messages
            model: this.models.primary
        };
        
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'AI request failed');
        }
        
        return data.response;
    }
    
    async handleQuickAction(action) {
        const currentFile = this.getCurrentFileContent();
        let prompt = '';
        
        switch (action) {
            case 'explain':
                prompt = 'Please explain what this code does and how it works:';
                break;
            case 'optimize':
                prompt = 'Please suggest optimizations for this code:';
                break;
            case 'debug':
                prompt = 'Please help me debug this code and identify potential issues:';
                break;
            case 'comment':
                prompt = 'Please add helpful comments to this code:';
                break;
            case 'test':
                prompt = 'Please generate unit tests for this code:';
                break;
            case 'refactor':
                prompt = 'Please refactor this code to improve readability and maintainability:';
                break;
            default:
                return;
        }
        
        if (currentFile) {
            this.addMessage({
                type: 'user',
                content: `${prompt}\n\n\`\`\`${currentFile.language}\n${currentFile.content}\n\`\`\``,
                timestamp: Date.now()
            });
            
            // Trigger AI response
            const thinkingId = this.showThinking();
            
            try {
                const response = await this.getAIResponse(prompt + '\n\n' + currentFile.content);
                this.hideThinking(thinkingId);
                
                this.addMessage({
                    type: 'assistant',
                    content: response.content,
                    timestamp: Date.now(),
                    metadata: response.metadata
                });
                
                if (response.codeSuggestion) {
                    this.handleCodeSuggestion(response.codeSuggestion);
                }
                
            } catch (error) {
                this.hideThinking(thinkingId);
                this.addMessage({
                    type: 'error',
                    content: 'Failed to process your request. Please try again.',
                    timestamp: Date.now()
                });
            }
        } else {
            this.addMessage({
                type: 'assistant',
                content: 'Please open a file in the editor first, then I can help you with that action.',
                timestamp: Date.now()
            });
        }
    }
    
    addMessage(message) {
        const chatContainer = document.getElementById('aiChatMessages');
        if (!chatContainer) return;
        
        const messageElement = this.createMessageElement(message);
        chatContainer.appendChild(messageElement);
        
        // Add to conversation history
        this.conversationHistory.push(message);
        
        // Save conversation
        this.saveConversationHistory();
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Auto-scroll animation
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        });
    }
    
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `chat-message chat-message-${message.type}`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (message.type === 'user') {
            div.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.formatMessage(message.content)}</div>
                    <div class="message-timestamp">${timestamp}</div>
                </div>
                <div class="message-avatar user-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
            `;
        } else if (message.type === 'assistant') {
            div.innerHTML = `
                <div class="message-avatar ai-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-text">${this.formatMessage(message.content)}</div>
                    <div class="message-timestamp">${timestamp}</div>
                    ${message.metadata?.tokens ? `<div class="message-metadata">Tokens: ${message.metadata.tokens}</div>` : ''}
                </div>
            `;
        } else if (message.type === 'error') {
            div.innerHTML = `
                <div class="message-avatar error-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-text error-text">${this.escapeHtml(message.content)}</div>
                    <div class="message-timestamp">${timestamp}</div>
                </div>
            `;
        }
        
        return div;
    }
    
    formatMessage(content) {
        // Simple markdown-like formatting
        content = this.escapeHtml(content);
        
        // Code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            return `<pre class="code-block" data-language="${language || 'text'}"><code>${code.trim()}</code></pre>`;
        });
        
        // Inline code
        content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Bold text
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Links
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // Line breaks
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }
    
    showThinking() {
        const chatContainer = document.getElementById('aiChatMessages');
        if (!chatContainer) return null;
        
        const thinkingId = 'thinking-' + Date.now();
        const thinkingElement = document.createElement('div');
        thinkingElement.id = thinkingId;
        thinkingElement.className = 'chat-message chat-message-thinking';
        thinkingElement.innerHTML = `
            <div class="message-avatar ai-avatar">
                <div class="thinking-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
            <div class="message-content">
                <div class="message-text">Klein is thinking...</div>
            </div>
        `;
        
        chatContainer.appendChild(thinkingElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        return thinkingId;
    }
    
    hideThinking(thinkingId) {
        if (thinkingId) {
            const element = document.getElementById(thinkingId);
            if (element) {
                element.remove();
            }
        }
    }
    
    handleCodeSuggestion(suggestion) {
        if (!suggestion || !suggestion.code) return;
        
        // Add apply button to suggestion
        const chatContainer = document.getElementById('aiChatMessages');
        const lastMessage = chatContainer.lastElementChild;
        
        if (lastMessage && lastMessage.classList.contains('chat-message-assistant')) {
            const applyButton = document.createElement('button');
            applyButton.className = 'btn-primary btn-sm code-apply-btn';
            applyButton.textContent = 'Apply to Editor';
            applyButton.onclick = () => this.applySuggestionToEditor(suggestion);
            
            const messageContent = lastMessage.querySelector('.message-content');
            messageContent.appendChild(applyButton);
        }
    }
    
    applySuggestionToEditor(suggestion) {
        // Apply code suggestion to Monaco Editor
        if (window.ezEditor && window.ezEditor.editor) {
            const editor = window.ezEditor.editor;
            
            if (suggestion.replace) {
                // Replace specific text
                const model = editor.getModel();
                const matches = model.findMatches(suggestion.search, false, false, false, null, true);
                
                if (matches.length > 0) {
                    editor.executeEdits('ai-suggestion', [{
                        range: matches[0].range,
                        text: suggestion.code
                    }]);
                }
            } else {
                // Replace entire content or insert at cursor
                if (suggestion.insertAtCursor && editor.getSelection()) {
                    editor.executeEdits('ai-suggestion', [{
                        range: editor.getSelection(),
                        text: suggestion.code
                    }]);
                } else {
                    editor.setValue(suggestion.code);
                }
            }
            
            // Focus editor
            editor.focus();
        }
    }
    
    renderQuickActions() {
        const actionsContainer = document.getElementById('aiQuickActions');
        if (!actionsContainer) return;
        
        const actions = [
            { id: 'explain', label: 'Explain Code', icon: '📖' },
            { id: 'optimize', label: 'Optimize', icon: '⚡' },
            { id: 'debug', label: 'Debug', icon: '🐛' },
            { id: 'comment', label: 'Add Comments', icon: '💬' },
            { id: 'test', label: 'Generate Tests', icon: '🧪' },
            { id: 'refactor', label: 'Refactor', icon: '🔧' }
        ];
        
        actionsContainer.innerHTML = actions.map(action => `
            <button class="quick-action-btn" data-ai-action="${action.id}" title="${action.label}">
                <span class="action-icon">${action.icon}</span>
                <span class="action-label">${action.label}</span>
            </button>
        `).join('');
    }
    
    toggle() {
        const assistant = document.getElementById('aiAssistant');
        if (assistant) {
            this.isVisible = !assistant.classList.contains('collapsed');
            assistant.classList.toggle('collapsed');
            
            // Update toggle button
            const toggleButton = document.getElementById('toggleAssistant');
            if (toggleButton) {
                toggleButton.setAttribute('aria-expanded', this.isVisible);
            }
        }
    }
    
    updateContext(context) {
        this.currentContext = context;
        
        // Update context display if needed
        const contextDisplay = document.getElementById('aiContextDisplay');
        if (contextDisplay && context) {
            contextDisplay.textContent = `${context.fileName} (${context.language})`;
            contextDisplay.style.display = 'block';
        }
    }
    
    getCurrentFileContent() {
        if (window.ezEditor && window.ezEditor.editor && window.ezEditor.currentFile) {
            return {
                content: window.ezEditor.editor.getValue(),
                language: window.ezEditor.detectLanguage(window.ezEditor.currentFile.path),
                fileName: window.ezEditor.currentFile.path.split('/').pop()
            };
        }
        return null;
    }
    
    autoResizeInput(input) {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }
    
    clearConversation() {
        if (confirm('Are you sure you want to clear the conversation history?')) {
            this.conversationHistory = [];
            this.saveConversationHistory();
            
            const chatContainer = document.getElementById('aiChatMessages');
            if (chatContainer) {
                chatContainer.innerHTML = '';
            }
            
            // Re-add welcome message
            this.initializeUI();
        }
    }
    
    loadConversationHistory() {
        try {
            const stored = localStorage.getItem('ezedit_ai_conversation');
            if (stored) {
                this.conversationHistory = JSON.parse(stored);
                
                // Restore messages to UI
                const chatContainer = document.getElementById('aiChatMessages');
                if (chatContainer && this.conversationHistory.length > 0) {
                    chatContainer.innerHTML = '';
                    this.conversationHistory.forEach(message => {
                        const messageElement = this.createMessageElement(message);
                        chatContainer.appendChild(messageElement);
                    });
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
            this.conversationHistory = [];
        }
    }
    
    saveConversationHistory() {
        try {
            // Keep only last 50 messages to avoid storage issues
            const toSave = this.conversationHistory.slice(-50);
            localStorage.setItem('ezedit_ai_conversation', JSON.stringify(toSave));
        } catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize AI Assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAssistant;
}