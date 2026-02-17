/**
 * ProthexaI Clinical Chatbot
 * Patient-specific Gemini-powered clinical assistant
 * Injected into dashboard.html as a floating widget
 */
import { apiRequest } from './api.js';

(function () {
    // ─── State ────────────────────────────────────────────
    let isOpen = false;
    let isLoading = false;
    let messages = [];

    // ─── Create DOM ───────────────────────────────────────
    function createChatWidget() {
        // Floating Button
        const fab = document.createElement('button');
        fab.id = 'chat-fab';
        fab.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M8 10h.01M12 10h.01M16 10h.01" stroke-width="3"/>
            </svg>`;
        fab.setAttribute('aria-label', 'Open Clinical Assistant');

        // Chat Panel
        const panel = document.createElement('div');
        panel.id = 'chat-panel';
        panel.classList.add('chat-hidden');
        panel.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-ai-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="9" cy="14" r="1" fill="#2563EB"/><circle cx="15" cy="14" r="1" fill="#2563EB"/></svg>
                    </div>
                    <div>
                        <h3 class="chat-title">ProthexaI Assistant</h3>
                        <p class="chat-subtitle">Clinical Intelligence</p>
                    </div>
                </div>
                <button id="chat-close" aria-label="Close chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div id="chat-messages" class="chat-messages"></div>
            <div class="chat-input-area">
                <input id="chat-input" type="text" maxlength="500" placeholder="Ask about your gait data..." autocomplete="off" />
                <button id="chat-send" aria-label="Send message">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>
            <p class="chat-disclaimer">AI assistant for clinical monitoring only.</p>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(panel);

        return { fab, panel };
    }

    // ─── Inject Styles ────────────────────────────────────
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #chat-fab {
                position: fixed;
                bottom: 96px;
                right: 24px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: #2563EB;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
                z-index: 100;
                transition: all 0.3s ease;
                animation: fab-pulse 3s infinite ease-in-out;
            }
            #chat-fab:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(37, 99, 235, 0.6);
            }
            @keyframes fab-pulse {
                0%, 100% { box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4); }
                50% { box-shadow: 0 4px 30px rgba(37, 99, 235, 0.6); }
            }

            #chat-panel {
                position: fixed;
                bottom: 96px;
                right: 24px;
                width: 380px;
                max-height: 520px;
                background: rgba(30, 41, 59, 0.95);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid #334155;
                border-radius: 20px;
                display: flex;
                flex-direction: column;
                z-index: 101;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: bottom right;
            }
            #chat-panel.chat-hidden {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
                pointer-events: none;
            }

            .chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #334155;
            }
            .chat-header-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .chat-ai-icon {
                width: 36px;
                height: 36px;
                background: rgba(37, 99, 235, 0.15);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .chat-title {
                font-size: 14px;
                font-weight: 700;
                color: #F1F5F9;
                margin: 0;
                line-height: 1.2;
            }
            .chat-subtitle {
                font-size: 10px;
                color: #94A3B8;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            #chat-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 8px;
                transition: background 0.2s;
            }
            #chat-close:hover {
                background: rgba(255,255,255,0.1);
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-height: 280px;
                max-height: 340px;
                scroll-behavior: smooth;
            }
            .chat-messages::-webkit-scrollbar {
                width: 4px;
            }
            .chat-messages::-webkit-scrollbar-track {
                background: transparent;
            }
            .chat-messages::-webkit-scrollbar-thumb {
                background: #334155;
                border-radius: 4px;
            }

            .chat-bubble {
                max-width: 85%;
                padding: 10px 14px;
                border-radius: 16px;
                font-size: 13px;
                line-height: 1.5;
                animation: bubble-in 0.3s ease-out;
                word-wrap: break-word;
            }
            @keyframes bubble-in {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .chat-bubble.user {
                background: #2563EB;
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }
            .chat-bubble.assistant {
                background: rgba(30, 41, 59, 0.8);
                color: #F1F5F9;
                border: 1px solid #334155;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
            }

            .typing-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 10px 14px;
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid #334155;
                border-radius: 16px;
                border-bottom-left-radius: 4px;
                align-self: flex-start;
                max-width: 85%;
                animation: bubble-in 0.3s ease-out;
            }
            .typing-indicator span {
                font-size: 12px;
                color: #94A3B8;
            }
            .typing-dots {
                display: flex;
                gap: 3px;
            }
            .typing-dots div {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #2563EB;
                animation: dot-bounce 1.4s infinite ease-in-out;
            }
            .typing-dots div:nth-child(2) { animation-delay: 0.2s; }
            .typing-dots div:nth-child(3) { animation-delay: 0.4s; }
            @keyframes dot-bounce {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                40% { transform: scale(1); opacity: 1; }
            }

            .chat-input-area {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                border-top: 1px solid #334155;
            }
            #chat-input {
                flex: 1;
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 10px 14px;
                color: #F1F5F9;
                font-size: 13px;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            #chat-input:focus {
                border-color: #2563EB;
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
            }
            #chat-input::placeholder {
                color: #475569;
            }
            #chat-input:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            #chat-send {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                background: #2563EB;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            #chat-send:hover {
                background: #1d4ed8;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
            }
            #chat-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .chat-disclaimer {
                text-align: center;
                font-size: 9px;
                color: #475569;
                padding: 4px 0 10px;
                margin: 0;
            }

            /* Welcome message */
            .chat-welcome {
                text-align: center;
                padding: 20px;
            }
            .chat-welcome-icon {
                width: 48px;
                height: 48px;
                background: rgba(37, 99, 235, 0.1);
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 12px;
            }
            .chat-welcome h4 {
                color: #F1F5F9;
                font-size: 14px;
                font-weight: 600;
                margin: 0 0 4px;
            }
            .chat-welcome p {
                color: #64748B;
                font-size: 11px;
                margin: 0;
                line-height: 1.4;
            }

            /* Mobile Responsive */
            @media (max-width: 480px) {
                #chat-panel {
                    width: calc(100vw - 32px);
                    right: 16px;
                    bottom: 88px;
                    max-height: 70vh;
                }
                #chat-fab {
                    right: 16px;
                    bottom: 88px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ─── Render Messages ──────────────────────────────────
    function renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        container.innerHTML = '';

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="chat-welcome">
                    <div class="chat-welcome-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="9" cy="14" r="1" fill="#2563EB"/><circle cx="15" cy="14" r="1" fill="#2563EB"/></svg>
                    </div>
                    <h4>Clinical Assistant Ready</h4>
                    <p>Ask about your gait metrics, skin health, pressure distribution, or rehabilitation progress.</p>
                </div>`;
            return;
        }

        messages.forEach(msg => {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${msg.sender === 'user' ? 'user' : 'assistant'}`;
            bubble.textContent = msg.message;
            container.appendChild(bubble);
        });

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    function showTypingIndicator() {
        const container = document.getElementById('chat-messages');
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.id = 'typing-indicator';
        typing.innerHTML = `
            <div class="typing-dots"><div></div><div></div><div></div></div>
            <span>Analyzing biomechanical data...</span>`;
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    // ─── API Calls ────────────────────────────────────────
    async function loadHistory() {
        try {
            const data = await apiRequest('/chat/history');
            if (data && data.messages) {
                messages = data.messages;
                renderMessages();
            }
        } catch (e) {
            console.error('Failed to load chat history:', e);
        }
    }

    async function sendMessage(text) {
        if (isLoading || !text.trim()) return;

        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');

        // 1. Add user bubble immediately
        messages.push({ sender: 'user', message: text });
        renderMessages();

        // 2. Disable input, show typing
        isLoading = true;
        input.disabled = true;
        sendBtn.disabled = true;
        input.value = '';
        showTypingIndicator();

        try {
            // 3. Call backend
            const data = await apiRequest('/chat/message', 'POST', { message: text });

            // 4. Replace typing with response
            removeTypingIndicator();
            if (data && data.message) {
                messages.push({ sender: 'assistant', message: data.message });
            }
        } catch (e) {
            removeTypingIndicator();
            messages.push({
                sender: 'assistant',
                message: 'Unable to process request. Please try again.'
            });
        } finally {
            isLoading = false;
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
            renderMessages();
        }
    }

    // ─── Event Binding ────────────────────────────────────
    function bindEvents(fab, panel) {
        fab.addEventListener('click', () => {
            isOpen = !isOpen;
            if (isOpen) {
                panel.classList.remove('chat-hidden');
                fab.style.display = 'none';
                loadHistory();
                setTimeout(() => {
                    document.getElementById('chat-input')?.focus();
                }, 300);
            }
        });

        document.getElementById('chat-close').addEventListener('click', () => {
            isOpen = false;
            panel.classList.add('chat-hidden');
            fab.style.display = 'flex';
        });

        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');

        sendBtn.addEventListener('click', () => {
            sendMessage(input.value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input.value);
            }
        });
    }

    // ─── Init ─────────────────────────────────────────────
    function init() {
        injectStyles();
        const { fab, panel } = createChatWidget();
        bindEvents(fab, panel);
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
