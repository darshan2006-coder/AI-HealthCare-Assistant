import { generateAIResponse } from './ai/mainAI.js';
import { clearConversationState , setMedicalContext } from "./ai/conversationMemory.js";
import { resetTemperature } from "./ai/followUpState.js";
import { resetQuestionState } from "./ai/questionState.js";
import { resetUserSeverity } from "./ai/severityState.js";

let currentChatId = null;
let currentMessages = [];
let isTyping = false;

document.addEventListener('DOMContentLoaded', function() {
   
    if (localStorage.getItem('forceNewChat') === 'true') {
        localStorage.removeItem('forceNewChat');
        if(typeof storageUtils !== 'undefined') {
            storageUtils.clearCurrentChatSession();
        }
        clearConversationState();
        resetTemperature();
        resetQuestionState();
        resetUserSeverity();
    }
    initializeChat();
    setupEventListeners();
    loadChatSession();
});

function initializeChat() {
    // Assuming authUtils is globally available as in your original setup
    const user = typeof authUtils !== 'undefined' ? authUtils.getCurrentUser() : { fullName: "User" };
    if (!user && typeof authUtils !== 'undefined') {
        window.location.href = 'index.html';
        return;
    }
    
    currentMessages = [];
    
    addMessage('bot', getWelcomeMessage(user), true);
    
    const quickSymptom = localStorage.getItem('quickSymptom');
    if (quickSymptom) {
        localStorage.removeItem('quickSymptom');
        
        // Auto-fill the left form AND send a chat message
        const symptomsInput = document.getElementById('symptomsText');
        if(symptomsInput) {
            symptomsInput.value = quickSymptom.charAt(0).toUpperCase() + quickSymptom.slice(1).replace('_', ' ');
        }

        setTimeout(() => {
            const symptomMessage = `I'm experiencing ${quickSymptom.replace('_', ' ')}. Can you help?`;
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
    const sendBtn = document.getElementById('chatSendBtn'); // Matched to new HTML ID
    const saveChatBtn = document.getElementById('saveChatBtn');
    const symptomForm = document.getElementById('symptomForm'); // The new Left-Side Form
    const newChatHeaderBtn = document.getElementById('newChatHeaderBtn');
    
    // Connect the restored header button to your existing reset function
    if (newChatHeaderBtn) {
        newChatHeaderBtn.addEventListener('click', startNewChat);
    }
    
    const navNewChatLink = document.querySelector('.nav-menu a[href="chat.html"]');
    if (navNewChatLink) {
        navNewChatLink.addEventListener('click', function(e) {
            e.preventDefault();
            startNewChat();
        });
    }
    
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
    
    if (saveChatBtn) {
        saveChatBtn.addEventListener('click', saveCurrentChat);
    }

    // LISTENER FOR THE NEW STRICT ANALYSIS FORM
    if (symptomForm) {
        symptomForm.addEventListener('submit', handleFormSubmission);
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    const message = messageInput.value.trim();
    if (!message || isTyping) return;
    
    messageInput.value = '';
    adjustTextareaHeight(messageInput);
    
    handleUserMessage(message);
}

async function handleUserMessage(message) {
    addMessage('user', message);
    showTypingIndicator();
    
    try {
        // Uses your existing local AI engine for casual chat
        const aiResponse = await generateAIResponse(message);
        
        hideTypingIndicator();
        addMessage('bot', aiResponse);
        
        if(typeof storageUtils !== 'undefined') storageUtils.saveCurrentChatSession(currentMessages);
    } catch (error) {
        console.error("AI connection error:", error);
        hideTypingIndicator();
        addMessage('bot', "⚠️ Sorry, my AI brain is currently disconnected.");
    }
}

// NEW FUNCTION: Handles the Left-Side Medical Form using Node.js Backend
async function handleFormSubmission(e) {
    e.preventDefault();
    
    const symptomsInput = document.getElementById('symptomsText');
    const durationInput = document.getElementById('duration');
    const severityInput = document.getElementById('severity');
    const temperatureInput = document.getElementById('temperature');

    const symptomsArray = symptomsInput.value.split(',').map(s => s.trim());
    
    // Log the action in the chat window using your existing system
    const logMsg = `Please run a deep analysis on these symptoms: **${symptomsInput.value}**\nDuration: ${durationInput.value}\nSeverity: ${severityInput.value}\nTemperature: ${temperatureInput.value}`;
    addMessage('user', logMsg);
    
    showTypingIndicator();

    try {
        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                symptoms: symptomsArray, 
                duration: durationInput.value, 
                severity: severityInput.value, 
                temperature: temperatureInput.value 
            })
        });

        if (!response.ok) throw new Error("Server error");
        
        const data = await response.json();
        hideTypingIndicator();

       
        if (typeof setMedicalContext === 'function') {
            setMedicalContext({
                symptoms: symptomsInput.value,
                duration: durationInput.value,
                severity: severityInput.value,
                temperature: temperatureInput.value,
                conditions: data.conditions,
                advice: data.advice
            });
        }
     

        // Format the JSON data into a string that your formatMessageContent can style beautifully
        let botReply = `**🤖 Strict Medical Assessment:**\n\n`;
        botReply += `**Potential Conditions (Top 3):**\n`;
        data.conditions.forEach(c => botReply += `• ${c}\n`);
        botReply += `\n**Care & Recommendations:**\n`;
        data.advice.forEach(a => botReply += `• ${a}\n`);

        addMessage('bot', botReply);
        if(typeof storageUtils !== 'undefined') storageUtils.saveCurrentChatSession(currentMessages);

    } catch (error) {
        console.error("Backend Error:", error);
        hideTypingIndicator();
        addMessage('bot', "⚠️ **Error:** Failed to reach the analysis server. Is your Node.js backend running on port 3000?");
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
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\n/g, '<br>');
    content = content.replace(/•\s/g, '<span style="color: #2c5aa0; font-weight: bold;">•</span> ');
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
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    const style = document.createElement('style');
    style.textContent = `
        .typing-dots { display: flex; gap: 4px; padding: 10px; }
        .typing-dots span { width: 8px; height: 8px; border-radius: 50%; background-color: #2c5aa0; animation: typing 1.4s infinite ease-in-out; }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
    `;
    
    if (!document.getElementById('typingAnimationStyle')) {
        style.id = 'typingAnimationStyle';
        document.head.appendChild(style);
    }
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.remove();
    isTyping = false;
}

