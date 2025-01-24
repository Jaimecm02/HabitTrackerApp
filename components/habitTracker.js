class HabitTracker {
    constructor(containerId, ipcRenderer) {
        console.log('HabitTracker constructor called');
        console.log('Received ipcRenderer:', ipcRenderer); // Debug line
        
        this.container = document.getElementById(containerId);
        this.ipcRenderer = ipcRenderer;
        this.habits = [];
        this.init();
    }

    async init() {
        console.log('Initializing HabitTracker');
        this.container.innerHTML = `
            <div class="habit-tracker">
                <h2>HABIT TRACKER</h2>
                <div class="habit-form">
                    <input type="text" id="habitName" placeholder="Habit name">
                    <input type="color" id="habitColor" value="#3498db">
                    <button id="addHabit">Add Habit</button>
                </div>
                <div class="habits-list"></div>
            </div>
        `;

        await this.bindEvents();
        await this.loadHabits();
        console.log('HabitTracker initialization complete');
    }

    bindEvents() {
        console.log('Binding events');
        const addButton = this.container.querySelector('#addHabit');
        if (!addButton) {
            console.error('Add button not found');
            return;
        }
        
        addButton.addEventListener('click', () => {
            console.log('Add button clicked');
            this.addHabit();
        });
    }

    async loadHabits() {
        try {
            const habits = await this.ipcRenderer.invoke('get-habits');
            this.habits = habits || [];
            this.renderHabits();
        } catch (error) {
            console.error('Error loading habits:', error);
        }
    }

    async addHabit() {
        console.log('addHabit called');
        console.log('this.ipcRenderer:', this.ipcRenderer); // Debug line
        
        const nameInput = this.container.querySelector('#habitName');
        const colorInput = this.container.querySelector('#habitColor');
        
        if (!nameInput.value.trim()) {
            return;
        }
        
        const habit = {
            id: Date.now(),
            name: nameInput.value.trim(),
            color: colorInput.value,
            dates: []
        };

        try {
            console.log('Attempting to invoke add-habit'); // Debug line
            const addedHabit = await this.ipcRenderer.invoke('add-habit', habit);
            console.log('Response from add-habit:', addedHabit); // Debug line
            
            if (addedHabit) {
                this.habits = [...this.habits, addedHabit];
                this.renderHabits();
                nameInput.value = '';
            }
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    }

    renderHabits() {
        const habitsList = this.container.querySelector('.habits-list');
        if (!habitsList) return;
        
        habitsList.innerHTML = '';
        console.log('Rendering habits:', this.habits); // Debug line

        this.habits.forEach(habit => {
            const habitElement = this.createHabitElement(habit);
            habitsList.appendChild(habitElement);
        });
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

            // Break streak if we miss a day
            if ((currentDate - habitDate) / (1000 * 60 * 60 * 24) > 1) {
                break;
            }

            streak++;
            currentDate = habitDate;
        }

        return streak;
    }

    getStreakLevel(streak) {
        if (streak >= 365) return 'streak-diamond';
        if (streak >= 180) return 'streak-platinum';
        if (streak >= 90) return 'streak-gold';
        if (streak >= 30) return 'streak-silver';
        if (streak >= 7) return 'streak-bronze';
        return '';
    }

    createHabitElement(habit) {
        const habitDiv = document.createElement('div');
        habitDiv.className = 'habit-item';
        
        const yearGrid = this.createYearGrid(habit);
        const currentStreak = this.calculateStreak(habit.dates);
        const streakLevel = this.getStreakLevel(currentStreak);
        
        habitDiv.innerHTML = `
            <div class="habit-header">
                <div class="habit-left">
                    <span class="habit-color" style="background-color: ${habit.color}"></span>
                    <h3 class="habit-title">${habit.name}</h3>
                    <span class="streak-count ${streakLevel}">${currentStreak} day${currentStreak !== 1 ? 's' : ''}</span>
                </div>
                <div class="habit-buttons">
                    <button class="complete-today-btn">Complete Today</button>
                    <div class="dropdown">
                        <button class="menu-btn">⋮</button>
                        <div class="dropdown-content">
                            <button class="change-color-btn">Change Color</button>
                            <button class="delete-habit-btn">Delete Habit</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click handler for complete today button
        const completeButton = habitDiv.querySelector('.complete-today-btn');
        completeButton.addEventListener('click', async () => {
            const today = new Date().toISOString().split('T')[0];
            const result = await this.ipcRenderer.invoke('toggle-habit-date', {
                habitId: habit.id,
                date: today
            });
            
            if (result) {
                const habitIndex = this.habits.findIndex(h => h.id === habit.id);
                if (habitIndex !== -1) {
                    this.habits[habitIndex] = result;
                    this.renderHabits();
                }
            }
        });

        // Add click handlers for dropdown menu
        const deleteButton = habitDiv.querySelector('.delete-habit-btn');
        deleteButton.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                const success = await this.ipcRenderer.invoke('delete-habit', habit.id);
                if (success) {
                    this.habits = this.habits.filter(h => h.id !== habit.id);
                    this.renderHabits();
                }
            }
        });

        // Add color change handler
        const changeColorBtn = habitDiv.querySelector('.change-color-btn');
        changeColorBtn.addEventListener('click', () => {
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = habit.color;
            colorInput.style.display = 'none';
            document.body.appendChild(colorInput);

            colorInput.addEventListener('change', async () => {
                const newColor = colorInput.value;
                const updatedHabit = { ...habit, color: newColor };
                const result = await this.ipcRenderer.invoke('update-habit', updatedHabit);
                if (result) {
                    const habitIndex = this.habits.findIndex(h => h.id === habit.id);
                    if (habitIndex !== -1) {
                        this.habits[habitIndex] = result;
                        this.renderHabits();
                    }
                }
                document.body.removeChild(colorInput);
            });

            colorInput.click();
        });

        habitDiv.appendChild(yearGrid);
        return habitDiv;
    }

    createYearGrid(habit) {
        const grid = document.createElement('div');
        grid.className = 'year-grid';
        
        const today = new Date().toISOString().split('T')[0];
        const year = new Date().getFullYear();
        const startDate = new Date(year, 0, 1);
        
        // Calculate leap year
        const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        const totalDays = isLeapYear ? 366 : 365;
        
        // Get the number of empty cells for the start of the grid
        const weekStart = 1; // Monday
        const firstDayOfWeek = (startDate.getDay() + 6) % 7; // Adjust to start from Monday
        const emptyCells = (7 + firstDayOfWeek - weekStart) % 7;
        
        // Calculate the number of columns (weeks)
        const totalCells = totalDays + emptyCells;
        const columns = Math.ceil(totalCells / 7);
        grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        
        // Create empty cells
        for (let i = 0; i < emptyCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell empty-cell';
            grid.appendChild(cell);
        }
        
        // Create day cells
        for (let i = 0; i < totalDays; i++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell';

            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dateStr = currentDate.toISOString().split('T')[0];
            const [yyyy, mm, dd] = dateStr.split('-');
            const formattedDate = `${dd}-${mm}-${yyyy}`;
            cell.setAttribute('data-date', formattedDate);
            
            if (habit.dates.includes(dateStr)) {
                cell.style.backgroundColor = habit.color;
            }
            
            // Only allow clicking if it's today's date
            if (dateStr === today) {
                cell.classList.add('today');
                cell.addEventListener('click', async () => {
                    const result = await this.ipcRenderer.invoke('toggle-habit-date', {
                        habitId: habit.id,
                        date: dateStr
                    });
                    
                    if (result) {
                        const habitIndex = this.habits.findIndex(h => h.id === habit.id);
                        if (habitIndex !== -1) {
                            this.habits[habitIndex] = result;
                            cell.style.backgroundColor = result.dates.includes(dateStr) ? habit.color : '';
                        }
                    }
                });
            }
            
            grid.appendChild(cell);
        }
        
        return grid;
    }
}

module.exports = HabitTracker;
