const { ipcRenderer } = require('electron');
const HabitTracker = require('./src/components/Habits/habitTracker');
const Analytics = require('./src/components/Analytics/analytics');
const ColorComponent = require('./src/components/Colors/ColorComponent');
const WelcomePage = require('./src/components/WelcomePage/welcomePage');

document.addEventListener('DOMContentLoaded', () => {
    // Load the SVG icons
    fetch('assets/icons.svg')
        .then(response => response.text())
        .then(data => {
            const div = document.createElement('div');
            div.style.display = 'none';
            div.innerHTML = data;
            document.body.insertBefore(div, document.body.firstChild);
        });

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
            document.querySelectorAll('#sidebar a').forEach(a => a.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Show default view
    document.getElementById('welcomeComponent').style.display = 'none';
    document.getElementById('habitComponent').style.display = 'none';
    document.getElementById('analyticsComponent').style.display = 'none';
    document.getElementById('colorComponent').style.display = 'block';

    document.querySelector('#sidebar a[href="#welcomeComponent"]').classList.add('active');
});