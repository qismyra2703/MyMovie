// Electron main process: creates the app window and loads the first page
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({ width: 1000, height: 760, webPreferences: { contextIsolation: true } });
  win.setMenuBarVisibility(false);
  win.loadFile('renderer/index.html');
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });