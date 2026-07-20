import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyApprovalToken } from '../../../../packages/core/confirmation-gate/verify';

const execAsync = promisify(exec);

export function setupAppLauncherHandlers() {
  ipcMain.handle('app:launch', async (_, { appName, token }) => {
    // Low-risk but might still require a basic token depending on configuration
    if (!verifyApprovalToken(token, 'LOW')) throw new Error('Unauthorized');
    
    // Windows approach: try to start the executable
    try {
      await execAsync(`start "" "${appName}"`);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to launch app: ${appName}`);
    }
  });
}
