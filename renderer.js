const { ipcRenderer } = require('electron');
const HabitTracker = require('./src/components/Habits/habitTracker');
const Analytics = require('./src/components/Analytics/analytics');
const ColorComponent = require('./src/components/Colors/ColorComponent');
const WelcomePage = require('./src/components/WelcomePage/welcomePage');

document.addEventListener('DOMContentLoaded', () => {
    // Load SVG icons
    const cachedIcons = localStorage.getItem('cachedIcons');
    if (cachedIcons) {
        const div = document.createElement('div');
        div.style.display = 'none';
        div.innerHTML = cachedIcons;
        document.body.insertBefore(div, document.body.firstChild);
    } else {
        fetch('assets/icons.svg')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load SVG icons');
                return response.text();
            })
            .then(data => {
                localStorage.setItem('cachedIcons', data);
                const div = document.createElement('div');
                div.style.display = 'none';
                div.innerHTML = data;
                document.body.insertBefore(div, document.body.firstChild);
            })
            .catch(error => {
                console.error('Error loading SVG icons:', error);
            });
    }

    const components = {
        habitComponent: null,
        analyticsComponent: null,
        colorComponent: null,
        welcomeComponent: null,
    };

    const sidebarLinks = document.querySelectorAll('#sidebar a');
    const contentSections = document.querySelectorAll('#content > div');

    // Initialize the welcomeComponent by default
    components.welcomeComponent = new WelcomePage('welcomeComponent', ipcRenderer);

    // Handle navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget.getAttribute('href').substring(1);

            // Hide all content sections
            contentSections.forEach(div => {
                div.style.display = 'none';
            });

            // Initialize the component if it hasn't been loaded yet
            if (!components[target]) {
                switch (target) {
                    case 'habitComponent':
                        components[target] = new HabitTracker(target, ipcRenderer);
                        break;
                    case 'analyticsComponent':
                        components[target] = new Analytics(target, ipcRenderer);
                        break;
                    case 'colorComponent':
                        components[target] = new ColorComponent();
                        break;
                    case 'welcomeComponent':
                        components[target] = new WelcomePage(target, ipcRenderer);
                        break;
                }
            }

            // Show the target section
            document.getElementById(target).style.display = 'block';

            // Update active link
            sidebarLinks.forEach(a => a.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Show welcomeComponent by default
    document.getElementById('welcomeComponent').style.display = 'block';
    document.querySelector('#sidebar a[href="#welcomeComponent"]').classList.add('active');

    // Debounce habits-updated event
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const handleHabitsUpdated = debounce(() => {
        if (components.analyticsComponent) components.analyticsComponent.refresh();
        if (components.welcomeComponent) components.welcomeComponent.loadTodayHabits();
    }, 200);

    ipcRenderer.on('habits-updated', handleHabitsUpdated);
});