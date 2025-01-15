const { ipcRenderer } = require('electron');

class WeatherWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
        this.update();
    }

    render() {
        this.container.innerHTML = `
            <div class="widget-card">
                <h2>Weather Info</h2>
                <div id="weatherInfo">
                    <span class="weather-temp"></span>
                    <span class="weather-wind"></span>
                </div>
            </div>
        `;
    }

    async update() {
        const weather = await ipcRenderer.invoke('get-weather');
        if (weather) {
            const tempSpan = this.container.querySelector('.weather-temp');
            const windSpan = this.container.querySelector('.weather-wind');
            
            tempSpan.textContent = `🌡️ ${weather.temperature}°C`;
            windSpan.textContent = `💨 ${weather.windspeed} km/h`;
        }
    }
}

module.exports = WeatherWidget;
