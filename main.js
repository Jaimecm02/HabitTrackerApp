const { app, BrowserWindow, ipcMain, net } = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('get-weather', async () => {
    try {
        const lat = 40.7128; // Example: New York
        const lon = -74.0060;
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;
        
        return new Promise((resolve, reject) => {
            const request = net.request(url);
            let data = '';
            
            request.on('response', (response) => {
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    try {
                        const weatherData = JSON.parse(data);
                        resolve(weatherData.current_weather);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            
            request.on('error', (error) => {
                reject(error);
            });
            
            request.end();
        });
    } catch (error) {
        console.error('Weather API Error:', error);
        return null;
    }
});