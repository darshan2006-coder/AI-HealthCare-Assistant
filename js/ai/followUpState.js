let temperature = null;

export function setTemperature(temp) {
    temperature = temp;
}

export function getTemperature() {
    return temperature;
}

export function resetTemperature() {
    temperature = null;
}