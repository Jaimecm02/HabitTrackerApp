const { ipcRenderer } = require('electron');
const ColorWidget = require('./widgets/colorWidget');
const WeatherWidget = require('./widgets/weatherWidget');
const HabitTracker = require('./widgets/habitTracker');

async function updateColor() {
    const color = await ipcRenderer.invoke('get-daily-color');
    document.getElementById('colorBox').style.backgroundColor = color;
    document.getElementById('colorValue').textContent = color;

    const weather = await ipcRenderer.invoke('get-weather');
    if (weather) {
        const tempSpan = document.querySelector('.weather-temp');
        const windSpan = document.querySelector('.weather-wind');
        
        tempSpan.textContent = `🌡️ ${weather.temperature}°C`;
        windSpan.textContent = `💨 ${weather.windspeed} km/h`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('ipcRenderer in renderer.js:', ipcRenderer); // Debug line
    new ColorWidget('colorWidget');
    new WeatherWidget('weatherWidget');
    const habitTracker = new HabitTracker('habitWidget', ipcRenderer);
});