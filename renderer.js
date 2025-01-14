const { ipcRenderer } = require('electron');

async function updateColor() {
    const color = await ipcRenderer.invoke('get-daily-color');
    document.getElementById('colorBox').style.backgroundColor = color;
    document.getElementById('colorValue').textContent = color;
}

document.addEventListener('DOMContentLoaded', updateColor);
