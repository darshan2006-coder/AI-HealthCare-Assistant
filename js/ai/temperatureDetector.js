export function detectTemperature(message) {

    const match =
        message.match(/(\d+)\s*(f|°f|fahrenheit)/i);

    if (!match) {
        return null;
    }

    const temp = parseInt(match[1]);

    if (temp >= 95 && temp <= 108) {
        return temp;
    }

    return "INVALID";
}