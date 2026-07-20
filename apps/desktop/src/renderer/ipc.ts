// This acts as a bridge between the React frontend and the Electron Node.js backend

export const executeNativeTool = async (toolName: string, args: any) => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.require) {
    // @ts-ignore
    const { ipcRenderer } = window.require('electron');
    try {
      const result = await ipcRenderer.invoke(toolName, args);
      return result;
    } catch (error) {
      console.error(`Failed to execute native tool ${toolName}:`, error);
      return { success: false, error: String(error) };
    }
  } else {
    console.warn("IPC Renderer not available (Not running in Electron context). Mocking tool execution.");
    return { success: false, error: 'Not running in Electron' };
  }
};

export const askGemini = async (messages: any[], tools: any[]) => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.require) {
    // @ts-ignore
    const { ipcRenderer } = window.require('electron');
    return ipcRenderer.invoke('ask_gemini', { messages, tools });
  } else {
    throw new Error('IPC Renderer not available');
  }
}

export const onFileWatcherEvent = (callback: (data: any) => void) => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.require) {
    // @ts-ignore
    const { ipcRenderer } = window.require('electron');
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('file_watcher_event', handler);
    return () => ipcRenderer.removeListener('file_watcher_event', handler);
  }
  return () => {};
};
