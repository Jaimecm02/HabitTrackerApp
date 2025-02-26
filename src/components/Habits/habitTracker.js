const { calculateStreak, getStreakLevel, createYearGrid, hexToRgb } = require('./habitsUtils');
const NewHabitModal = require('./Modals/newHabitModal');
const EditHabitModal = require('./Modals/editHabitModal');

class HabitTracker {
    constructor(containerId, ipcRenderer) {
        console.log('HabitTracker constructor called');
        console.log('Received ipcRenderer:', ipcRenderer); // Debug line
        
        this.container = document.getElementById(containerId);
        this.ipcRenderer = ipcRenderer;
        this.habits = [];
        this.newHabitModal = null;
        this.editHabitModal = null;
        this.init();
    }

    async init() {
        console.log('Initializing HabitTracker');
        this.container.innerHTML = `
            <div class="habit-tracker">
                <div class="habit-tracker-header">
                    <h2 class="habit-tracker-title">HABIT TRACKER</h2>
                    <button class="add-habit-btn" id="addHabitBtn">+</button>
                </div>
                <div class="year-selector">
                    <label for="yearSelect">Select Year:</label>
                    <select id="yearSelect"></select>
                </div>
                <div class="habits-list"></div>
            </div>
        `;
        
        // Initialize modals
        this.newHabitModal = new NewHabitModal(
            this.container, 
            this.handleNewHabitSave.bind(this),
            null // No special cancel handler needed
        );
        
        this.editHabitModal = new EditHabitModal(
            this.container,
            this.handleEditHabitSave.bind(this),
            this.handleHabitDelete.bind(this),
            null // No special cancel handler needed
        );
    
        await this.bindEvents();
        await this.loadHabits();
        this.populateYearSelector();
        console.log('HabitTracker initialization complete');
    }

    bindEvents() {
        console.log('Binding events');
        const addButton = this.container.querySelector('#addHabitBtn');
        if (!addButton) {
            console.error('Add button not found');
            return;
        }
        
        addButton.addEventListener('click', () => {
            console.log('Add button clicked');
            this.newHabitModal.show();
        });
    }
    
