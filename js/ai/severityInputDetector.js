export function detectUserSeverity(message) {

    const text = message.toLowerCase();

    if (text.includes("mild")) {
        return "MILD";
    }

    if (text.includes("moderate")) {
        return "MODERATE";
    }

    if (text.includes("severe")) {
        return "SEVERE";
    }

    return null;
}