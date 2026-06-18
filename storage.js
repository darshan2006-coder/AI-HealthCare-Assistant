function saveChat(chatData) {
    const user = authUtils.getCurrentUser();
    if (!user) return false;
    
    const userChats = getUserChats(user.email);
    
 
    const chat = {
        id: chatData.id || generateChatId(),
        title: chatData.title || generateChatTitle(chatData.messages),
        preview: chatData.preview || generateChatPreview(chatData.messages),
        messages: chatData.messages || [],
        timestamp: chatData.timestamp || new Date().toISOString(),
        userId: user.id
    };
    
    
    const existingIndex = userChats.findIndex(c => c.id === chat.id);
    if (existingIndex !== -1) {
        userChats[existingIndex] = chat;
    } else {
        userChats.unshift(chat); 
    }
    
    
    if (userChats.length > 50) {
        userChats.splice(50);
    }
    
    localStorage.setItem(`chats_${user.email}`, JSON.stringify(userChats));
    return chat.id;
}

function getUserChats(userEmail) {
    return JSON.parse(localStorage.getItem(`chats_${userEmail}`)) || [];
}

function getChatById(chatId) {
    const user = authUtils.getCurrentUser();
    if (!user) return null;
    
    const userChats = getUserChats(user.email);
    return userChats.find(chat => chat.id === chatId);
}

function deleteChat(chatId) {
    const user = authUtils.getCurrentUser();
    if (!user) return false;
    
    let userChats = getUserChats(user.email);
    userChats = userChats.filter(chat => chat.id !== chatId);
    
    localStorage.setItem(`chats_${user.email}`, JSON.stringify(userChats));
    return true;
}

function clearAllChats() {
    const user = authUtils.getCurrentUser();
    if (!user) return false;
    
    localStorage.removeItem(`chats_${user.email}`);
    return true;
}


function generateChatId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateChatTitle(messages) {
    if (!messages || messages.length === 0) {
        return 'New Chat';
    }
    
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
        const title = firstUserMessage.content.substring(0, 50);
        return title.length < firstUserMessage.content.length ? title + '...' : title;
    }
    
    return 'New Chat';
}

function generateChatPreview(messages) {
    if (!messages || messages.length === 0) {
        return 'No messages yet';
    }
    
    const lastMessage = messages[messages.length - 1];
    const preview = lastMessage.content.substring(0, 100);
    return preview.length < lastMessage.content.length ? preview + '...' : preview;
}


function saveUserPreference(key, value) {
    const user = authUtils.getCurrentUser();
    if (!user) return false;
    
    const preferences = getUserPreferences(user.email);
    preferences[key] = value;
    
    localStorage.setItem(`preferences_${user.email}`, JSON.stringify(preferences));
    return true;
}

function getUserPreference(key, defaultValue = null) {
    const user = authUtils.getCurrentUser();
    if (!user) return defaultValue;
    
    const preferences = getUserPreferences(user.email);
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
}

function getUserPreferences(userEmail) {
    return JSON.parse(localStorage.getItem(`preferences_${userEmail}`)) || {};
}


function saveCurrentChatSession(messages) {
    const user = authUtils.getCurrentUser();
    if (!user) return false;
    
    localStorage.setItem(`current_session_${user.email}`, JSON.stringify({
        messages,
        timestamp: new Date().toISOString()
    }));
    return true;
}

function getCurrentChatSession() {
    const user = authUtils.getCurrentUser();
    if (!user) return null;
    
    const session = localStorage.getItem(`current_session_${user.email}`);
    return session ? JSON.parse(session) : null;
}

function clearCurrentChatSession() {
    const user = authUtils.getCurrentUser();
    if (!user) return false;
    
    localStorage.removeItem(`current_session_${user.email}`);
    return true;
}

function exportUserData() {
    const user = authUtils.getCurrentUser();
    if (!user) return null;
    
    const userData = {
        user: user,
        chats: getUserChats(user.email),
        preferences: getUserPreferences(user.email),
        exportDate: new Date().toISOString()
    };
    
    return userData;
}

function downloadUserData() {
    const userData = exportUserData();
    if (!userData) return false;
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `healthbot-data-${userData.user.email}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    return true;
}


function cleanupOldData() {
    const user = authUtils.getCurrentUser();
    if (!user) return false;
    
  
    const sessionKey = `current_session_${user.email}`;
    const session = localStorage.getItem(sessionKey);
    
    if (session) {
        const sessionData = JSON.parse(session);
        const sessionDate = new Date(sessionData.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        if (sessionDate < weekAgo) {
            localStorage.removeItem(sessionKey);
        }
    }
    
    
    const userChats = getUserChats(user.email);
    if (userChats.length > 100) {
        const recentChats = userChats.slice(0, 100);
        localStorage.setItem(`chats_${user.email}`, JSON.stringify(recentChats));
    }
    
    return true;
}


function getStorageUsage() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length;
        }
    }
    
    return {
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        itemCount: localStorage.length
    };
}

document.addEventListener('DOMContentLoaded', function() {
   
    if (Math.random() < 0.1) { 
        cleanupOldData();
    }
});


window.storageUtils = {
    saveChat,
    getUserChats,
    getChatById,
    deleteChat,
    clearAllChats,
    saveUserPreference,
    getUserPreference,
    saveCurrentChatSession,
    getCurrentChatSession,
    clearCurrentChatSession,
    exportUserData,
    downloadUserData,
    getStorageUsage,
    cleanupOldData
};