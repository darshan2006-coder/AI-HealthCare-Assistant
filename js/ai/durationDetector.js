export function detectDuration(message) {

    const text = message.toLowerCase();

    if (
        text.includes("day") ||
        text.includes("days")
    ) {
        return message;
    }

    if (
        text.includes("week") ||
        text.includes("weeks")
    ) {
        return message;
    }

    if (
        text.includes("month") ||
        text.includes("months")
    ) {
        return message;
    }

    return null;
}