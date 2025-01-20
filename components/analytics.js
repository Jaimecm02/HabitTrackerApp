class Analytics {
    constructor(containerId, ipcRenderer) {
        this.container = document.getElementById(containerId);
        this.ipcRenderer = ipcRenderer;
        this.init();
    }

    async init() {
        this.container.innerHTML = `
            <div class="analytics-container">
                <h2>Habits Analytics</h2>
                <div class="analytics-content">
                    <div class="stats-container">
                        <div id="total-habits"></div>
                        <div id="completion-rate"></div>
                    </div>
                </div>
            </div>
        `;
        await this.updateStats();
    }

    async updateStats() {
        const habits = await this.ipcRenderer.invoke('get-habits');
        const totalHabits = habits.length;
        
        // Calculate completion rate for the current month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let totalCompletions = 0;
        habits.forEach(habit => {
            totalCompletions += habit.dates.filter(date => {
                const checkDate = new Date(date);
                return checkDate.getMonth() === currentMonth && 
                       checkDate.getFullYear() === currentYear;
            }).length;
        });

        document.getElementById('total-habits').innerHTML = `
            <h3>Total Habits</h3>
            <p>${totalHabits}</p>
        `;

        document.getElementById('completion-rate').innerHTML = `
            <h3>Completions This Month</h3>
            <p>${totalCompletions}</p>
        `;
    }
}

module.exports = Analytics;
