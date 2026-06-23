// Load initial temperature from localStorage, or default to null
let temperature = localStorage.getItem('aiTemperature') || null;

export function setTemperature(temp) {
    temperature = temp;
    if (temp !== null) {
        localStorage.setItem('aiTemperature', temp);
    }
}

export function getTemperature() {
    return temperature;
}

export function resetTemperature() {
    temperature = null;
    localStorage.removeItem('aiTemperature');
}