    async handleNewHabitSave(habitData) {
        console.log('handleNewHabitSave called with data:', habitData);
        
        const habit = {
            id: Date.now(),
            name: habitData.name,
            color: habitData.color,
            dates: [],
            multipleCompletions: habitData.multipleCompletions,
            repetitions: habitData.multipleCompletions ? {} : null
        };
    
        try {
            console.log('Attempting to invoke add-habit');
            const addedHabit = await this.ipcRenderer.invoke('add-habit', habit);
            console.log('Response from add-habit:', addedHabit);
            
            if (addedHabit) {
                this.habits = [...this.habits, addedHabit];
                this.renderHabits();
            }
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    }
    
    async handleEditHabitSave(updatedHabit) {
        const result = await this.ipcRenderer.invoke('update-habit', updatedHabit);
        if (result) {
            const habitIndex = this.habits.findIndex(h => h.id === updatedHabit.id);
            if (habitIndex !== -1) {
                this.habits[habitIndex] = result;
                this.renderHabits();
            }
        }
    }
    
    async handleHabitDelete(habitId) {
        const success = await this.ipcRenderer.invoke('delete-habit', habitId);
        if (success) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.renderHabits();
        }
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

    populateYearSelector() {
        const yearSelect = this.container.querySelector('#yearSelect');
        if (!yearSelect) return;
    
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 3; 
        const endYear = currentYear + 3; 
    
        for (let year = startYear; year <= endYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
    
        yearSelect.addEventListener('change', () => {
            const selectedYear = parseInt(yearSelect.value);
            this.renderHabits(selectedYear);
        });
    }

    renderHabits(year = new Date().getFullYear()) {
        const habitsList = this.container.querySelector('.habits-list');
        if (!habitsList) return;
        
        habitsList.innerHTML = '';
        console.log('Rendering habits:', this.habits); // Debug line
    
        this.habits.forEach(habit => {
            const habitElement = this.createHabitElement(habit, year);
            habitsList.appendChild(habitElement);
        });
    }

    createHabitElement(habit, year) {
        const habitDiv = document.createElement('div');
        habitDiv.className = 'habit-item';
        habitDiv.dataset.habitId = habit.id;
        habitDiv.style.borderColor = `rgba(${hexToRgb(habit.color)}, 0.1)`;
    
        const yearGrid = createYearGrid(habit, year);
        const currentStreak = calculateStreak(habit.dates);
        const streakLevel = getStreakLevel(currentStreak);
        
        habitDiv.innerHTML = `
            <div class="habit-header">
                <div class="habit-left">
                    <span class="habit-color" style="background-color: ${habit.color}"></span>
                    <h3 class="habit-title">${habit.name}</h3>
                    <span class="streak-count ${streakLevel}">${currentStreak} day${currentStreak !== 1 ? 's' : ''}</span>
                </div>
                <div class="habit-buttons">
                    ${habit.multipleCompletions ? `
                        <div class="counter">
                            <button class="counter-btn" id="decrement">-</button>
                            <span class="counter-value">0</span>
                            <button class="counter-btn" id="increment">+</button>
                        </div>
                    ` : `
                        <button class="complete-today-btn">Complete Today</button>
                    `}
                    <button class="edit-habit-btn">
                        <svg width="16" height="16"><use href="#icon-pencil"/></svg>
                    </button>
                </div>
            </div>
            <div class="grid-container">
                <!-- Year grid will be appended here -->
            </div>
        `;
        
        const gridContainer = habitDiv.querySelector('.grid-container');
        gridContainer.appendChild(yearGrid);
        
        if (habit.multipleCompletions) {
            const today = new Date().toISOString().split('T')[0];
            const counterValue = habitDiv.querySelector('.counter-value');
            const decrementButton = habitDiv.querySelector('#decrement');
            const incrementButton = habitDiv.querySelector('#increment');
    
            // Initialize the counter with the current repetitions for today
            counterValue.textContent = habit.repetitions[today] || 0;
    
            decrementButton.addEventListener('click', async () => {
                const currentValue = parseInt(counterValue.textContent);
                if (currentValue > 0) {
                    const newValue = currentValue - 1;
                    counterValue.textContent = newValue;
                    await this.ipcRenderer.invoke('update-habit-repetition', {
                        habitId: habit.id,
                        date: today,
                        repetitions: newValue
                    });
    
                    // Update the habit in the local state
                    const habitIndex = this.habits.findIndex(h => h.id === habit.id);
                    if (habitIndex !== -1) {
                        this.habits[habitIndex].repetitions[today] = newValue;
                    }
                }
            });
    
            incrementButton.addEventListener('click', async () => {
                const currentValue = parseInt(counterValue.textContent);
                const newValue = currentValue + 1;
                counterValue.textContent = newValue;
                await this.ipcRenderer.invoke('update-habit-repetition', {
                    habitId: habit.id,
                    date: today,
                    repetitions: newValue
                });
    
                // Update the habit in the local state
                const habitIndex = this.habits.findIndex(h => h.id === habit.id);
                if (habitIndex !== -1) {
                    this.habits[habitIndex].repetitions[today] = newValue;
                }
            });
        } else {
            const completeButton = habitDiv.querySelector('.complete-today-btn');
            const today = new Date().toISOString().split('T')[0];
            
            if (habit.dates.includes(today)) {
                completeButton.classList.add('completed');
                completeButton.textContent = 'Completed';
            } else {
                completeButton.textContent = 'Complete Today';
            }
            
            completeButton.addEventListener('click', async () => {
                const result = await this.ipcRenderer.invoke('toggle-habit-date', {
                    habitId: habit.id,
                    date: today
                });
                
                if (result) {
                    const habitIndex = this.habits.findIndex(h => h.id === habit.id);
                    if (habitIndex !== -1) {
                        this.habits[habitIndex] = result;
                        
                        if (result.dates.includes(today)) {
                            completeButton.classList.add('completed');
                            completeButton.textContent = 'Completed';
                        } else {
                            completeButton.classList.remove('completed');
                            completeButton.textContent = 'Complete Today';
                        }
                        
                        const todayCell = habitDiv.querySelector(`.day-cell[data-date="${today}"]`);
                        if (todayCell) {
                            todayCell.style.backgroundColor = result.dates.includes(today) ? habit.color : '';
                        }
                    }
                }
            });
        }
        
        const editButton = habitDiv.querySelector('.edit-habit-btn');
        editButton.addEventListener('click', () => this.editHabitModal.show(habit));
        
        return habitDiv;
    }
}

module.exports = HabitTracker;