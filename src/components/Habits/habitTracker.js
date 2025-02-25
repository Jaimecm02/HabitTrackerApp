const { calculateStreak, getStreakLevel, createYearGrid } = require('./habitsUtils');

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
            
            <!-- New Habit Modal -->
            <div id="newHabitModal" class="modal">
                <div class="modal-content">
                    <h3>New Habit</h3>
                    <div class="form-group">
                        <label for="habitName">Habit Name</label>
                        <input type="text" id="habitName" placeholder="What would you like to track?">
                    </div>
                    <div class="form-group">
                        <label for="habitColor">Color</label>
                        <input type="color" id="habitColor" value="#3498db">
                    </div>
                    <div class="modal-buttons">
                        <button id="saveNewHabit">Create</button>
                        <button id="cancelNewHabit">Cancel</button>
                    </div>
                </div>
            </div>
            
            <!-- Edit Habit Modal -->
            <div id="editHabitModal" class="modal">
                <div class="modal-content">
                    <h3>Edit Habit</h3>
                    <div class="form-group">
                        <label for="editHabitName">Habit Name</label>
                        <input type="text" id="editHabitName" placeholder="Habit name">
                    </div>
                    <div class="form-group">
                        <label for="editHabitColor">Color</label>
                        <input type="color" id="editHabitColor">
                    </div>
                    <div class="modal-buttons">
                        <button id="saveHabitChanges">Save</button>
                        <button id="cancelHabitEdit">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    
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
            this.showNewHabitModal();
        });
        
        // New habit modal events
        const newHabitModal = this.container.querySelector('#newHabitModal');
        const saveNewHabitButton = newHabitModal.querySelector('#saveNewHabit');
        const cancelNewHabitButton = newHabitModal.querySelector('#cancelNewHabit');
        
        saveNewHabitButton.addEventListener('click', () => this.addHabit());
        cancelNewHabitButton.addEventListener('click', () => {
            newHabitModal.classList.remove('active');
            // Clear the form
            newHabitModal.querySelector('#habitName').value = '';
            newHabitModal.querySelector('#habitColor').value = '#3498db';
        });
    }
    
    showNewHabitModal() {
        const modal = this.container.querySelector('#newHabitModal');
        modal.classList.add('active');
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
        
        const modal = this.container.querySelector('#newHabitModal');
        const nameInput = modal.querySelector('#habitName');
        const colorInput = modal.querySelector('#habitColor');
        
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
                
                // Reset and close the modal
                nameInput.value = '';
                colorInput.value = '#3498db';
                modal.classList.remove('active');
            }
        } catch (error) {
            console.error('Error adding habit:', error);
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

    hexToRgb(hex) {
        // Remove the hash at the start if it's there
        hex = hex.replace(/^#/, '');
        
        // Parse the hex color into RGB components
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        
        return `${r}, ${g}, ${b}`;
    }

    createHabitElement(habit, year) {
        const habitDiv = document.createElement('div');
        habitDiv.className = 'habit-item';
        habitDiv.dataset.habitId = habit.id; // Store the habit ID for reference
        habitDiv.style.borderColor = `rgba(${this.hexToRgb(habit.color)}, 0.1)`;

        const yearGrid = createYearGrid(habit, year); // Pass the selected year
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
                    <button class="complete-today-btn">Complete Today</button>
                    <button class="edit-habit-btn">
                        <svg width="16" height="16"><use href="#icon-pencil"/></svg>
                        Edit
                    </button>
                </div>
            </div>
            <div class="grid-container">
                <!-- Year grid will be appended here -->
            </div>
        `;
        
        // Get the grid container and append the year grid to it
        const gridContainer = habitDiv.querySelector('.grid-container');
        gridContainer.appendChild(yearGrid);
        
        // Add click handler for complete today button
        const completeButton = habitDiv.querySelector('.complete-today-btn');
        const today = new Date().toISOString().split('T')[0];
        
        // Set initial completed state
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
                    
                    // Update button state without full re-render
                    if (result.dates.includes(today)) {
                        completeButton.classList.add('completed');
                        completeButton.textContent = 'Completed';
                    } else {
                        completeButton.classList.remove('completed');
                        completeButton.textContent = 'Complete Today';
                    }
                    
                    // Update only the specific day cell
                    const todayCell = habitDiv.querySelector(`.day-cell[data-date="${today}"]`);
                    if (todayCell) {
                        todayCell.style.backgroundColor = result.dates.includes(today) ? habit.color : '';
                    }
                }
            }
        });
    
        // Add edit button handler
        const editButton = habitDiv.querySelector('.edit-habit-btn');
        editButton.addEventListener('click', () => this.showEditModal(habit));
    
        return habitDiv;
    }

    showEditModal(habit) {
        const modal = this.container.querySelector('#editHabitModal');
        const nameInput = modal.querySelector('#editHabitName');
        const colorInput = modal.querySelector('#editHabitColor');
        const saveButton = modal.querySelector('#saveHabitChanges');
        const cancelButton = modal.querySelector('#cancelHabitEdit');
        
        // Create delete button
        let deleteButton = modal.querySelector('#deleteHabit');
        if (!deleteButton) {
            deleteButton = document.createElement('button');
            deleteButton.id = 'deleteHabit';
            deleteButton.textContent = 'Delete Habit';
            modal.querySelector('.modal-buttons').prepend(deleteButton);
        }

        nameInput.value = habit.name;
        colorInput.value = habit.color;
        modal.classList.add('active');

        const cleanup = () => {
            saveButton.removeEventListener('click', handleSave);
            cancelButton.removeEventListener('click', handleCancel);
            deleteButton.removeEventListener('click', handleDelete);
            if (deleteButton.parentElement) {
                deleteButton.remove();
            }
        };

        const handleSave = async () => {
            const updatedHabit = {
                ...habit,
                name: nameInput.value.trim(),
                color: colorInput.value
            };

            if (!updatedHabit.name) return;

            const result = await this.ipcRenderer.invoke('update-habit', updatedHabit);
            if (result) {
                const habitIndex = this.habits.findIndex(h => h.id === habit.id);
                if (habitIndex !== -1) {
                    this.habits[habitIndex] = result;
                    this.renderHabits();
                }
            }
            modal.classList.remove('active');
            cleanup();
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
        };

        const handleDelete = async () => {
            if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                const success = await this.ipcRenderer.invoke('delete-habit', habit.id);
                if (success) {
                    this.habits = this.habits.filter(h => h.id !== habit.id);
                    this.renderHabits();
                    modal.classList.remove('active');
                    cleanup();
                }
            }
        };

        saveButton.addEventListener('click', handleSave);
        cancelButton.addEventListener('click', handleCancel);
        deleteButton.addEventListener('click', handleDelete);
    }
}

module.exports = HabitTracker;