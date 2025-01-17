const { ipcRenderer } = require('electron');
const HabitTracker = require('./widgets/habitTracker');

document.addEventListener('DOMContentLoaded', () => {
    habitTracker = new HabitTracker('habitWidget', ipcRenderer);
});