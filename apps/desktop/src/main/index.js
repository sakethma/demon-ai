require('dotenv').config();
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');

// Disable hardware acceleration and sandbox to prevent WebGL/GPU process hangs in virtualized environments
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('http://localhost:5173');
  win.webContents.on('did-fail-load', () => {
    console.log('Failed to load dev server, retrying in 1s...');
    setTimeout(() => {
      win.loadURL('http://localhost:5173');
    }, 1000);
  });
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  // IPC Handlers bypassing confirmation-gate for initial autonomous testing
  ipcMain.handle('launch_app', async (event, args) => {
    return new Promise((resolve) => {
      exec(args.command, (error, stdout, stderr) => {
        if (error) resolve({ success: false, error: error.message });
        else resolve({ success: true, output: stdout });
      });
    });
  });

  ipcMain.handle('open_anything', async (event, args) => {
    try {
      let url = args.query;
      const lowerQuery = url.toLowerCase();
      
      if (lowerQuery.includes('youtube.com') || lowerQuery.startsWith('youtube ') || lowerQuery.includes(' on youtube')) {
        const searchTerm = lowerQuery.replace('on youtube', '').replace('youtube', '').trim();
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // If it looks like a domain
        if (url.includes('.') && !url.includes(' ')) {
          url = `https://${url}`;
        } else {
          // Default to google search
          url = `https://google.com/search?q=${encodeURIComponent(url)}`;
        }
      }
      
      await shell.openExternal(url);
      return { success: true, message: `Opened: ${url}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ask_gemini', async (event, { messages, tools }) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          tools: tools ? [{ functionDeclarations: tools }] : undefined
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });

  // System Controls
  const sysControl = require('./system_control');
  ipcMain.handle('set_volume', async (e, args) => sysControl.set_volume(args.level));
  ipcMain.handle('get_volume', async () => sysControl.get_volume());
  ipcMain.handle('set_brightness', async (e, args) => sysControl.set_brightness(args.level));
  ipcMain.handle('get_active_window', async () => sysControl.get_active_window());
  ipcMain.handle('list_processes', async () => sysControl.list_processes());
  ipcMain.handle('shutdown_pc', async () => sysControl.shutdown_pc());
  ipcMain.handle('restart_pc', async () => sysControl.restart_pc());
  ipcMain.handle('lock_pc', async () => sysControl.lock_pc());

  // File Operations
  const fileOps = require('./file_ops');
  ipcMain.handle('search_files', async (e, args) => fileOps.search_files(args.pattern, args.directory));
  ipcMain.handle('delete_file', async (e, args) => fileOps.delete_file(args.filePath));
  ipcMain.handle('move_file', async (e, args) => fileOps.move_file(args.sourcePath, args.destinationDir));
  ipcMain.handle('read_file_safe', async (e, args) => fileOps.read_file_safe(args.filePath));

  createWindow();

  // Start background auto-organize watcher on Downloads folder
  /*
  const downloadsPath = path.join(require('os').homedir(), 'Downloads');
  fileOps.start_watcher(downloadsPath, (eventData) => {
    // Wait for windows to exist
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('file_watcher_event', eventData);
    }
  });
  */

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
