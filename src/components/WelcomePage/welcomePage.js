class WelcomePage {
    constructor(containerId, ipcRenderer) {
        this.container = document.getElementById(containerId);
        this.ipcRenderer = ipcRenderer;
        this.init();
    }

    async init() {
        this.container.innerHTML = `
            <div class="welcome-container">
                <header class="welcome-header">
                    <h1>${this.getGreeting()}</h1>
                    <p class="current-date" id="currentDate"></p>
                </header>
                <div class="welcome-content">
                    <div class="info-card">
                        <h2>Today's Progress</h2>
                        <p>Pending habits: <span id="pendingHabits">0</span></p>
                        <p>Completed habits: <span id="completedHabits">0</span></p>
                    </div>
                    <div class="info-card">
                        <h2>Quick Actions</h2>
                        <button id="newHabitBtn">Create New Habit</button>
                        <button id="viewStatsBtn">View Statistics</button>
                    </div>
                </div>
                <div class="habits-grid" id="habitsGrid"></div>
            </div>
        `;
        this.updateDate();
        await this.loadTodayHabits();
        this.attachEventListeners();
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "GOOD MORNING";
        if (hour < 18) return "GOOD AFTERNOON";
        return "GOOD EVENING";
    }

    attachEventListeners() {
        const newHabitBtn = this.container.querySelector('#newHabitBtn');
        const viewStatsBtn = this.container.querySelector('#viewStatsBtn');
        
        // Navigate to the habits component when "Create New Habit" is clicked
        newHabitBtn.addEventListener('click', () => {
            // Hide all content sections
            const contentSections = document.querySelectorAll('#content > div');
            contentSections.forEach(div => {
                div.style.display = 'none';
            });
    
            // Show the habit component
            document.getElementById('habitComponent').style.display = 'block';
    
            // Update the active link in the sidebar
            const sidebarLinks = document.querySelectorAll('#sidebar a');
            sidebarLinks.forEach(a => a.classList.remove('active'));
            document.querySelector('#sidebar a[href="#habitComponent"]').classList.add('active');
        });
    
        // Navigate to the analytics component when "View Statistics" is clicked
        viewStatsBtn.addEventListener('click', () => {
            // Hide all content sections
            const contentSections = document.querySelectorAll('#content > div');
            contentSections.forEach(div => {
                div.style.display = 'none';
            });
    
            // Show the analytics component
            document.getElementById('analyticsComponent').style.display = 'block';
    
            // Update the active link in the sidebar
            const sidebarLinks = document.querySelectorAll('#sidebar a');
            sidebarLinks.forEach(a => a.classList.remove('active'));
            document.querySelector('#sidebar a[href="#analyticsComponent"]').classList.add('active');
        });
    }

    updateDate() {
        const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        this.container.querySelector('#currentDate').textContent = currentDate;
    }

    async loadTodayHabits() {
        try {
            const habits = await this.ipcRenderer.invoke('get-habits');
            const today = new Date().toISOString().split('T')[0];
            
            let completed = 0;
            const habitsGrid = this.container.querySelector('#habitsGrid');
            habitsGrid.innerHTML = '';

            habits.forEach(habit => {
                const isCompleted = habit.dates.includes(today);
                if (isCompleted) completed++;

                const habitCard = this.createHabitCard(habit, isCompleted);
                habitsGrid.appendChild(habitCard);
            });

            // Update summary
            this.container.querySelector('#completedHabits').textContent = completed;
            this.container.querySelector('#pendingHabits').textContent = habits.length - completed;
        } catch (error) {
            console.error('Error loading habits:', error);
        }
    }

    createHabitCard(habit, isCompleted) {
        const div = document.createElement('div');
        div.className = 'habit-card';
        div.style.setProperty('--glow-color-1', `${habit.color}`);
        div.style.setProperty('--glow-color-2', `${this.lightenColor(habit.color, 20)}`);
        div.style.setProperty('--glow-color-3', `${this.darkenColor(habit.color, 20)}`);
        div.innerHTML = `
            <div class="glow"></div>
            <div class="habit-status ${isCompleted ? 'completed' : 'pending'}" style="background-color: ${isCompleted ? habit.color : '#ccc'}"></div>
            <div class="habit-details">
                <h3>${habit.name}</h3>
                <p>${isCompleted ? 'Completed today' : 'Not completed yet'}</p>
            </div>
        `;
        return div;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return `#${(0x1000000 + (R < 255 ? R : 255) * 0x10000 + (G < 255 ? G : 255) * 0x100 + (B < 255 ? B : 255)).toString(16).slice(1)}`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return `#${(0x1000000 + (R > 0 ? R : 0) * 0x10000 + (G > 0 ? G : 0) * 0x100 + (B > 0 ? B : 0)).toString(16).slice(1)}`;
    }
}

module.exports = WelcomePage;