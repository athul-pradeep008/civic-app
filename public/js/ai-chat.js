class AIChat {
    constructor() {
        this.isOpen = false;
        this.history = [];
        this.init();
    }

    init() {
        this.createDOM();
        this.attachEvents();
    }

    createDOM() {
        const container = document.createElement('div');
        container.innerHTML = `
        <button class="chat-widget-btn" id="chat-toggle">
          💬
        </button>
        <div class="chat-window" id="chat-window">
          <div class="chat-header">
            <h3>Civic Assistant 🤖</h3>
            <button id="chat-close" style="background:none;border:none;color:white;cursor:pointer;">✕</button>
          </div>
          <div class="chat-messages" id="chat-messages">
            <!-- Intro Message with Options -->
            <div class="message ai">
                👋 Hello! How can I help you today?
                <div class="chat-options">
                    <button class="chat-option-btn" onclick="window.aiChat.sendOption('📝 Report Issue')">📝 Report Issue</button>
                    <button class="chat-option-btn" onclick="window.aiChat.sendOption('🔍 Check Status')">🔍 Check Status</button>
                    <button class="chat-option-btn" onclick="window.aiChat.sendOption('💡 Issue Types')">💡 Issue Types</button>
                </div>
            </div>
          </div>
          <form class="chat-input-area" id="chat-form">
            <input type="text" id="chat-input" class="form-control" placeholder="Type a message..." required style="margin-bottom:0;">
            <button type="submit" class="btn btn-primary" style="width:auto;">➤</button>
          </form>
        </div>
      `;
        document.body.appendChild(container);

        this.window = document.getElementById('chat-window');
        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.toggleBtn = document.getElementById('chat-toggle');

        // Expose instance for inline onclick handlers
        window.aiChat = this;
    }

    attachEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggle());
        document.getElementById('chat-close').addEventListener('click', () => this.toggle());

        document.getElementById('chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage(this.input.value.trim());
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.window.classList.toggle('active', this.isOpen);
        if (this.isOpen) this.input.focus();
    }

    appendMessage(content, sender, isHtml = false) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;

        let finalContent = content;
        if (!isHtml) {
            // Simple linkify for non-HTML messages (like user messages or simple AI text)
            finalContent = this.linkify(content);
            div.innerHTML = finalContent;
        } else {
            // Already HTML, but let's ensure any naked URLs inside are also links
            div.innerHTML = content;
        }

        this.messagesContainer.appendChild(div);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    linkify(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" style="color:inherit;text-decoration:underline;">${url}</a>`;
        });
    }

    sendOption(text) {
        // Quick Navigation Map
        const navMap = {
            '📝 Report Issue': 'report-issue.html',
            '🔍 Check Status': 'dashboard.html',
            '🏆 Leaderboard': 'dashboard.html',
            'Go to Dashboard': 'dashboard.html',
            'Start Reporting': 'report-issue.html',
            'Home': 'index.html'
        };

        const cleanText = text.replace(/[📝🔍🏆💡]/g, '').trim();
        const path = navMap[text] || navMap[cleanText];

        if (path) {
            window.location.href = path;
        } else {
            this.sendMessage(text);
        }
    }

    async sendMessage(text) {
        if (!text) return;

        // Add user message
        this.appendMessage(text, 'user');
        this.input.value = '';

        // Add loading
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai';
        loadingDiv.id = loadingId;
        loadingDiv.textContent = 'Thinking...';
        this.messagesContainer.appendChild(loadingDiv);

        try {
            const response = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: this.history
                })
            });

            const data = await response.json();
            document.getElementById(loadingId).remove();

            if (data.success) {
                const reply = data.reply; // Object { text, options }

                let html = reply.text.replace(/\n/g, '<br>');

                // Render chips if available
                if (reply.options && reply.options.length > 0) {
                    html += `<div class="chat-options">`;
                    reply.options.forEach(opt => {
                        html += `<button class="chat-option-btn" onclick="window.aiChat.sendOption('${opt}')">${opt}</button>`;
                    });
                    html += `</div>`;
                }

                this.appendMessage(html, 'ai', true);

                // Update history (store simplified text)
                this.history.push({ role: 'user', content: text });
                this.history.push({ role: 'model', content: reply.text });
            } else {
                this.appendMessage("Sorry, error.", 'ai');
            }
        } catch (error) {
            document.getElementById(loadingId)?.remove();
            this.appendMessage("Network error.", 'ai');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AIChat();
});
