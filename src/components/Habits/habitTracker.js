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
                <h2>HABIT TRACKER</h2>
                <div class="habit-form">
                    <input type="text" id="habitName" placeholder="Habit name">
                    <input type="color" id="habitColor" value="#3498db">
                    <button id="addHabit">Add Habit</button>
                </div>
                <div class="habits-list"></div>
            </div>
            <div id="editHabitModal" class="modal">
                <div class="modal-content">
                    <h3>Edit Habit</h3>
                    <input type="text" id="editHabitName" placeholder="Habit name">
                    <input type="color" id="editHabitColor">
                    <div class="modal-buttons">
                        <button id="saveHabitChanges">Save</button>
                        <button id="cancelHabitEdit">Cancel</button>
                    </div>
                </div>
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

    createHabitElement(habit) {
        const habitDiv = document.createElement('div');
        habitDiv.className = 'habit-item';
        habitDiv.draggable = true; // Make the habit card draggable
        habitDiv.dataset.habitId = habit.id; // Store the habit ID for reference

        const yearGrid = createYearGrid(habit);
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

        // Add edit button handler
        const editButton = habitDiv.querySelector('.edit-habit-btn');
        editButton.addEventListener('click', () => this.showEditModal(habit));

        habitDiv.appendChild(yearGrid);

        // Add drag-and-drop event listeners
        habitDiv.addEventListener('dragstart', this.handleDragStart.bind(this));
        habitDiv.addEventListener('dragover', this.handleDragOver.bind(this));
        habitDiv.addEventListener('drop', this.handleDrop.bind(this));

        return habitDiv;
    }

    handleDragStart(event) {
        // Store the ID of the habit being dragged
        event.dataTransfer.setData('text/plain', event.target.dataset.habitId);
        event.target.classList.add('dragging'); // Add a class for visual feedback
    }

    handleDragOver(event) {
        event.preventDefault();
        if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
    
        this.debounceTimeout = setTimeout(() => {
            const draggingElement = this.container.querySelector('.dragging');
            const overElement = event.target.closest('.habit-item');
    
            if (overElement && draggingElement !== overElement) {
                const rect = overElement.getBoundingClientRect();
                const offset = event.clientY - rect.top;
    
                // Only move the element if it crosses the midpoint
                if (offset < rect.height / 2) {
                    this.container.querySelector('.habits-list').insertBefore(draggingElement, overElement);
                } else {
                    this.container.querySelector('.habits-list').insertBefore(draggingElement, overElement.nextSibling);
                }
            }
        }, 1); // Adjust the debounce time as needed
    }

    handleDrop(event) {
        event.preventDefault();
        const draggedHabitId = event.dataTransfer.getData('text/plain');
        const draggedElement = this.container.querySelector('.dragging');
        draggedElement.classList.remove('dragging');
    
        // Get the new order of habits based on the DOM
        const newOrder = Array.from(this.container.querySelectorAll('.habit-item')).map(el => el.dataset.habitId);
    
        // Update the habits array based on the new order
        this.habits.sort((a, b) => newOrder.indexOf(a.id.toString()) - newOrder.indexOf(b.id.toString()));
    
        // Optionally, you can save the new order to the backend if needed
        this.saveHabitsOrder();
    }
    
    async saveHabitsOrder() {
        try {
            await this.ipcRenderer.invoke('save-habits-order', this.habits);
        } catch (error) {
            console.error('Error saving habits order:', error);
        }
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
        modal.style.display = 'block';

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
            modal.style.display = 'none';
            cleanup();
        };

        const handleCancel = () => {
            modal.style.display = 'none';
            cleanup();
        };

        const handleDelete = async () => {
            if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                const success = await this.ipcRenderer.invoke('delete-habit', habit.id);
                if (success) {
                    this.habits = this.habits.filter(h => h.id !== habit.id);
                    this.renderHabits();
                    modal.style.display = 'none';
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