class Analytics {
    constructor(containerId, ipcRenderer) {
        this.container = document.getElementById(containerId);
        this.ipcRenderer = ipcRenderer;
        this.charts = {
            weeklyTrend: null,
            habitComparison: null
        };
        this.init();
    }

    async init() {
        this.container.innerHTML = `
            <div class="analytics-container">
                <h2>ANALYTICS DASHBOARD</h2>
                <div class="stats-container">
                    <div class="card">
                        <div class="glow"></div>
                        <div class="stat-icon">📊</div>
                        <h3>Total Habits</h3>
                        <p id="total-habits">0</p>
                    </div>
                    <div class="card">
                        <div class="glow"></div>
                        <div class="stat-icon">✅</div>
                        <h3>${this.getCurrentMonthName()}</h3>
                        <p id="completion-rate">0</p>
                    </div>
                    <div class="card">
                        <div class="glow"></div>
                        <div class="stat-icon">🔥</div>
                        <h3>Best Streak</h3>
                        <p id="best-streak">0</p>
                    </div>
                    <div class="card">
                        <div class="glow"></div>
                        <div class="stat-icon">📅</div>
                        <h3>Consistency</h3>
                        <p id="consistency">0%</p>
                    </div>
                </div>
                <div class="chart-container"></div>
            </div>
        `;
        
        // Bind the handleMouseMove method to this instance
        this.handleMouseMove = this.handleMouseMove.bind(this);
        
        // Add event listeners for the cards
        const cards = document.querySelectorAll(".card");
        cards.forEach(card => {
            card.addEventListener("mousemove", this.handleMouseMove);
        });
        
        await this.updateStats();
        this.renderCharts();

        // Add window resize listener
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    getCurrentMonthName() {
        return new Date().toLocaleString('en-US', { month: 'long' });
    }

    async updateStats() {
        const habits = await this.ipcRenderer.invoke('get-habits');
        const stats = this.calculateDetailedStats(habits);
        
        document.getElementById('total-habits').textContent = habits.length;
        document.getElementById('completion-rate').textContent = stats.monthlyCompletions;
        document.getElementById('best-streak').textContent = stats.bestStreak;
        document.getElementById('consistency').textContent = `${stats.consistency}%`;
    }

    calculateDetailedStats(habits) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = monthEnd.getDate();

        let monthlyCompletions = 0;
        let bestStreak = 0;
        const dailyCompletions = new Map();

        habits.forEach(habit => {
            const monthDates = habit.dates.filter(date => {
                const checkDate = new Date(date);
                return checkDate >= monthStart && checkDate <= monthEnd;
            });

            monthlyCompletions += monthDates.length;
            const habitStreak = this.calculateStreak(habit.dates);
            bestStreak = Math.max(bestStreak, habitStreak);

            monthDates.forEach(date => {
                const count = dailyCompletions.get(date) || 0;
                dailyCompletions.set(date, count + 1);
            });
        });

        const daysCompleted = dailyCompletions.size;
        const consistency = Math.round((daysCompleted / daysInMonth) * 100);

        return {
            monthlyCompletions,
            bestStreak,
            consistency,
            dailyCompletions: Object.fromEntries(dailyCompletions)
        };
    }

    calculateStreak(dates) {
        if (!dates || dates.length === 0) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sortedDates = [...dates].sort((a, b) => new Date(b) - new Date(a));
        let streak = 0;
        let currentDate = today;

        for (const date of sortedDates) {
            const habitDate = new Date(date);
            habitDate.setHours(0, 0, 0, 0);

            if ((currentDate - habitDate) / (1000 * 60 * 60 * 24) > 1) {
                break;
            }

            streak++;
            currentDate = habitDate;
        }

        return streak;
    }

    async renderCharts() {
        const habits = await this.ipcRenderer.invoke('get-habits');
        const chartContainer = document.querySelector('.chart-container');
        chartContainer.innerHTML = `
            <div class="chart-group">
                <div class="weekly-trend-container">
                    <canvas id="weeklyTrendChart" class="chart"></canvas>
                </div>
                <div class="habit-comparison-container">
                    <canvas id="habitComparisonChart" class="chart"></canvas>
                </div>
            </div>
        `;

        this.renderWeeklyTrendChart(habits);
        this.renderHabitComparisonChart(habits);
    }

    renderWeeklyTrendChart(habits) {
        const ctx = document.getElementById('weeklyTrendChart').getContext('2d');
        const weeklyData = this.getWeeklyCompletionData(habits);

        this.charts.weeklyTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeklyData.labels,
                datasets: [{
                    label: 'Weekly Completions',
                    data: weeklyData.data,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Weekly Completion Trend',
                        color: '#fff'
                    },
                    legend: {
                        labels: { color: '#fff' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#fff' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#fff' }
                    }
                }
            }
        });
    }

    renderHabitComparisonChart(habits) {
        const ctx = document.getElementById('habitComparisonChart').getContext('2d');
        const habitStats = habits.map(habit => ({
            name: habit.name,
            count: habit.dates.length
        })).sort((a, b) => b.count - a.count);

        this.charts.habitComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: habitStats.map(h => h.name),
                datasets: [{
                    label: 'Total Completions',
                    data: habitStats.map(h => h.count),
                    backgroundColor: habits.map(h => h.color),
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Habit Comparison',
                        color: '#fff'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#fff' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#fff' }
                    }
                }
            }
        });
    }

    getWeeklyCompletionData(habits) {
        const weeks = 4;
        const labels = [];
        const data = new Array(weeks).fill(0);
        const now = new Date();
        
        for (let i = weeks - 1; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7));
            labels.push(`Week ${weeks - i}`);
            
            habits.forEach(habit => {
                const weekCompletions = habit.dates.filter(date => {
                    const checkDate = new Date(date);
                    return checkDate >= weekStart && 
                           checkDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                }).length;
                data[weeks - 1 - i] += weekCompletions;
            });
        }

        return { labels, data };
    }

    async refresh() {
        // Destroy existing charts before recreating them
        if (this.charts.weeklyTrend) {
            this.charts.weeklyTrend.destroy();
        }
        if (this.charts.habitComparison) {
            this.charts.habitComparison.destroy();
        }
        await this.updateStats();
        await this.renderCharts();
    }

    handleMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        const angle = (Math.atan2(mouseY, mouseX) * (180 / Math.PI) + 360) % 360;
        e.currentTarget.style.setProperty("--start", angle + 60);
    }

    handleResize() {
        if (this.charts.weeklyTrend) {
            this.charts.weeklyTrend.resize();
        }
        if (this.charts.habitComparison) {
            this.charts.habitComparison.resize();
        }
    }
}

module.exports = Analytics;
