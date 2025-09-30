const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const executeJava = (filePath, input = '') => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath, '.java');
    const classPath = path.join(dir, `${fileName}.class`);
    
    // Compile Java file
    exec(`javac "${filePath}"`, { cwd: dir }, (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        reject({
          error: compileStderr || compileError.message,
          stderr: compileStderr
        });
        return;
      }
      
      // Execute compiled Java class
      const javaCommand = `java -cp "${dir}" ${fileName}`;
      const child = exec(javaCommand, { 
        cwd: dir,
        timeout: 5000,
        maxBuffer: 1024 * 1024 // 1MB buffer
      }, (execError, stdout, stderr) => {
        // Cleanup class file
        if (fs.existsSync(classPath)) {
          try {
            fs.unlinkSync(classPath);
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

module.exports = { executeJava };