function startNewChat() {
    if (currentMessages.length > 1) { 
        if (!confirm('Are you sure you want to start a new chat? Unsaved messages will be lost.')) return;
    }

    clearConversationState();
    resetTemperature();
    resetQuestionState();
    resetUserSeverity();
    
    currentChatId = null;
    currentMessages = [];
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    const user = typeof authUtils !== 'undefined' ? authUtils.getCurrentUser() : null;
    addMessage('bot', getWelcomeMessage(user), true);
    
    if(typeof storageUtils !== 'undefined') storageUtils.clearCurrentChatSession();
    updateSaveButtonState();
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.focus();
}

function saveCurrentChat() {
    if (currentMessages.length <= 1) {
        if(typeof authUtils !== 'undefined') authUtils.showMessage('No messages to save', 'error');
        return;
    }
    
    const chatData = { id: currentChatId, messages: currentMessages, timestamp: new Date().toISOString() };
    const savedChatId = typeof storageUtils !== 'undefined' ? storageUtils.saveChat(chatData) : null;
    
    if (savedChatId) {
        currentChatId = savedChatId;
        if(typeof authUtils !== 'undefined') authUtils.showMessage('Chat saved successfully!', 'success');
        updateSaveButtonState();
    } else {
        if(typeof authUtils !== 'undefined') authUtils.showMessage('Failed to save chat', 'error');
    }
}

function loadExistingChat(chatId) {
    if(typeof storageUtils === 'undefined') return;
    const chat = storageUtils.getChatById(chatId);
    if (!chat) return;
    
    currentChatId = chatId;
    currentMessages = [...chat.messages];
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    chat.messages.forEach(msg => addMessage(msg.sender, msg.content, true));
    updateSaveButtonState();
}

