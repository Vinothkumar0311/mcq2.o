/**
 * Test script to verify coding results are properly displayed
 * Run this after completing a coding test to check if results show up
 */

const axios = require('axios');

async function testCodingResultsFix() {
  try {
    console.log('🧪 Testing Coding Results Fix...\n');
    
    // Test parameters - replace with actual values
    const testId = 'TEST_ID_HERE'; // Replace with actual test ID
    const studentId = 'STUDENT_ID_HERE'; // Replace with actual student ID
    
    console.log(`📋 Testing with testId: ${testId}, studentId: ${studentId}`);
    
    // Test the fixed API endpoint
    const response = await axios.get(`http://localhost:5000/api/test-results/test/${testId}/student/${studentId}`);
    
    if (response.data.success) {
      const result = response.data.testResult;
      
      console.log('✅ API Response Success!');
      console.log(`📊 Test: ${result.testName}`);
      console.log(`🎯 Total Score: ${result.totalScore}/${result.maxScore} (${result.percentage}%)`);
      
      // Check MCQ Results
      if (result.hasMCQQuestions) {
        console.log('\n📝 MCQ Results Found:');
        console.log(`   Questions: ${result.mcqResults.totalQuestions}`);
        console.log(`   Correct: ${result.mcqResults.correctAnswers}`);
        console.log(`   Wrong: ${result.mcqResults.wrongAnswers}`);
        console.log(`   Unanswered: ${result.mcqResults.unansweredCount}`);
        console.log(`   Accuracy: ${result.mcqResults.accuracyRate}%`);
      } else {
        console.log('\n📝 No MCQ Questions in this test');
      }
      
      // Check Coding Results
      if (result.hasCodingQuestions) {
        console.log('\n💻 Coding Results Found:');
        console.log(`   Questions: ${result.codingResults.length}`);
        
        result.codingResults.forEach((cr, index) => {
          console.log(`   Q${index + 1}: ${cr.questionName}`);
          console.log(`      Language: ${cr.language}`);
          console.log(`      Test Cases: ${cr.testCasesPassed}/${cr.totalTestCases} (${cr.percentage}%)`);
          console.log(`      Score: ${cr.score}/${cr.maxScore}`);
          console.log(`      Status: ${cr.status}`);
          console.log(`      Grade: ${cr.grade}`);
          console.log(`      Code Length: ${cr.userCode ? cr.userCode.length : 0} characters`);
          console.log(`      Test Results: ${cr.testResults ? cr.testResults.length : 0} test cases`);
        });
        
        if (result.codingStatistics) {
          console.log('\n📈 Coding Statistics:');
          console.log(`   Total Test Cases: ${result.codingStatistics.totalTestCases}`);
          console.log(`   Passed Test Cases: ${result.codingStatistics.totalPassedTestCases}`);
          console.log(`   Success Rate: ${result.codingStatistics.testCaseSuccessRate}%`);
          console.log(`   Questions Fully Passed: ${result.codingStatistics.questionsFullyPassed}`);
          console.log(`   Questions Partially Passed: ${result.codingStatistics.questionsPartiallyPassed}`);
          console.log(`   Questions Failed: ${result.codingStatistics.questionsFailed}`);
        }
      } else {
        console.log('\n💻 No Coding Questions in this test');
      }
      
      console.log('\n🎉 Fix Verification Complete!');
      
      // Verify the fix worked
      if (result.hasCodingQuestions && result.codingResults.length > 0) {
        const hasUserCode = result.codingResults.some(cr => cr.userCode && cr.userCode.length > 0);
        const hasTestResults = result.codingResults.some(cr => cr.testResults && cr.testResults.length > 0);
        
        if (hasUserCode && hasTestResults) {
          console.log('✅ BUG FIX SUCCESSFUL: Coding results are now properly displayed!');
        } else {
          console.log('⚠️  PARTIAL FIX: Some coding data may still be missing');
        }
      } else {
        console.log('ℹ️  No coding questions to verify in this test');
      }
      
    } else {
      console.log('❌ API Error:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    
    console.log('\n💡 Instructions:');
    console.log('1. Make sure the backend server is running (npm run dev)');
    console.log('2. Replace TEST_ID_HERE and STUDENT_ID_HERE with actual values');
    console.log('3. Complete a coding test first to have data to display');
  }
}

// Instructions for usage
console.log('📋 CODING RESULTS FIX TEST');
console.log('==========================');
console.log('');
console.log('Before running this test:');
console.log('1. Complete a coding test in the application');
console.log('2. Note down the testId and studentId');
console.log('3. Update the testId and studentId variables in this script');
console.log('4. Run: node test-coding-results-fix.js');
console.log('');

// Run the test
testCodingResultsFix();