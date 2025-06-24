/**
 * EzEdit AI Assistant (Klein)
 * Provides AI-powered code assistance and suggestions
 */

window.ezEdit = window.ezEdit || {};

window.ezEdit.aiAssistant = (function() {
  // Private variables
  const memoryService = new MemoryService();
  
  // DOM elements
  let container;
  let chatHistory;
  let messageInput;
  
  // State
  let isInitialized = false;
  let isProcessing = false;
  let messages = [];
  
  /**
   * Initialize AI assistant
   * @param {string} containerId - ID of the container element
   */
  function initialize(containerId = 'ai-chat-container') {
    container = document.getElementById(containerId);
    if (!container) {
      console.error('AI assistant container not found');
      return;
    }
    
    // Create UI if not already created
    if (!isInitialized) {
      createUI();
      loadMessages();
      setupEventListeners();
      isInitialized = true;
    }
    
    // Add welcome message if no messages
    if (messages.length === 0) {
      addSystemMessage(
        "Hi, I'm Klein, your AI coding assistant! I can help you with:",
        [
          "Explaining code",
          "Suggesting improvements",
          "Fixing bugs",
          "Writing new code",
          "Answering questions"
        ]
      );
    }
  }
  
  /**
   * Create AI assistant UI
   */
  function createUI() {
    container.innerHTML = `
      <div class="ai-header">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Klein AI Assistant
        </h3>
        <div class="ai-actions">
          <button class="btn-icon" id="clear-chat" title="Clear Chat">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div class="ai-chat-history" id="ai-chat-history"></div>
      <div class="ai-input-container">
        <textarea id="ai-message-input" placeholder="Ask Klein a question..." rows="1"></textarea>
        <button class="btn-icon" id="send-message" title="Send Message">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    `;
    
    chatHistory = document.getElementById('ai-chat-history');
    messageInput = document.getElementById('ai-message-input');
  }
  
  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Send message button
    const sendButton = document.getElementById('send-message');
    if (sendButton) {
      sendButton.addEventListener('click', sendMessage);
    }
    
    // Clear chat button
    const clearButton = document.getElementById('clear-chat');
    if (clearButton) {
      clearButton.addEventListener('click', clearChat);
    }
    
    // Message input
    if (messageInput) {
      // Send message on Enter (but allow Shift+Enter for new line)
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
        
        // Auto-resize textarea
        autoResizeTextarea(messageInput);
      });
      
      // Auto-resize on input
      messageInput.addEventListener('input', () => {
        autoResizeTextarea(messageInput);
      });
    }
    
    // Delegate click events for action buttons in messages
    chatHistory.addEventListener('click', (e) => {
      const target = e.target;
      
      // Apply suggestion button
      if (target.classList.contains('apply-suggestion')) {
        const messageElement = target.closest('.ai-message');
        if (messageElement) {
          const suggestionElement = messageElement.querySelector('pre code');
          if (suggestionElement && window.ezEdit.monacoEditor) {
            window.ezEdit.monacoEditor.applyAISuggestion(suggestionElement.textContent);
          }
        }
      }
    });
  }
  
  /**
   * Auto-resize textarea
   * @param {HTMLElement} textarea - Textarea element
   */
  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  }
  
  /**
   * Send message to AI assistant
   */
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;
    
    // Clear input
    messageInput.value = '';
    autoResizeTextarea(messageInput);
    
    // Add user message to chat
    addUserMessage(message);
    
    // Show thinking indicator
    addThinkingMessage();
    
    // Process message
    isProcessing = true;
    
    try {
      // Get current file context
      let fileContext = '';
      if (window.ezEdit.monacoEditor) {
        const currentFile = window.ezEdit.monacoEditor.getCurrentFile();
        if (currentFile && currentFile.path) {
          fileContext = `Current file: ${currentFile.path}\n\n${currentFile.modifiedContent}`;
        }
      }
      
      // Prepare conversation history
      const conversationHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add system message with context
      const systemMessage = {
        role: 'system',
        content: `You are Klein, an AI coding assistant for the ezEdit web-based code editor. 
        You help users understand, modify, and improve their code.
        Be concise, helpful, and focus on practical solutions.
        When suggesting code, format it with markdown code blocks.
        ${fileContext ? 'Here is the current file the user is editing:\n\n' + fileContext : ''}
        `
      };
      
      // Add user message
      conversationHistory.unshift(systemMessage);
      
      // Call OpenAI API
      const response = await callOpenAI(conversationHistory);
      
      // Remove thinking message
      removeThinkingMessage();
      
      // Add AI response to chat
      addAssistantMessage(response);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Remove thinking message
      removeThinkingMessage();
      
      // Add error message
      addErrorMessage('Sorry, I encountered an error. Please try again.');
    } finally {
      isProcessing = false;
    }
  }
  
  /**
   * Call OpenAI API
   * @param {Array} messages - Conversation history
   * @returns {string} - AI response
   */
  async function callOpenAI(messages) {
    // Get API key
    const apiKey = memoryService.getPreference('openaiApiKey');
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // Check if user has Pro plan
    const userProfile = await checkUserPlan();
    if (userProfile.plan !== 'pro') {
      return 'To use AI assistance, please upgrade to the Pro plan. Free trial users can view and edit files but cannot use AI features.';
    }
    
    try {
      // Simulate API call for development
      // In production, this would be a real API call
      console.log('Simulating OpenAI API call with messages:', messages);
      
      // Simulate response based on user message
      const userMessage = messages.find(msg => msg.role === 'user').content.toLowerCase();
      
      // Generate simulated response based on user message
      let response = '';
      
      if (userMessage.includes('explain') || userMessage.includes('what')) {
        response = "This code appears to be a JavaScript function that handles file operations. It uses async/await for asynchronous operations and includes error handling with try/catch blocks. The main purpose seems to be processing file data and returning results to the caller.";
      } else if (userMessage.includes('improve') || userMessage.includes('optimize')) {
        response = "Here are some suggestions to improve your code:\n\n```javascript\n// Add proper error handling\ntry {\n  const result = await processFile(data);\n  return result;\n} catch (error) {\n  console.error('Error processing file:', error);\n  throw new Error('Failed to process file');\n}\n```\n\nYou can apply this suggestion using the button below.";
      } else if (userMessage.includes('bug') || userMessage.includes('fix')) {
        response = "I found a potential bug in your code. You're not properly handling the case when the file doesn't exist. Here's a fix:\n\n```javascript\nif (!fs.existsSync(filePath)) {\n  return { success: false, error: 'File not found' };\n}\n```";
      } else if (userMessage.includes('write') || userMessage.includes('create')) {
        response = "Here's a simple function to create a new file:\n\n```javascript\nasync function createNewFile(path, content = '') {\n  try {\n    await fs.promises.writeFile(path, content);\n    return { success: true };\n  } catch (error) {\n    console.error('Error creating file:', error);\n    return { success: false, error: error.message };\n  }\n}\n```";
      } else {
        response = "I'm here to help with your code! I can explain code, suggest improvements, fix bugs, or write new code for you. What would you like me to do?";
      }
      
      return response;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to get AI response');
    }
  }
  
  /**
   * Check user plan
   * @returns {Object} - User profile
   */
  async function checkUserPlan() {
    try {
      const supabaseService = new SupabaseService(memoryService);
      const profile = await supabaseService.getUserProfile();
      return profile || { plan: 'free-trial' };
    } catch (error) {
      console.error('Error checking user plan:', error);
      return { plan: 'free-trial' };
    }
  }
  
  /**
   * Add user message to chat
   * @param {string} content - Message content
   */
  function addUserMessage(content) {
    // Create message object
    const message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    // Add to messages array
    messages.push(message);
    
    // Save messages
    saveMessages();
    
    // Add to chat history
    const messageElement = document.createElement('div');
    messageElement.className = 'ai-message user-message';
    messageElement.innerHTML = `
      <div class="message-avatar">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </div>
      <div class="message-content">
        <div class="message-text">${formatMessage(content)}</div>
      </div>
    `;
    
    chatHistory.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
  }
  
  /**
   * Add assistant message to chat
   * @param {string} content - Message content
   */
  function addAssistantMessage(content) {
    // Create message object
    const message = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString()
    };
    
    // Add to messages array
    messages.push(message);
    
    // Save messages
    saveMessages();
    
    // Add to chat history
    const messageElement = document.createElement('div');
    messageElement.className = 'ai-message assistant-message';
    messageElement.innerHTML = `
      <div class="message-avatar">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </div>
      <div class="message-content">
        <div class="message-text">${formatMessage(content)}</div>
        ${content.includes('```') ? '<div class="message-actions"><button class="apply-suggestion">Apply Suggestion</button></div>' : ''}
      </div>
    `;
    
    chatHistory.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
  }
  
  /**
   * Add system message to chat
   * @param {string} content - Message content
   * @param {Array} list - Optional list items
   */
  function addSystemMessage(content, list = null) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'ai-message system-message';
    
    let messageHTML = `
      <div class="message-avatar">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <div class="message-content">
        <div class="message-text">${content}</div>
    `;
    
    // Add list if provided
    if (list && list.length > 0) {
      messageHTML += '<ul>';
      list.forEach(item => {
        messageHTML += `<li>${item}</li>`;
      });
      messageHTML += '</ul>';
    }
    
    messageHTML += '</div>';
    messageElement.innerHTML = messageHTML;
    
    chatHistory.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
  }
  
  /**
   * Add error message to chat
   * @param {string} content - Message content
   */
  function addErrorMessage(content) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'ai-message error-message';
    messageElement.innerHTML = `
      <div class="message-avatar">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <div class="message-content">
        <div class="message-text">${content}</div>
      </div>
    `;
    
    chatHistory.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
  }
  
  /**
   * Add thinking message to chat
   */
  function addThinkingMessage() {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'ai-message assistant-message thinking';
    messageElement.id = 'thinking-message';
    messageElement.innerHTML = `
      <div class="message-avatar">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </div>
      <div class="message-content">
        <div class="message-text">
          <div class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    
    chatHistory.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
  }
  
  /**
   * Remove thinking message
   */
  function removeThinkingMessage() {
    const thinkingMessage = document.getElementById('thinking-message');
    if (thinkingMessage) {
      thinkingMessage.remove();
    }
  }
  
  /**
   * Format message content with markdown
   * @param {string} content - Message content
   * @returns {string} - Formatted message
   */
  function formatMessage(content) {
    // Replace code blocks
    content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
      const language = code.split('\n')[0].trim();
      const codeContent = language ? code.substring(language.length).trim() : code.trim();
      return `<pre><code class="language-${language || 'plaintext'}">${escapeHtml(codeContent)}</code></pre>`;
    });
    
    // Replace inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Replace line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
  }
  
  /**
   * Escape HTML special characters
   * @param {string} html - HTML string
   * @returns {string} - Escaped HTML
   */
  function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  /**
   * Generate unique ID
   * @returns {string} - Unique ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Scroll chat history to bottom
   */
  function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
  
  /**
   * Save messages to memory
   */
  function saveMessages() {
    // Limit to last 50 messages
    const limitedMessages = messages.slice(-50);
    memoryService.setPreference('aiChatHistory', limitedMessages);
  }
  
  /**
   * Load messages from memory
   */
  function loadMessages() {
    const savedMessages = memoryService.getPreference('aiChatHistory');
    if (savedMessages && Array.isArray(savedMessages)) {
      messages = savedMessages;
    }
  }
  
  /**
   * Clear chat history
   */
  function clearChat() {
    // Clear messages array
    messages = [];
    
    // Clear chat history
    chatHistory.innerHTML = '';
    
    // Save empty messages
    saveMessages();
    
    // Add welcome message
    addSystemMessage(
      "Chat history cleared. How can I help you today?",
      [
        "Explaining code",
        "Suggesting improvements",
        "Fixing bugs",
        "Writing new code",
        "Answering questions"
      ]
    );
  }
  
  // Public API
  return {
    initialize,
    sendMessage,
    clearChat
  };
})();
