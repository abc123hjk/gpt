const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('cat', {
  getState: () => ipcRenderer.invoke('state'),
  command: action => ipcRenderer.invoke('command', action),
  onUpdate: fn => { const listener = (_, data) => fn(data); ipcRenderer.on('update', listener); return () => ipcRenderer.removeListener('update', listener); },
  onAnimation: fn => { const listener = (_, data) => fn(data); ipcRenderer.on('animation', listener); return () => ipcRenderer.removeListener('animation', listener); },
  interactive: value => ipcRenderer.send('interactive', value),
  drag: value => ipcRenderer.send('drag', value),
  menu: () => ipcRenderer.send('menu'),
  move: delta => ipcRenderer.send('move', delta),
  panel: () => ipcRenderer.send('panel'),
  hidePanel: () => ipcRenderer.send('hide-panel'),
  quit: () => ipcRenderer.send('quit'),
  resetPosition: () => ipcRenderer.send('reset-position')
});
