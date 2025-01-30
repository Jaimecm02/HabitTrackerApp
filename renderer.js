const { ipcRenderer } = require('electron');
const HabitTracker = require('./components/habitTracker');
const Analytics = require('./components/analytics');
const ColorComponent = require('./components/ColorComponent');

document.addEventListener('DOMContentLoaded', () => {
    const habitTracker = new HabitTracker('habitComponent', ipcRenderer);
    const analytics = new Analytics('analyticsComponent', ipcRenderer);
    new ColorComponent();

    // Listen for habit changes and update analytics
    ipcRenderer.on('habits-updated', () => {
        analytics.refresh();
    });

    // Handle navigation
    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget.getAttribute('href').substring(1);
            document.querySelectorAll('#content > div').forEach(div => {
                div.style.display = 'none';
            });
            document.getElementById(target).style.display = 'block';
        });
    });

    // Show default view
    document.getElementById('habitComponent').style.display = 'block';
    document.getElementById('analyticsComponent').style.display = 'none';
    document.getElementById('colorComponent').style.display = 'none';
});