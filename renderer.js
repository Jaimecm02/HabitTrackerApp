const { ipcRenderer } = require('electron');
const HabitTracker = require('./components/habitTracker');
const Analytics = require('./components/analytics');

document.addEventListener('DOMContentLoaded', () => {
    const habitTracker = new HabitTracker('habitComponent', ipcRenderer);
    const analytics = new Analytics('analyticsComponent', ipcRenderer);

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

    // Show default view // Changed to show habitComponent
    document.getElementById('habitComponent').style.display = 'none';
    document.getElementById('analyticsComponent').style.display = 'block';
});