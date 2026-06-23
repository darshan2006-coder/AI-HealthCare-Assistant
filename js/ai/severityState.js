// Load initial severity from localStorage, or default to null
let userSeverity = localStorage.getItem('aiUserSeverity') || null;

export function setUserSeverity(severity) {
    userSeverity = severity;
    if (severity !== null) {
        localStorage.setItem('aiUserSeverity', severity);
    }
}

export function getUserSeverity() {
    return userSeverity;
}

export function resetUserSeverity() {
    userSeverity = null;
    localStorage.removeItem('aiUserSeverity');
}