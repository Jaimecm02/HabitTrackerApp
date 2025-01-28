const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const HABITS_FILE = path.join(require('electron').app.getPath('userData'), 'habits.json');

function loadHabits() {
    try {
        if (fs.existsSync(HABITS_FILE)) {
            return JSON.parse(fs.readFileSync(HABITS_FILE, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error('Error loading habits:', error);
        return [];
    }
}

function saveHabits(habits) {
    try {
        fs.writeFileSync(HABITS_FILE, JSON.stringify(habits, null, 2));
    } catch (error) {
        console.error('Error saving habits:', error);
    }
}

ipcMain.handle('get-habits', async () => {
    console.log('get-habits handler called');
    return loadHabits();
});

ipcMain.handle('add-habit', async (event, habit) => {
    console.log('add-habit handler called with:', habit);
    try {
        const habits = loadHabits();
        habits.push(habit);
        saveHabits(habits);
        event.sender.send('habits-updated');
        return habit;
    } catch (error) {
        console.error('Error in add-habit handler:', error);
        throw error;
    }
});

ipcMain.handle('toggle-habit-date', async (event, { habitId, date }) => {
    console.log('toggle-habit-date handler called:', { habitId, date });
    const habits = loadHabits();
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        const dateIndex = habit.dates.indexOf(date);
        if (dateIndex === -1) {
            habit.dates.push(date);
        } else {
            habit.dates.splice(dateIndex, 1);
        }
        saveHabits(habits);
        event.sender.send('habits-updated');
        return habit;
    }
    return null;
});

ipcMain.handle('delete-habit', async (event, habitId) => {
    try {
        const habits = loadHabits();
        const updatedHabits = habits.filter(habit => habit.id !== habitId);
        saveHabits(updatedHabits);
        event.sender.send('habits-updated');
        return true;
    } catch (error) {
        console.error('Error deleting habit:', error);
        return false;
    }
});

module.exports = { HABITS_FILE };