// DOM Elements
const messageForm = document.getElementById('message-form');
const userInput = document.getElementById('user-input');
const messagesContainer = document.getElementById('messages');
const newChatButton = document.querySelector('.new-chat');
const themeToggle = document.getElementById('theme-toggle');
const settingsToggle = document.getElementById('settings-toggle');
const settingsDropdown = document.querySelector('.settings-dropdown');
const themeInputs = document.querySelectorAll('input[name="theme"]');
const colorOptions = document.querySelectorAll('.color-option');
const logoutButton = document.getElementById('logout-button');
const historyList = document.querySelector('.history-list');
const clearHistoryButton = document.getElementById('clear-history');

// Chat state
let currentChatId = null;
let chats = [];

// Load chats from localStorage
function loadChats() {
    const savedChats = localStorage.getItem('chats');
    chats = savedChats ? JSON.parse(savedChats) : [];
    renderChatHistory();
}

// Save chats to localStorage
function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

// Create new chat
function createNewChat() {
    const chat = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString()
    };
    chats.unshift(chat);
    currentChatId = chat.id;
    saveChats();
    renderChatHistory();
    loadChat(chat.id);
}

// Load specific chat
function loadChat(chatId) {
    currentChatId = chatId;
    messagesContainer.innerHTML = '';
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
        chat.messages.forEach(msg => addMessage(msg.content, msg.sender, false));
        // Update active state in history
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === chatId);
        });
        // Update chat title if it's still default
        if (chat.title === 'New Chat' && chat.messages.length > 0) {
            const firstMessage = chat.messages[0].content;
            chat.title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
            saveChats();
            renderChatHistory();
        }
    }
}

// Delete chat
function deleteChat(chatId, event) {
    event.stopPropagation();
    chats = chats.filter(chat => chat.id !== chatId);
    saveChats();
    renderChatHistory();
    if (currentChatId === chatId) {
        if (chats.length > 0) {
            loadChat(chats[0].id);
        } else {
            createNewChat();
        }
    }
}

// Render chat history
function renderChatHistory() {
    historyList.innerHTML = '';
    
    if (chats.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-comments"></i>
                <p>No chat history yet</p>
            </div>
        `;
        return;
    }

    chats.forEach(chat => {
        const historyItem = document.createElement('button');
        historyItem.className = `history-item${chat.id === currentChatId ? ' active' : ''}`;
        historyItem.dataset.id = chat.id;
        historyItem.innerHTML = `
            <i class="fas fa-message"></i>
            <span class="chat-title">${chat.title}</span>
            <button class="delete-chat" title="Delete chat">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        historyItem.addEventListener('click', () => loadChat(chat.id));
        historyItem.querySelector('.delete-chat').addEventListener('click', (e) => deleteChat(chat.id, e));
        
        historyList.appendChild(historyItem);
    });
}

// Add message to current chat
function addMessage(content, sender, save = true) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('message-icon');
    iconSpan.innerHTML = sender === 'user' ? 
        '<i class="fas fa-user"></i>' : 
        '<i class="fas fa-robot"></i>';

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-content');
    textDiv.textContent = content;

    messageDiv.appendChild(iconSpan);
    messageDiv.appendChild(textDiv);
    messagesContainer.appendChild(messageDiv);

    if (save && currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({ sender, content });
            saveChats();
            // Update chat title if it's the first message
            if (chat.messages.length === 1) {
                chat.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
                renderChatHistory();
            }
        }
    }

    scrollToBottom();
}

// Event Listeners
newChatButton.addEventListener('click', createNewChat);

clearHistoryButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
        chats = [];
        saveChats();
        createNewChat();
    }
});

// Theme Management
function initializeTheme() {
    // Get saved theme or default to system
    const savedTheme = localStorage.getItem('theme') || 'system';
    const savedColor = localStorage.getItem('accentColor') || '#10a37f';
    
    // Set initial theme
    setTheme(savedTheme);
    setAccentColor(savedColor);
    
    // Check radio button
    document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
    
    // Set active color
    document.querySelector(`[data-color="${savedColor}"]`)?.classList.add('active');
}

function setTheme(theme) {
    if (theme === 'system') {
        // Check system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        themeToggle.innerHTML = `<i class="fas fa-${systemTheme === 'dark' ? 'moon' : 'sun'}"></i>`;
    } else {
        document.documentElement.setAttribute('data-theme', theme);
        themeToggle.innerHTML = `<i class="fas fa-${theme === 'dark' ? 'moon' : 'sun'}"></i>`;
    }
    localStorage.setItem('theme', theme);
}

function setAccentColor(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    localStorage.setItem('accentColor', color);
    
    // Update active state
    colorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === color);
    });
}

// Event Listeners
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.querySelector(`input[name="theme"][value="${newTheme}"]`).checked = true;
});

settingsToggle.addEventListener('click', () => {
    settingsDropdown.classList.toggle('active');
});

// Close settings when clicking outside
document.addEventListener('click', (e) => {
    if (!settingsDropdown.contains(e.target) && !settingsToggle.contains(e.target)) {
        settingsDropdown.classList.remove('active');
    }
});

// Theme radio buttons
themeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
        setTheme(e.target.value);
    });
});

// Color options
colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        setAccentColor(option.dataset.color);
    });
});

// System theme change detection
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === 'system') {
        setTheme('system');
    }
});

// Logout button
logoutButton.addEventListener('click', () => {
    // Add your logout logic here
    alert('Logout functionality would go here');
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    const newHeight = Math.min(this.scrollHeight, 200);
    this.style.height = newHeight + 'px';
    
    // Update messages container bottom margin to prevent overlap
    const totalHeight = newHeight + 32; // padding + border
    messagesContainer.style.bottom = totalHeight + 'px';
});

// Handle keyboard events
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        // If shift + enter, create a new line
        if (e.shiftKey) {
            // Let the default behavior happen (new line)
            const cursorPosition = this.selectionStart;
            const textBeforeCursor = this.value.substring(0, cursorPosition);
            const textAfterCursor = this.value.substring(cursorPosition);
            
            // Manually insert newline to ensure consistent behavior
            this.value = textBeforeCursor + '\n' + textAfterCursor;
            
            // Move cursor after the new line
            this.selectionStart = this.selectionEnd = cursorPosition + 1;
            
            // Trigger input event for auto-resize
            this.dispatchEvent(new Event('input'));
            
            e.preventDefault();
            return;
        }
        
        // If just enter, send the message
        e.preventDefault();
        if (this.value.trim()) {
            messageForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Handle form submission
messageForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    
    // Clear input and reset height
    userInput.value = '';
    userInput.style.height = 'auto';

    // Simulate bot response
    await simulateBotResponse(message);
});

// Simulate bot response
async function simulateBotResponse(userMessage) {
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message', 'typing');
    typingDiv.textContent = 'Typing...';
    messagesContainer.appendChild(typingDiv);

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remove typing indicator
    typingDiv.remove();

    // Generate response based on user message
    let response = generateResponse(userMessage);
    addMessage(response, 'bot');
}

// Simple response generation
function generateResponse(userMessage) {
    const responses = [
        "That's an interesting perspective. Tell me more about it.",
        "I understand what you're saying. Let me think about that.",
        "Thank you for sharing that with me.",
        "That's a great question! Let me help you with that.",
        "I appreciate your input. Here's what I think about it..."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Scroll to bottom of messages
function scrollToBottom() {
    const lastMessage = messagesContainer.lastElementChild;
    if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

// Initialize
loadChats();
if (chats.length === 0) {
    createNewChat();
}
initializeTheme();
