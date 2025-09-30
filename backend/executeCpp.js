const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const executeCpp = (filePath, input = '') => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    const executablePath = path.join(dir, `${fileName}.exe`);
    
    // Compile C++ file
    exec(`g++ "${filePath}" -o "${executablePath}"`, { cwd: dir }, (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        reject({
          error: compileStderr || compileError.message,
          stderr: compileStderr
        });
        return;
      }
      
      // Execute compiled binary
      const child = exec(`"${executablePath}"`, { 
        cwd: dir,
        timeout: 5000,
        maxBuffer: 1024 * 1024 // 1MB buffer
      }, (execError, stdout, stderr) => {
        // Cleanup executable file
        if (fs.existsSync(executablePath)) {
          try {
            fs.unlinkSync(executablePath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError.message);
          }
        }
        
        if (execError) {
          reject({
            error: stderr || execError.message,
            stderr: stderr
          });
          return;
        }
        
        resolve(stdout);
      });
      
      // Send input to the process if provided
      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }
    });
  });
};

module.exports = { executeCpp };