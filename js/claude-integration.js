/**
 * Claude AI Integration for Bootstrap Portfolio
 * Handles communication with Claude AI API and manages chat interface
 */

class ClaudeIntegration {
    constructor() {
        this.apiKey = null;
        this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-sonnet-20240229';
        this.maxTokens = 1000;
        this.conversationHistory = [];
        
        this.init();
    }

    init() {
        this.createChatInterface();
        this.bindEvents();
        this.loadApiKey();
    }

    /**
     * Load API key from user input or environment
     */
    loadApiKey() {
        // In a production environment, you'd want to handle this more securely
        // For demo purposes, we'll prompt the user for their API key
        const savedKey = localStorage.getItem('claude_api_key');
        if (savedKey) {
            this.apiKey = savedKey;
            this.updateConnectionStatus(true);
        } else {
            this.promptForApiKey();
        }
    }

    /**
     * Prompt user for API key
     */
    promptForApiKey() {
        const modal = document.getElementById('apiKeyModal');
        if (modal) {
            $('#apiKeyModal').modal('show');
        }
    }

    /**
     * Save API key
     */
    saveApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('claude_api_key', key);
        this.updateConnectionStatus(true);
        $('#apiKeyModal').modal('hide');
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('connection-status');
        if (statusIndicator) {
            statusIndicator.className = connected ? 'connected' : 'disconnected';
            statusIndicator.textContent = connected ? 'Connected to Claude AI' : 'Not Connected';
        }
    }

    /**
     * Create chat interface HTML
     */
    createChatInterface() {
        const chatHTML = `
            <div id="claude-chat-container" class="claude-chat-container">
                <div class="chat-header">
                    <h4>Chat with Claude AI</h4>
                    <div id="connection-status" class="connection-status disconnected">Not Connected</div>
                    <button id="close-chat" class="btn btn-sm btn-secondary">×</button>
                </div>
                <div id="chat-messages" class="chat-messages">
                    <div class="message ai-message">
                        <strong>Claude:</strong> Hello! I'm Claude, an AI assistant. How can I help you today?
                    </div>
                </div>
                <div class="chat-input-container">
                    <div class="input-group">
                        <input type="text" id="chat-input" class="form-control" placeholder="Type your message..." disabled>
                        <div class="input-group-append">
                            <button id="send-message" class="btn btn-primary" disabled>Send</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Floating Chat Button -->
            <button id="chat-toggle" class="chat-toggle-btn">
                <i class="fa fa-comments"></i>
            </button>
            
            <!-- API Key Modal -->
            <div class="modal fade" id="apiKeyModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Claude AI Setup</h5>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>To use Claude AI, you need an API key from Anthropic.</p>
                            <p><a href="https://console.anthropic.com/" target="_blank">Get your API key here</a></p>
                            <div class="form-group">
                                <label for="api-key-input">API Key:</label>
                                <input type="password" id="api-key-input" class="form-control" placeholder="sk-ant-...">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" id="save-api-key" class="btn btn-primary">Save & Connect</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Chat toggle
        document.getElementById('chat-toggle').addEventListener('click', () => {
            this.toggleChat();
        });

        // Close chat
        document.getElementById('close-chat').addEventListener('click', () => {
            this.toggleChat();
        });

        // Send message
        document.getElementById('send-message').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send message
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Save API key
        document.getElementById('save-api-key').addEventListener('click', () => {
            const apiKey = document.getElementById('api-key-input').value.trim();
            if (apiKey) {
                this.saveApiKey(apiKey);
            }
        });

        // Enable/disable input based on connection
        this.updateInputState();
    }

    /**
     * Toggle chat visibility
     */
    toggleChat() {
        const chatContainer = document.getElementById('claude-chat-container');
        chatContainer.classList.toggle('active');
    }

    /**
     * Update input state based on API key availability
     */
    updateInputState() {
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');
        
        if (this.apiKey) {
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.placeholder = "Type your message...";
        } else {
            chatInput.disabled = true;
            sendButton.disabled = true;
            chatInput.placeholder = "Please set up your API key first...";
        }
    }

    /**
     * Send message to Claude AI
     */
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message || !this.apiKey) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.callClaudeAPI(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai', true);
            console.error('Claude API Error:', error);
        }
    }

    /**
     * Call Claude AI API
     */
    async callClaudeAPI(message) {
        // Add message to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        const requestBody = {
            model: this.model,
            max_tokens: this.maxTokens,
            messages: this.conversationHistory
        };

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const aiResponse = data.content[0].text;

        // Add AI response to conversation history
        this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });

        return aiResponse;
    }

    /**
     * Add message to chat interface
     */
    addMessage(text, sender, isError = false) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${isError ? 'error-message' : ''}`;
        
        const senderName = sender === 'user' ? 'You' : 'Claude';
        messageDiv.innerHTML = `<strong>${senderName}:</strong> ${this.escapeHtml(text)}`;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message ai-message typing';
        typingDiv.innerHTML = '<strong>Claude:</strong> <span class="typing-dots">...</span>';
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Claude integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.claudeIntegration = new ClaudeIntegration();
});