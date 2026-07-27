// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('saveAPI', {
  write: (slot, data) => ipcRenderer.invoke('save:write', { slot, data }),
  read: (slot) => ipcRenderer.invoke('save:read', { slot }),
  list: () => ipcRenderer.invoke('save:list'),
  quit: () => ipcRenderer.invoke('app:quit')
});