function loadChatSession() {
    if(typeof storageUtils === 'undefined') return;
    const session = storageUtils.getCurrentChatSession();

    if (session && session.messages && session.messages.length > 1) {
        currentMessages = [...session.messages];
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        session.messages.forEach(msg => addMessage(msg.sender, msg.content, true));
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
    const personalizedGreeting = user && user.fullName ? `Good ${timeOfDay}, ${user.fullName}!` : `Good ${timeOfDay}!`;
    
    return `${personalizedGreeting} I'm your AI healthcare assistant. Use the **form on the left** for a strict medical analysis, or type a general question below.\n\n` +
           `⚠️ Remember: This is for informational purposes only and should not replace professional medical advice.`;
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

setInterval(() => {
    if (currentMessages.length > 1 && typeof storageUtils !== 'undefined') {
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



/*-- 📄 PROFESSIONAL MEDICAL REPORT ENGINE --*/

const downloadPdfBtn = document.getElementById("downloadPdfBtn");

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      
        const currentSymptoms = (JSON.parse(localStorage.getItem('conversationState'))?.symptoms?.join(', ')) || 
                                document.getElementById("symptomsText")?.value || 
                                'Not provided';
                                
        const currentDuration = JSON.parse(localStorage.getItem('conversationState'))?.duration || 
                                document.getElementById("duration")?.value || 
                                'Not provided';
                                
        const currentTemp = localStorage.getItem('aiTemperature') || 
                            document.getElementById("temperature")?.value || 
                            'Not provided';
                            
        const currentSeverity = localStorage.getItem('aiUserSeverity') || 
                                document.getElementById("severity")?.value || 
                                'Not provided';

      
        const chatContainer = document.getElementById("chatMessages");
        const messages = Array.from(chatContainer.querySelectorAll('.message'));

       
        const printWorker = document.createElement("div");
        printWorker.style.padding = "35px";
        printWorker.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
        printWorker.style.color = "#333333";
        printWorker.style.backgroundColor = "#ffffff";

      
        let reportHtml = `
            <div style="border-bottom: 3px solid #28a745; padding-bottom: 12px; margin-bottom: 25px;">
                <h1 style="margin: 0; color: #28a745; font-size: 24px; letter-spacing: 0.5px;">HEALTHBOT AI TRIAGE REPORT</h1>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px; font-weight: bold;">Generated on: ${new Date().toLocaleString()}</p>
            </div>

            <h3 style="color: #111; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">🩺 Initial Intake Summary</h3>
            <div style="background-color: #fdfdfd; border: 1px solid #eaeaea; border-radius: 6px; padding: 15px; margin-bottom: 30px; font-size: 14px;">
                
                <div style="padding: 6px 0; border-bottom: 1px solid #f5f5f5;">
                    <span style="display: inline-block; width: 180px; font-weight: bold; color: #555;">Reported Symptoms:</span>
                    <span style="display: inline-block; color: #111;">${currentSymptoms}</span>
                </div>
                
                <div style="padding: 6px 0; border-bottom: 1px solid #f5f5f5;">
                    <span style="display: inline-block; width: 180px; font-weight: bold; color: #555;">Stated Duration:</span>
                    <span style="display: inline-block; color: #111;">${currentDuration}</span>
                </div>
                
                <div style="padding: 6px 0; border-bottom: 1px solid #f5f5f5;">
                    <span style="display: inline-block; width: 180px; font-weight: bold; color: #555;">Recorded Temperature:</span>
                    <span style="display: inline-block; color: #d9534f; font-weight: bold;">${currentTemp}</span>
                </div>
                
                <div style="padding: 6px 0;">
                    <span style="display: inline-block; width: 180px; font-weight: bold; color: #555;">Triage Severity Level:</span>
                    <span style="display: inline-block; font-weight: bold; color: #721c24; background-color: #f8d7da; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">${currentSeverity}</span>
                </div>

            </div>

            <h3 style="color: #111; margin-bottom: 15px; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">💬 Consultation Transcript</h3>
            <div style="font-size: 13px; line-height: 1.6;">
        `;

        
        messages.forEach(msg => {
            const isBot = msg.classList.contains('bot-message') || msg.innerText.includes('🤖');
            const sender = isBot ? "AI HealthBot" : "Patient";
            const senderColor = isBot ? "#0056b3" : "#28a745";
            
           
            let textContent = msg.querySelector('p') ? msg.querySelector('p').innerText : msg.innerText;
            textContent = textContent.replace(/🤖 HealthBot:|👤 Patient:|👤/g, '').trim();

         
            reportHtml += `
                <div class="message-block-print" style="margin-bottom: 12px; padding: 12px; background-color: ${isBot ? '#f9f9f9' : '#ffffff'}; border-left: 4px solid ${senderColor}; border-radius: 4px;">
                    <strong style="color: ${senderColor}; font-size: 12px; display: block; margin-bottom: 2px;">${sender.toUpperCase()}</strong>
                    <div style="color: #222; white-space: pre-line;">${textContent}</div>
                </div>
            `;
        });

     
        reportHtml += `
            </div>
            <div style="margin-top: 50px; padding-top: 15px; border-top: 1px dashed #bbb; text-align: center; font-size: 11px; color: #777; line-height: 1.4;">
                <p><strong>Regulatory Disclaimer:</strong> This automated screening brief summary document is programmatically assembled using user-reported parameters via an AI triage system interface. It does not constitute formal clinical data, diagnostic authority, or an official medical diagnosis. Please deliver this sheet directly to emergency response staff or a certified medical professional.</p>
            </div>
        `;

        printWorker.innerHTML = reportHtml;

      
        const opt = {
            margin:       [0.5, 0.5, 0.5, 0.5],
            filename:     `HealthBot_Medical_Report_${Date.now()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, logging: false, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak:    { mode: 'css', avoid: '.message-block-print' } // 🌟 FIXED: Allows conversation onto page 1 without chopping individual boxes!
        };

     
        html2pdf().set(opt).from(printWorker).save().then(() => {
            console.log("Pristine structured clinical report saved successfully.");
        });
    });
}