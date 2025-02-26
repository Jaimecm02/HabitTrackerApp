class NewHabitModal {
    constructor(container, onSave, onCancel) {
        this.container = container;
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.modal = null;
        this.nameInput = null;
        this.colorInput = null;
        this.multipleCompletionsCheckbox = null;
        this.saveButton = null;
        this.cancelButton = null;
        
        this.init();
    }
    
    init() {
        // Create modal HTML
        const modalDiv = document.createElement('div');
        modalDiv.id = 'newHabitModal';
        modalDiv.className = 'modal';
        modalDiv.innerHTML = `
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
                <div class="form-group">
                    <label for="multipleCompletions">
                        <input type="checkbox" id="multipleCompletions"> Track multiple completions (e.g., reps)
                    </label>
                </div>
                <div class="modal-buttons">
                    <button id="saveNewHabit">Create</button>
                    <button id="cancelNewHabit">Cancel</button>
                </div>
            </div>
        `;
        
        this.container.appendChild(modalDiv);
        
        // Cache DOM elements
        this.modal = modalDiv;
        this.nameInput = modalDiv.querySelector('#habitName');
        this.colorInput = modalDiv.querySelector('#habitColor');
        this.multipleCompletionsCheckbox = modalDiv.querySelector('#multipleCompletions');
        this.saveButton = modalDiv.querySelector('#saveNewHabit');
        this.cancelButton = modalDiv.querySelector('#cancelNewHabit');
        
        // Bind events
        this.bindEvents();
    }
    
    bindEvents() {
        this.saveButton.addEventListener('click', () => {
            if (!this.nameInput.value.trim()) {
                return;
            }
            
            const habitData = {
                name: this.nameInput.value.trim(),
                color: this.colorInput.value,
                multipleCompletions: this.multipleCompletionsCheckbox.checked
            };
            
            this.onSave(habitData);
            this.reset();
            this.hide();
        });
        
        this.cancelButton.addEventListener('click', () => {
            this.reset();
            this.hide();
            if (this.onCancel) {
                this.onCancel();
            }
        });
    }
    
    show() {
        this.modal.classList.add('active');
    }
    
    hide() {
        this.modal.classList.remove('active');
    }
    
    reset() {
        this.nameInput.value = '';
        this.colorInput.value = '#3498db';
        this.multipleCompletionsCheckbox.checked = false;
    }
    
    getElement() {
        return this.modal;
    }
}

module.exports = NewHabitModal;