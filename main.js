const { app, BrowserWindow, ipcMain, net, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Define the habits file path
const HABITS_FILE = path.join(app.getPath('userData'), 'habits.json');

// Define the habits functions
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

// Register IPC handlers before creating the window
ipcMain.handle('get-habits', async () => {
    console.log('get-habits handler called'); // Debug log
    return loadHabits();
});

ipcMain.handle('add-habit', async (event, habit) => {
    console.log('add-habit handler called with:', habit); // Debug log
    try {
        const habits = loadHabits();
        habits.push(habit);
        saveHabits(habits);
        event.sender.send('habits-updated');  // Add this line
        return habit;
    } catch (error) {
        console.error('Error in add-habit handler:', error);
        throw error; // Propagate the error back to renderer
    }
});

ipcMain.handle('toggle-habit-date', async (event, {habitId, date}) => {
    console.log('toggle-habit-date handler called:', {habitId, date}); // Debug log
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
        event.sender.send('habits-updated');  // Add this line
        return habit;
    }
    return null;
});

// Replace the existing delete handler with this one
ipcMain.handle('delete-habit', async (event, habitId) => {
    try {
        const habits = loadHabits();
        const updatedHabits = habits.filter(habit => habit.id !== habitId);
        saveHabits(updatedHabits);
        event.sender.send('habits-updated');  // Add this line
        return true;
    } catch (error) {
        console.error('Error deleting habit:', error);
        return false;
    }
});

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1110,
        height: 1000,
        minWidth: 1110,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })
    
    win.loadFile('index.html')

    // Create menu template
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'View Habits Data File',
                    click: async () => {
                        shell.showItemInFolder(HABITS_FILE);
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});
