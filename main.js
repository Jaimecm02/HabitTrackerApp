const { app, BrowserWindow, Menu, shell } = require('electron');
const { HABITS_FILE } = require('./src/components/Habits/habitsHandlers');

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
    });

    win.loadFile('index.html');

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
};

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
