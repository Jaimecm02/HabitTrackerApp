const { ipcRenderer } = require('electron');
const HabitTracker = require('./components/habitTracker');
const Analytics = require('./components/analytics');
const ColorComponent = require('./components/ColorComponent');
const WelcomePage = require('./components/welcomePage');

document.addEventListener('DOMContentLoaded', () => {
    const habitTracker = new HabitTracker('habitComponent', ipcRenderer);
    const analytics = new Analytics('analyticsComponent', ipcRenderer);
    new ColorComponent();
    const welcomePage = new WelcomePage('welcomeComponent', ipcRenderer);

    // Listen for habit changes and update analytics
    ipcRenderer.on('habits-updated', () => {
        analytics.refresh();
        welcomePage.loadTodayHabits(); // Update today's habits on welcome page
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
    document.getElementById('welcomeComponent').style.display = 'block';
    document.getElementById('habitComponent').style.display = 'none';
    document.getElementById('analyticsComponent').style.display = 'none';
    document.getElementById('colorComponent').style.display = 'none';
});