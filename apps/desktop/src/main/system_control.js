const { exec } = require('child_process');

module.exports = {
  set_volume: async (level) => {
    try {
      const loudness = require('loudness');
      await loudness.setVolume(level);
      return { success: true, message: `Volume set to ${level}%` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  get_volume: async () => {
    try {
      const loudness = require('loudness');
      const vol = await loudness.getVolume();
      return { success: true, volume: vol };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  set_brightness: async (level) => {
    try {
      const brightness = require('brightness');
      await brightness.set(level / 100);
      return { success: true, message: `Brightness set to ${level}%` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  get_active_window: async () => {
    try {
      const activeWindow = require('active-win');
      const win = await activeWindow();
      if (!win) return { success: false, error: 'No active window found' };
      return { success: true, window: { title: win.title, app: win.owner.name } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  list_processes: async () => {
    try {
      const psList = (await import('ps-list')).default;
      const processes = await psList();
      return { success: true, processes: processes.slice(0, 50).map(p => ({ name: p.name, pid: p.pid })) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  shutdown_pc: async () => {
    return new Promise((resolve) => {
      exec('shutdown /s /t 0', (err) => {
        if (err) resolve({ success: false, error: err.message });
        else resolve({ success: true, message: 'Shutting down...' });
      });
    });
  },

  restart_pc: async () => {
    return new Promise((resolve) => {
      exec('shutdown /r /t 0', (err) => {
        if (err) resolve({ success: false, error: err.message });
        else resolve({ success: true, message: 'Restarting...' });
      });
    });
  },

  lock_pc: async () => {
    return new Promise((resolve) => {
      exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
        if (err) resolve({ success: false, error: err.message });
        else resolve({ success: true, message: 'Workstation locked.' });
      });
    });
  }
};
