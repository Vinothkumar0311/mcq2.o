const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { executeJava } = require('../../executeJava');
const { executePython } = require('../../executePython');
const { executeCpp } = require('../../executeCpp');
const { sanitizeFilePath, sanitizeForLog } = require('./security');

const TEMP_DIR = path.join(__dirname, '../temp');
const TIMEOUT = 5000; // 5 seconds

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const executeCode = async (code, language, input = '', timeLimit = 2000) => {
  const sessionId = uuidv4();
  const startTime = Date.now();
  
  try {
    // Validate inputs
    if (typeof code !== 'string' || typeof language !== 'string') {
      throw new Error('Invalid input types');
    }
    
    // Sanitize code to prevent malicious content
    if (code.includes('eval(') || code.includes('exec(') || code.includes('import os') || code.includes('import subprocess')) {
      throw new Error('Potentially dangerous code detected');
    }
    
    // Check compiler availability first
    const compilerCheck = await checkCompilerAvailability(language);
    if (!compilerCheck.available) {
      return {
        success: false,
        output: '',
        error: compilerCheck.error,
        executionTime: 0,
        compilerError: true
      };
    }
    
    let result;
    
    switch (language.toLowerCase()) {
      case 'java':
        result = await executeJavaCode(code, input, sessionId, timeLimit);
        break;
      case 'python':
      case 'python3':
        result = await executePythonCode(code, input, sessionId, timeLimit);
        break;
      case 'c++':
      case 'cpp':
        result = await executeCppCode(code, input, sessionId, timeLimit);
        break;
      case 'c':
        result = await executeCCode(code, input, sessionId, timeLimit);
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
    
    const executionTime = Date.now() - startTime;
    return {
      ...result,
      executionTime
    };
    
  } catch (error) {
    console.error('Code execution error:', sanitizeForLog(error.message));
    return {
      success: false,
      output: '',
      error: error.message || 'Execution failed',
      executionTime: Date.now() - startTime,
      runtimeError: true
    };
  } finally {
    // Cleanup temp files
    cleanupTempFiles(sessionId);
  }
};

const executeJavaCode = async (code, input, sessionId, timeLimit) => {
  try {
    // Check if Java is available
    const { exec } = require('child_process');
    const checkJava = () => {
      return new Promise((resolve) => {
        exec('javac -version', (error) => {
          resolve(!error);
        });
      });
    };
    
    const javaAvailable = await checkJava();
    if (!javaAvailable) {
      return {
        success: false,
        output: '',
        error: 'Java compiler (javac) not found. Please install Java JDK and ensure it is in your PATH.'
      };
    }
    
    // Fix common Java issues
    let modifiedCode = code;
    
    // Extract or set class name
    const classNameMatch = modifiedCode.match(/public\s+class\s+(\w+)/);
    let className = classNameMatch ? classNameMatch[1] : 'Main';
    
    // Handle class definition issues
    const nonPublicClassMatch = modifiedCode.match(/^\s*class\s+(\w+)/m);
    
    if (!classNameMatch && nonPublicClassMatch) {
      // Non-public class found, make it public
      const originalClassName = nonPublicClassMatch[1];
      modifiedCode = modifiedCode.replace(/^(\s*)class\s+(\w+)/m, '$1public class $2');
      className = originalClassName;
    } else if (!classNameMatch && !nonPublicClassMatch) {
      // No class found, wrap in Main class
      modifiedCode = `public class Main {\n${modifiedCode}\n}`;
      className = 'Main';
    }
    
    // Fix main method signature issues
    // First, handle Main -> main conversion
    modifiedCode = modifiedCode.replace(/public\s+static\s+void\s+Main\s*\(/g, 'public static void main(');
    
    // Fix missing public modifier
    modifiedCode = modifiedCode.replace(/^(\s*)static\s+void\s+main\s*\(/gm, '$1public static void main(');
    
    // Fix parameter signature
    modifiedCode = modifiedCode.replace(
      /public\s+static\s+void\s+main\s*\(\s*String\s+args\[\]\s*\)/g, 
      'public static void main(String[] args)'
    );
    modifiedCode = modifiedCode.replace(
      /public\s+static\s+void\s+main\s*\(\s*\)/g, 
      'public static void main(String[] args)'
    );
    
    // Add Scanner import if needed
    if (modifiedCode.includes('Scanner') && !modifiedCode.includes('import java.util.Scanner')) {
      modifiedCode = 'import java.util.Scanner;\n' + modifiedCode;
    }
    
    const fileName = `${className}.java`;
    const filePath = sanitizeFilePath(path.join(TEMP_DIR, fileName), TEMP_DIR);
    
    fs.writeFileSync(filePath, modifiedCode);
    
    const output = await executeJava(filePath, input);
    return {
      success: true,
      output: output.trim(),
      error: ''
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.stderr || error.error || error.message || 'Java execution failed'
    };
  }
};

const executePythonCode = async (code, input, sessionId, timeLimit) => {
  try {
    const fileName = `${sessionId}.py`;
    const filePath = sanitizeFilePath(path.join(TEMP_DIR, fileName), TEMP_DIR);
    
    fs.writeFileSync(filePath, code);
    
    // Handle input processing
    let processedInput = input;
    if (input && code.includes('input()')) {
      // Always add newline for input
      processedInput = input.includes('\n') ? input : input + '\n';
    }
    
    const output = await executePython(filePath, processedInput);
    return {
      success: true,
      output: output.trim(),
      error: ''
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.error || error.message || 'Python execution failed'
    };
  }
};

const executeCppCode = async (code, input, sessionId, timeLimit) => {
  try {
    // Add common includes if missing
    let modifiedCode = code;
    if (!modifiedCode.includes('#include <iostream>')) {
      modifiedCode = '#include <iostream>\n' + modifiedCode;
    }
    if (modifiedCode.includes('string') && !modifiedCode.includes('#include <string>')) {
      modifiedCode = '#include <string>\n' + modifiedCode;
    }
    if (!modifiedCode.includes('using namespace std')) {
      modifiedCode = modifiedCode.replace('#include <iostream>', '#include <iostream>\nusing namespace std;');
    }
    
    const fileName = `${sessionId}.cpp`;
    const filePath = sanitizeFilePath(path.join(TEMP_DIR, fileName), TEMP_DIR);
    
    fs.writeFileSync(filePath, modifiedCode);
    
    const output = await executeCpp(filePath, input);
    return {
      success: true,
      output: output.trim(),
      error: ''
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.error || error.message || 'C++ execution failed'
    };
  }
};

const executeCCode = async (code, input, sessionId, timeLimit) => {
  try {
    const fileName = `${sessionId}.c`;
    const filePath = sanitizeFilePath(path.join(TEMP_DIR, fileName), TEMP_DIR);
    
    fs.writeFileSync(filePath, code);
    
    // Use g++ for C code as well since it can compile C
    const output = await executeCpp(filePath, input);
    return {
      success: true,
      output: output.trim(),
      error: ''
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.error || error.message || 'C execution failed'
    };
  }
};

const cleanupTempFiles = (sessionId) => {
  try {
    const patterns = [
      `${sessionId}.java`,
      `${sessionId}.class`,
      `${sessionId}.py`,
      `${sessionId}.cpp`,
      `${sessionId}.c`,
      `${sessionId}`,
      `${sessionId}.exe`,
      `Main.java`,
      `Main.class`
    ];
    
    patterns.forEach(pattern => {
      const filePath = path.join(TEMP_DIR, pattern);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Cleanup error:', sanitizeForLog(error.message));
  }
};

const evaluateTestCases = async (code, language, testCases, timeLimit = 2000) => {
  const results = [];
  let totalScore = 0;
  
  for (const testCase of testCases) {
    const result = await executeCode(code, language, testCase.input, timeLimit);
    
    const passed = result.success && result.output.trim() === testCase.output.trim();
    
    results.push({
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: result.output,
      passed,
      error: result.error,
      executionTime: result.executionTime
    });
    
    if (passed) {
      totalScore++;
    }
  }
  
  return {
    results,
    totalScore,
    totalTests: testCases.length,
    percentage: testCases.length > 0 ? Math.round((totalScore / testCases.length) * 100) : 0
  };
};

// Check compiler availability
const checkCompilerAvailability = async (language) => {
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    let command;
    let errorMessage;
    
    switch (language.toLowerCase()) {
      case 'java':
        command = 'javac -version';
        errorMessage = 'Java compiler (javac) not found. Please install Java JDK.';
        break;
      case 'python':
      case 'python3':
        // Try python first (Windows), then python3
        exec('python --version', (error1) => {
          if (!error1) {
            resolve({ available: true });
          } else {
            exec('python3 --version', (error2) => {
              if (!error2) {
                resolve({ available: true });
              } else {
                resolve({ available: false, error: 'Python not found. Please install Python 3.' });
              }
            });
          }
        });
        return;
      case 'c++':
      case 'cpp':
        command = 'g++ --version';
        errorMessage = 'G++ compiler not found. Please install GCC/G++.';
        break;
      case 'c':
        command = 'gcc --version';
        errorMessage = 'GCC compiler not found. Please install GCC.';
        break;
      default:
        resolve({ available: false, error: `Unsupported language: ${language}` });
        return;
    }
    
    exec(command, (error) => {
      if (error) {
        resolve({ available: false, error: errorMessage });
      } else {
        resolve({ available: true });
      }
    });
  });
};

// Execute code with custom input
const executeWithCustomInput = async (code, language, customInput = '', timeLimit = 5000) => {
  return await executeCode(code, language, customInput, timeLimit);
};

module.exports = {
  executeCode,
  evaluateTestCases,
  executeWithCustomInput,
  checkCompilerAvailability
};