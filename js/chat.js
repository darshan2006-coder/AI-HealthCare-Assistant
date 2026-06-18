import { generateAIResponse } from './ai/mainAI.js';
import { clearConversationState } from "./ai/conversationMemory.js";
import { resetTemperature } from "./ai/followUpState.js";
import { resetQuestionState } from "./ai/questionState.js";
import { resetUserSeverity } from "./ai/severityState.js";

let currentChatId = null;
let currentMessages = [];
let isTyping = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    setupEventListeners();
    loadChatSession();
});

function initializeChat() {
    const user = authUtils.getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    
    currentMessages = [];
    
   
    addMessage('bot', getWelcomeMessage(user), true);
    
    
    const quickSymptom = localStorage.getItem('quickSymptom');
    if (quickSymptom) {
        localStorage.removeItem('quickSymptom');
        setTimeout(() => {
            const symptomMessage = `I'm experiencing ${quickSymptom.replace('_', ' ')}`;
            handleUserMessage(symptomMessage);
        }, 1000);
    }
    
    
    const continueChatId = localStorage.getItem('continueChatId');
    if (continueChatId) {
        localStorage.removeItem('continueChatId');
        loadExistingChat(continueChatId);
    }
}

function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const saveChatBtn = document.getElementById('saveChatBtn');
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', function() {
            adjustTextareaHeight(this);
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }
    
    if (saveChatBtn) {
        saveChatBtn.addEventListener('click', saveCurrentChat);
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || isTyping) return;
    
    messageInput.value = '';
    adjustTextareaHeight(messageInput);
    
    handleUserMessage(message);
}

// We added the 'async' keyword here
async function handleUserMessage(message) {
    addMessage('user', message);
    
    showTypingIndicator();
    
    try {
        // We use 'await' to pause the chat until your backend server answers
        const aiResponse = await generateAIResponse(message);
        
        hideTypingIndicator();
        addMessage('bot', aiResponse);
        
        storageUtils.saveCurrentChatSession(currentMessages);
    } catch (error) {
        console.error("AI connection error:", error);
        hideTypingIndicator();
        addMessage('bot', "⚠️ Sorry, my AI brain is currently disconnected. Please make sure the backend server is running.");
    }
}

function addMessage(sender, content, skipSave = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const timestamp = new Date();
    const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <p>${formatMessageContent(content)}</p>
            <small class="message-time">${timeString}</small>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    
    if (!skipSave) {
        currentMessages.push({
            sender,
            content,
            timestamp: timestamp.toISOString()
        });
    }
    
    
    updateSaveButtonState();
}

function formatMessageContent(content) {
    
    content = content.replace(/\n/g, '<br>');
    
    
    content = content.replace(/•\s/g, '<span style="color: #2c5aa0;">•</span> ');
    
   
    content = content.replace(/⚠️/g, '<span style="color: #dc3545;">⚠️</span>');
    content = content.replace(/🚨/g, '<span style="color: #dc3545;">🚨</span>');
    content = content.replace(/💡/g, '<span style="color: #28a745;">💡</span>');
    
    return content;
}

function showTypingIndicator() {
    if (isTyping) return;
    
    isTyping = true;
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
   
    const style = document.createElement('style');
    style.textContent = `
        .typing-dots {
            display: flex;
            gap: 4px;
            padding: 10px;
        }
        .typing-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #2c5aa0;
            animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
    `;
    
    if (!document.getElementById('typingAnimationStyle')) {
        style.id = 'typingAnimationStyle';
        document.head.appendChild(style);
    }
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

function startNewChat() {
     console.log("Start New Chat Clicked");

    clearConversationState();
    resetTemperature();
    resetQuestionState();
    resetUserSeverity();

    console.log("Reset Functions Called");

    if (currentMessages.length > 1) { 
        if (!confirm('Are you sure you want to start a new chat? Unsaved messages will be lost.')) {
            return;
        }
    }
    
    
    currentChatId = null;
    currentMessages = [];
    
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    
    const user = authUtils.getCurrentUser();
    addMessage('bot', getWelcomeMessage(user), true);
    
    
    storageUtils.clearCurrentChatSession();
    
    
    updateSaveButtonState();
    
    
    document.getElementById('messageInput').focus();
}

function saveCurrentChat() {
    if (currentMessages.length <= 1) {
        authUtils.showMessage('No messages to save', 'error');
        return;
    }
    
    const chatData = {
        id: currentChatId,
        messages: currentMessages,
        timestamp: new Date().toISOString()
    };
    
    const savedChatId = storageUtils.saveChat(chatData);
    
    if (savedChatId) {
        currentChatId = savedChatId;
        authUtils.showMessage('Chat saved successfully!', 'success');
        updateSaveButtonState();
    } else {
        authUtils.showMessage('Failed to save chat', 'error');
    }
}

function loadExistingChat(chatId) {
    const chat = storageUtils.getChatById(chatId);
    if (!chat) return;
    
    currentChatId = chatId;
    currentMessages = [...chat.messages];
    
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    chat.messages.forEach(msg => {
        addMessage(msg.sender, msg.content, true);
    });
    
    updateSaveButtonState();
}

function loadChatSession() {
    const session = storageUtils.getCurrentChatSession();

    if (session && session.messages && session.messages.length > 1) {

        currentMessages = [...session.messages];

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        session.messages.forEach(msg => {
            addMessage(msg.sender, msg.content, true);
        });
    }
}

function updateSaveButtonState() {
    const saveChatBtn = document.getElementById('saveChatBtn');
    if (!saveChatBtn) return;
    
    const hasUnsavedMessages = currentMessages.length > 1 && !currentChatId;
    
    if (hasUnsavedMessages) {
        saveChatBtn.textContent = 'Save Chat';
        saveChatBtn.style.backgroundColor = '#28a745';
    } else if (currentChatId) {
        saveChatBtn.textContent = 'Update Chat';
        saveChatBtn.style.backgroundColor = '#2c5aa0';
    } else {
        saveChatBtn.textContent = 'Save Chat';
        saveChatBtn.style.backgroundColor = '#6c757d';
    }
}

function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function getWelcomeMessage(user) {
    const timeOfDay = getTimeOfDay();
    const personalizedGreeting = user ? `Good ${timeOfDay}, ${user.fullName}!` : `Good ${timeOfDay}!`;
    
    return `${personalizedGreeting} I'm your AI healthcare assistant. I'm here to help you understand symptoms and provide general health information.\n\n` +
           `I can assist with:\n` +
           `• Symptom analysis and general advice\n` +
           `• Information about common health conditions\n` +
           `• When to seek medical attention\n` +
           `• General wellness tips\n\n` +
           `Please describe your symptoms or health concerns, and I'll do my best to provide helpful information.\n\n` +
           `⚠️ Remember: This is for informational purposes only and should not replace professional medical advice.`;
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}


setInterval(() => {
    if (currentMessages.length > 1) {
        storageUtils.saveCurrentChatSession(currentMessages);
    }
}, 30000); 


window.chatUtils = {
    addMessage,
    handleUserMessage,
    startNewChat,
    saveCurrentChat,
    getCurrentMessages: () => currentMessages
};