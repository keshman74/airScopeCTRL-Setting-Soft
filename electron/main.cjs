const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    // In development, the Vite dev server runs on port 3000
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, we run the bundled Express server
    // which serves the static files and API proxies on port 3000
    process.env.NODE_ENV = 'production';
    try {
      require(path.join(__dirname, '../dist/server.cjs'));
    } catch (e) {
      console.error('Failed to load local server (ensure you ran `npm run build`):', e);
    }
    
    // Give the Express server a moment to bind to the port
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 500);
  }
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
