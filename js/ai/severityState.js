let userSeverity = null;

export function setUserSeverity(severity) {
    userSeverity = severity;
}

export function getUserSeverity() {
    return userSeverity;
}

export function resetUserSeverity() {
    userSeverity = null;
}