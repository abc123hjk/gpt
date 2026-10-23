'use strict';
const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, powerMonitor, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { initialState, hydrate, command, completeIfDue, remaining } = require('./core.cjs');
if (process.env.TANGERINE_TEST_DATA) app.setPath('userData', process.env.TANGERINE_TEST_DATA);
let pet, panel, tray, state, saveFile, dragTimer, dragStart, lastDragEnd = 0, quitting = false, writeTimer, saveWarningShown = false;
const size = () => Math.round(224 * state.settings.scale);
function saveNow() {
  clearTimeout(writeTimer);
  try { fs.mkdirSync(path.dirname(saveFile), { recursive: true }); fs.writeFileSync(saveFile + '.tmp', JSON.stringify(state, null, 2), 'utf8'); fs.renameSync(saveFile + '.tmp', saveFile); }
  catch (err) { console.error('无法保存存档:', err.message); if (!saveWarningShown) { saveWarningShown = true; dialog.showErrorBox('小橘暂时无法保存', '请检查存档目录的写入权限或磁盘空间。当前进度仍保留在内存中。\n' + saveFile); } }
}
function save() { clearTimeout(writeTimer); writeTimer = setTimeout(saveNow, 350); }
function snapshot() { return { ...state, remainingMs: remaining(state), now: Date.now() }; }
function broadcast() { for (const win of [pet,panel]) if (win && !win.isDestroyed()) win.webContents.send('update', snapshot()); }
function animate(animation, message) { for (const win of [pet,panel]) if (win && !win.isDestroyed()) win.webContents.send('animation', { animation, message }); }
function tick() { if (completeIfDue(state)) { save(); animate('happy', '专注完成！鱼干到账啦。'); } broadcast(); }
function clampPosition(x, y, w = size()) {
  const { workArea: a } = screen.getDisplayNearestPoint({ x: Math.round(x+w/2), y: Math.round(y+w/2) });
  return { x: Math.round(Math.max(a.x, Math.min(a.x+a.width-w,x))), y: Math.round(Math.max(a.y, Math.min(a.y+a.height-w,y))) };
}
function resetPosition() { const a = screen.getPrimaryDisplay().workArea; const p = clampPosition(a.x+a.width-size()-36,a.y+a.height-size()); pet.setPosition(p.x,p.y); state.position=p; save(); }
function applySettings() {
  if (!pet) return;
  pet.setAlwaysOnTop(state.settings.alwaysOnTop, 'floating');
  const [x,y] = pet.getPosition(); const w=size(); const p=clampPosition(x,y,w);
  pet.setBounds({ ...p, width:w,height:w });
  state.position=p;
}
function perform(action) { const wasDue = completeIfDue(state); if (wasDue) animate('happy', '专注完成！鱼干到账啦。'); const result = command(state, action); if (result.animation || result.message) animate(result.animation, result.message); if (action.type === 'settings') applySettings(); save(); broadcast(); return result; }
function showPanel() { if (panel) { panel.show(); panel.focus(); } }
function menu() {
  const t = state.timer;
  Menu.buildFromTemplate([
    { label:'小橘 · 桌面伙伴', enabled:false }, { type:'separator' },
    { label:'打开小窝', click:showPanel },
    { label:'摸摸头', click:()=>perform({type:'pet'}) },
    { label:`喂一条鱼干（剩余 ${state.fish}）`, enabled:state.fish>0, click:()=>perform({type:'feed'}) },
    { label:'睡一会儿', click:()=>perform({type:'sleep'}) },
    { label:'叫醒小橘', click:()=>perform({type:'wake'}) }, { type:'separator' },
    ...(t ? [{ label:t.paused?'继续专注':'暂停专注', click:()=>perform({type:t.paused?'resume':'pause'}) },{ label:'结束本次专注（不发放奖励）', click:()=>perform({type:'cancel'}) }] : [{ label:`开始 ${state.settings.duration} 分钟专注`, click:()=>perform({type:'start'}) }]),
    { label:'找回小橘', click:resetPosition }, { type:'separator' },
    { label:'退出小橘', click:()=>app.quit() }
  ]).popup();
}
function endDrag() { if (!dragTimer) return; clearInterval(dragTimer);dragTimer=null;lastDragEnd=Date.now();state.position={x:pet.getBounds().x,y:pet.getBounds().y};save();animate(state.timer&&!state.timer.paused?'focus':'idle','落地！'); }
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance',()=>{showPanel();if(pet)pet.showInactive();});
  app.whenReady().then(()=>{
    saveFile=path.join(app.getPath('userData'),'save.json');
    try { state=hydrate(JSON.parse(fs.readFileSync(saveFile,'utf8'))); }
    catch (err) { state=initialState(); if(err.code!=='ENOENT') { try {fs.copyFileSync(saveFile,saveFile+'.corrupt-'+Date.now());}catch{} } }
    const resumedComplete=completeIfDue(state); if(resumedComplete)save();
    const webPreferences={preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false};
    pet=new BrowserWindow({width:size(),height:size(),frame:false,transparent:true,resizable:false,maximizable:false,fullscreenable:false,hasShadow:false,skipTaskbar:true,alwaysOnTop:state.settings.alwaysOnTop,show:false,webPreferences,icon:path.join(__dirname,'../assets/icon.png')});
    pet.setIgnoreMouseEvents(true,{forward:true});
    pet.loadFile(path.join(__dirname,'pet.html'));
    pet.once('ready-to-show',()=>{ if(state.position){const p=clampPosition(state.position.x,state.position.y);pet.setPosition(p.x,p.y);}else resetPosition();pet.showInactive();if(resumedComplete)animate('happy','上次的专注完成啦，鱼干已到账。'); });
    pet.on('close',e=>{if(!quitting)e.preventDefault();});
    panel=new BrowserWindow({width:980,height:760,minWidth:820,minHeight:660,show:false,backgroundColor:'#f8f6f0',autoHideMenuBar:true,title:'小橘 · 桌面小窝',webPreferences,icon:path.join(__dirname,'../assets/icon.png')});
    panel.loadFile(path.join(__dirname,'panel.html'));
    panel.once('ready-to-show',()=>panel.show());
    panel.on('close',e=>{if(!quitting){e.preventDefault();panel.hide();}});
    for(const win of [pet,panel]) { win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.on('will-attach-webview',e=>e.preventDefault()); }
    try { let icon=nativeImage.createFromPath(path.join(__dirname,'../assets/icon.png')); tray=new Tray(icon.resize({width:24,height:24}));tray.setToolTip('小橘 · 右键打开菜单');tray.on('click',showPanel);tray.on('right-click',menu); } catch(err) {console.error('托盘图标不可用:',err.message);}
    Menu.setApplicationMenu(null);
    const allowed = event => [pet?.webContents,panel?.webContents].includes(event.sender);
    ipcMain.handle('state',event=>allowed(event)?snapshot():null);
    ipcMain.handle('command',(event,action)=>{ if(!allowed(event)||!action||typeof action.type!=='string')return{ok:false};if(action.type==='pet'&&Date.now()-lastDragEnd<250)return{ok:true};return perform(action); });
    ipcMain.on('interactive',(event,value)=>{ if(event.sender===pet.webContents&&!dragTimer)pet.setIgnoreMouseEvents(!value,{forward:true}); });
    ipcMain.on('drag',(event,start)=>{
      if(event.sender!==pet.webContents)return;
      if(!start){endDrag();return;} if(dragTimer)return;
      pet.setIgnoreMouseEvents(false);dragStart={cursor:screen.getCursorScreenPoint(),bounds:pet.getBounds(),at:Date.now()};animate('drag','轻轻放下我喔。');
      dragTimer=setInterval(()=>{if(Date.now()-dragStart.at>30000){endDrag();return;}const c=screen.getCursorScreenPoint();const p=clampPosition(dragStart.bounds.x+c.x-dragStart.cursor.x,dragStart.bounds.y+c.y-dragStart.cursor.y);pet.setPosition(p.x,p.y);},16);
    });
    ipcMain.on('move',(event,delta)=>{if(event.sender!==pet.webContents||!state.settings.roam||dragTimer||state.timer||!Number.isFinite(delta)||Math.abs(delta)>3)return;const b=pet.getBounds();const p=clampPosition(b.x+delta,b.y);pet.setPosition(p.x,p.y);state.position=p;save();});
    ipcMain.on('menu',event=>{if(allowed(event))menu();});
    ipcMain.on('panel',event=>{if(allowed(event))showPanel();});
    ipcMain.on('hide-panel',event=>{if(allowed(event))panel.hide();});
    ipcMain.on('quit',event=>{if(allowed(event))app.quit();});
    ipcMain.on('reset-position',event=>{if(allowed(event))resetPosition();});
    screen.on('display-metrics-changed',applySettings);screen.on('display-removed',applySettings);
    powerMonitor.on('resume',tick);setInterval(tick,1000);
    app.on('activate',showPanel);
  });
  app.on('before-quit',()=>{quitting=true;clearInterval(dragTimer);if(state&&saveFile)saveNow();});
  app.on('window-all-closed',()=>app.quit());
}
