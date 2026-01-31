/**
 * ContextAI Chat Widget SDK
 * Drop this into any website to enable ContextAI Chat
 */

(function (window, document) {
    // Configuration (can be overridden by window.CONTEXTAI_CONFIG)
    const CONFIG = Object.assign({
        socketUrl: 'http://localhost:5000/customer',
        companyId: 1,
        styles: {
            primaryColor: '#000000',
            fontFamily: 'Inter, system-ui, sans-serif'
        }
    }, window.CONTEXTAI_CONFIG || {});

    // Customer Identity (simple UUID generation)
    let customerUuid = localStorage.getItem('contextai_uuid');
    if (!customerUuid) {
        customerUuid = 'cust-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('contextai_uuid', customerUuid);
    }

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        #contextai-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: ${CONFIG.styles.fontFamily};
        }
        #contextai-launcher {
            width: 60px;
            height: 60px;
            background: ${CONFIG.styles.primaryColor};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        #contextai-launcher:hover { transform: scale(1.05); }
        #contextai-launcher svg { width: 30px; height: 30px; fill: white; }
        
        #contextai-chat-window {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 380px;
            height: 600px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        
        .cai-header {
            padding: 16px;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .cai-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #111827; }
        .cai-close { cursor: pointer; color: #6b7280; font-size: 20px; }
        
        .cai-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #ffffff;
        }
        
        .cai-msg {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
        }
        .cai-msg.customer {
            align-self: flex-end;
            background: #000000;
            color: white;
            border-bottom-right-radius: 2px;
        }
        .cai-msg.agent {
            align-self: flex-start;
            background: #f3f4f6;
            color: #1f2937;
            border-bottom-left-radius: 2px;
        }
        
        .cai-input-area {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 8px;
        }
        .cai-input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            outline: none;
            font-size: 14px;
        }
        .cai-input:focus { border-color: #000000; }
        .cai-send {
            background: #000000;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0 16px;
            cursor: pointer;
            font-weight: 600;
        }

        /* AI Summary Popup */
        #cai-ai-popup {
            position: absolute;
            top: 60px;
            left: 10px;
            right: 10px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 12px;
            font-size: 13px;
            color: #1e40af;
            display: none;
            animation: slideDown 0.3s ease;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // Create DOM Elements
    const container = document.createElement('div');
    container.id = 'contextai-widget-container';

    container.innerHTML = `
        <div id="contextai-chat-window">
            <div class="cai-header">
                <h3>Chat with Sales</h3>
                <span class="cai-close">&times;</span>
            </div>
            <div id="cai-ai-popup"></div>
            <div class="cai-messages" id="cai-messages-list">
                <div class="cai-msg agent">Hello! How can I help you find your dream car today?</div>
            </div>
            <form class="cai-input-area" id="cai-form">
                <input type="text" class="cai-input" placeholder="Type a message..." id="cai-input" autocomplete="off">
                <button type="submit" class="cai-send">Send</button>
            </form>
        </div>
        <div id="contextai-launcher">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
        </div>
    `;
    document.body.appendChild(container);

    // Elements
    const launcher = document.getElementById('contextai-launcher');
    const chatWindow = document.getElementById('contextai-chat-window');
    const closeBtn = document.querySelector('.cai-close');
    const form = document.getElementById('cai-form');
    const input = document.getElementById('cai-input');
    const msgList = document.getElementById('cai-messages-list');
    const aiPopup = document.getElementById('cai-ai-popup');

    // Toggle Chat
    let isOpen = false;
    function toggleChat() {
        isOpen = !isOpen;
        chatWindow.style.display = isOpen ? 'flex' : 'none';
        launcher.style.display = isOpen ? 'none' : 'flex';
        if (isOpen) {
            input.focus();
            connectSocket(); // Connect on open
        }
    }
    launcher.onclick = toggleChat;
    closeBtn.onclick = toggleChat;

    // Helper: Add Message
    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `cai-msg ${type}`;
        div.textContent = text;
        msgList.appendChild(div);
        msgList.scrollTop = msgList.scrollHeight;
    }

    // Helper: Show AI Summary
    function showAISummary(data) {
        aiPopup.innerHTML = `
            <strong>✨ Our AI Suggests:</strong><br>
            ${data.shortSummary}<br>
            <div style="margin-top:4px; font-weight:600;">Models: ${data.suggestedModels.join(', ')}</div>
        `;
        aiPopup.style.display = 'block';
        setTimeout(() => {
            aiPopup.style.display = 'none';
        }, 8000);
    }

    // Socket.IO Logic
    let socket;

    function connectSocket() {
        if (socket) return;

        // Dynamically load Socket.IO client if not present
        if (!window.io) {
            const script = document.createElement('script');
            script.src = "https://cdn.socket.io/4.7.4/socket.io.min.js";
            script.onload = initSocket;
            document.head.appendChild(script);
        } else {
            initSocket();
        }
    }

    function initSocket() {
        socket = io(CONFIG.socketUrl, {
            transports: ['websocket']
        });

        socket.on('connect', () => {
            console.log("Connected to ContextAI");
            socket.emit('customer:join', {
                customerUuid,
                companyId: CONFIG.companyId,
                metadata: {
                    title: document.title,
                    url: window.location.href
                }
            });
        });

        socket.on('agent:message', (data) => {
            addMessage(data.message, 'agent');
        });

        socket.on('ai:summary_update', (data) => {
            showAISummary(data);
        });
    }

    // Send Message
    form.onsubmit = (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'customer');
        input.value = '';

        if (socket) {
            socket.emit('customer:message', {
                customerUuid,
                message: text
            });
        }
    };

})(window, document);
