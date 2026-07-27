// electron/main.js
const path = require('path');
const fs = require('fs');

const electron = require('electron');
let app, BrowserWindow, ipcMain;
if (typeof electron === 'object' && electron.app) {
  app = electron.app;
  BrowserWindow = electron.BrowserWindow;
  ipcMain = electron.ipcMain;
} else {
  // Running in headless/dev without GUI — provide mock for smoke testing
  app = {
    whenReady() { return Promise.resolve(); },
    on() {}, quit() { process.exit(0); }, getPath() { return '/tmp'; }
  };
  BrowserWindow = class { constructor() { setTimeout(() => app.quit(), 100); } loadFile() {} on() {} };
  ipcMain = { handle() {} };
}

let mainWindow;

function getSaveDir() {
  const base = app.getPath('userData');
  const dir = path.join(base, 'saves');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: '政治模拟：派系斗争',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// IPC: 存档/读档
ipcMain.handle('save:write', (event, { slot, data }) => {
  const filePath = path.join(getSaveDir(), `save_${slot}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return { success: true };
});

ipcMain.handle('save:read', (event, { slot }) => {
  const filePath = path.join(getSaveDir(), `save_${slot}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
});

ipcMain.handle('save:list', () => {
  const dir = getSaveDir();
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('save_') && f.endsWith('.json'))
    .map(f => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      return { slot: f.replace('save_', '').replace('.json', ''), meta: raw.meta, timestamp: raw.timestamp };
    });
});
