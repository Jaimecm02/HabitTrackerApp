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
        this.addMouseMoveListeners();
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
        
        newHabitBtn.addEventListener('click', () => this.ipcRenderer.send('open-new-habit'));
        viewStatsBtn.addEventListener('click', () => this.ipcRenderer.send('open-statistics'));
    }

    addMouseMoveListeners() {
        const cards = this.container.querySelectorAll(".habit-card");
        cards.forEach(card => {
            card.addEventListener("mousemove", this.handleMouseMove.bind(this));
        });
    }

    handleMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        const angle = (Math.atan2(mouseY, mouseX) * (180 / Math.PI) + 360) % 360;
        e.currentTarget.style.setProperty("--start", angle + 60);
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
        div.style.setProperty('--habit-color', habit.color); // Set the habit color
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
}

module.exports = WelcomePage;