// Utility function to clean up invalid test results from localStorage
export const cleanupInvalidTestResults = () => {
  try {
    const keys = Object.keys(localStorage);
    const testResultKeys = keys.filter(key => key.startsWith('test_result_'));
    
    let cleanedCount = 0;
    
    testResultKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          
          // Check if the test result is invalid
          const invalidNames = ['dfdf', 'jkhsvf', 'test', ''];
          const isInvalidName = !parsed.testName || 
            invalidNames.includes(parsed.testName) ||
            parsed.testName.trim() === '' ||
            parsed.testName.length < 3 ||
            /^[a-z]{1,10}$/.test(parsed.testName);
            
          if (!parsed || isInvalidName ||
              (parsed.totalScore === 0 && parsed.maxScore === 0 && !parsed.mcqResults && !parsed.codingResults)) {
            
            console.log(`Removing invalid test result: ${key}`, parsed);
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing ${key}:`, error);
        // Remove corrupted data
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} invalid test results from localStorage`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Error during cleanup:', error);
    return 0;
  }
};

// Function to validate test result data
export const isValidTestResult = (result) => {
  if (!result) return false;
  
  // Check for specific invalid test names
  const invalidNames = ['dfdf', 'jkhsvf', ''];
  if (invalidNames.includes(result.testName)) return false;
  
  // Reject if no test name
  if (!result.testName || result.testName.trim() === '') return false;
  
  // Reject random lowercase letter combinations (but allow names with numbers)
  if (/^[a-z]{1,10}$/.test(result.testName) && !/\d/.test(result.testName)) return false;
  
  // Allow if has valid data structure
  const hasValidData = result.totalScore > 0 || result.maxScore > 0 ||
    (result.mcqResults && result.mcqResults.totalQuestions > 0) ||
    (result.codingResults && result.codingResults.length > 0);
  
  return hasValidData;
};

// Auto-cleanup function to run on app start
export const autoCleanupOnStart = () => {
  console.log('Running automatic cleanup of invalid test results...');
  const cleaned = cleanupInvalidTestResults();
  if (cleaned > 0) {
    console.log(`Auto-cleanup completed: ${cleaned} invalid results removed`);
  }
};