const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const mime = require('mime-types');

async function safeTrash(filePath) {
  // Use dynamic import for ESM modules
  const trash = (await import('trash')).default;
  await trash(filePath);
}

async function getFileType(filePath) {
  const { fileTypeFromFile } = await import('file-type');
  return await fileTypeFromFile(filePath);
}

module.exports = {
  search_files: async (pattern, directory) => {
    try {
      const searchPath = path.join(directory, pattern).replace(/\\/g, '/');
      const entries = await fg([searchPath], { dot: true, onlyFiles: true });
      return { success: true, files: entries };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
  
  delete_file: async (filePath) => {
    try {
      await safeTrash(filePath);
      return { success: true, message: `Moved to recycle bin: ${filePath}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  move_file: async (sourcePath, destinationDir) => {
    try {
      if (!fs.existsSync(sourcePath)) return { success: false, error: 'Source file not found' };
      if (!fs.existsSync(destinationDir)) fs.mkdirSync(destinationDir, { recursive: true });
      
      const fileName = path.basename(sourcePath);
      const destPath = path.join(destinationDir, fileName);
      
      fs.renameSync(sourcePath, destPath);
      return { success: true, message: `Moved file to ${destPath}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  read_file_safe: async (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }

      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      const actualType = await getFileType(filePath);
      
      if (!actualType && mimeType !== 'text/plain') {
         // Some text files might not be recognized by file-type, but we allow them if mime says text
      } else if (actualType && !actualType.mime.includes('text') && !mimeType.includes('text')) {
         return { 
           success: true, 
           type: 'binary', 
           info: `File is a binary (${actualType.mime}). Size: ${fs.statSync(filePath).size} bytes.` 
         };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, type: 'text', content: content.substring(0, 50000) }; 
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
  
  start_watcher: (directory, callback) => {
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(directory, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('add', (filePath) => {
      callback({ event: 'add', path: filePath });
    });
    
    return watcher;
  }
};
