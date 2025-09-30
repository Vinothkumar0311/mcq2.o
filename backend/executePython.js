const { exec } = require('child_process');
const path = require('path');

const executePython = (filePath, input = '') => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    
    // Try python first (Windows), then python3
    const tryPython = (command) => {
      const child = exec(`${command} "${filePath}"`, { 
        cwd: dir,
        timeout: 5000,
        maxBuffer: 1024 * 1024 // 1MB buffer
      }, (execError, stdout, stderr) => {
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
      }
      child.stdin.end();
    };
    
    // Check if python command exists
    exec('python --version', (error) => {
      if (!error) {
        tryPython('python');
      } else {
        // Try python3
        exec('python3 --version', (error3) => {
          if (!error3) {
            tryPython('python3');
          } else {
            reject({
              error: 'Python not found. Please install Python 3.',
              stderr: 'Python interpreter not available'
            });
          }
        });
      }
    });
  });
};

module.exports = { executePython };