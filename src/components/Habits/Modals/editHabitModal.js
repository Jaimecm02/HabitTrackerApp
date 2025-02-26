class EditHabitModal {
    constructor(container, onSave, onDelete, onCancel) {
        this.container = container;
        this.onSave = onSave;
        this.onDelete = onDelete;
        this.onCancel = onCancel;
        this.modal = null;
        this.nameInput = null;
        this.colorInput = null;
        this.saveButton = null;
        this.deleteButton = null;
        this.cancelButton = null;
        this.currentHabit = null;
        
        this.init();
    }
    
    init() {
        // Create modal HTML
        const modalDiv = document.createElement('div');
        modalDiv.id = 'editHabitModal';
        modalDiv.className = 'modal';
        modalDiv.innerHTML = `
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
                    <button id="deleteHabit">Delete Habit</button>
                    <button id="saveHabitChanges">Save</button>
                    <button id="cancelHabitEdit">Cancel</button>
                </div>
            </div>
        `;
        
        this.container.appendChild(modalDiv);
        
        // Cache DOM elements
        this.modal = modalDiv;
        this.nameInput = modalDiv.querySelector('#editHabitName');
        this.colorInput = modalDiv.querySelector('#editHabitColor');
        this.saveButton = modalDiv.querySelector('#saveHabitChanges');
        this.deleteButton = modalDiv.querySelector('#deleteHabit');
        this.cancelButton = modalDiv.querySelector('#cancelHabitEdit');
        
        // Bind events
        this.bindEvents();
    }
    
    bindEvents() {
        this.saveButton.addEventListener('click', () => {
            if (!this.nameInput.value.trim() || !this.currentHabit) {
                return;
            }
            
            const updatedHabit = {
                ...this.currentHabit,
                name: this.nameInput.value.trim(),
                color: this.colorInput.value
            };
            
            this.onSave(updatedHabit);
            this.hide();
        });
        
        this.deleteButton.addEventListener('click', () => {
            if (!this.currentHabit) return;
            
            if (confirm(`Are you sure you want to delete "${this.currentHabit.name}"?`)) {
                this.onDelete(this.currentHabit.id);
                this.hide();
            }
        });
        
        this.cancelButton.addEventListener('click', () => {
            this.hide();
            if (this.onCancel) {
                this.onCancel();
            }
        });
    }
    
    show(habit) {
        this.currentHabit = habit;
        this.nameInput.value = habit.name;
        this.colorInput.value = habit.color;
        this.modal.classList.add('active');
    }
    
    hide() {
        this.modal.classList.remove('active');
        this.currentHabit = null;
    }
    
    getElement() {
        return this.modal;
    }
}

module.exports = EditHabitModal;