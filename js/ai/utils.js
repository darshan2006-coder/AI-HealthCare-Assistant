export function cleanText(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/gi, "");
}

export function containsKeyword(message, keywords) {
    return keywords.some(keyword =>
        message.includes(keyword)
    );
}

export function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}