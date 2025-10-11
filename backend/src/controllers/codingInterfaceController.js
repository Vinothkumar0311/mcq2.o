const { CodingQuestion, CodeSubmission } = require('../models');
const { executeWithCustomInput, evaluateTestCases } = require('../utils/codeExecutor');

// Get coding question for interface
exports.getCodingQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const question = await CodingQuestion.findByPk(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Coding question not found'
      });
    }
    
    // Format for UI display
    const questionData = {
      questionId: question.id,
      problemStatement: question.problemStatement,
      constraints: question.constraints || 'No specific constraints',
      sampleTestCases: question.sampleTestCases || [],
      allowedLanguages: question.allowedLanguages || ['Java', 'Python', 'C++'],
      timeLimit: question.timeLimit || 2000,
      memoryLimit: question.memoryLimit || 256,
      marks: question.marks || 1
    };
    
    res.json({
      success: true,
      data: questionData
    });
    
  } catch (error) {
    console.error('Error fetching coding question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coding question'
    });
  }
};

// Execute code with custom input (Dry Run)
exports.executeCustomInput = async (req, res) => {
  try {
    const { code, language, customInput } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Code and language are required'
      });
    }
    
    console.log(`🔧 Executing ${language} code with custom input`);
    
    const result = await executeWithCustomInput(code, language, customInput || '', 5000);
    
    // Format response for UI
    const response = {
      success: result.success,
      output: result.output || '',
      error: result.error || '',
      executionTime: result.executionTime || 0,
      hasCompilationError: !!result.compilerError,
      hasRuntimeError: !!result.runtimeError,
      errorType: result.compilerError ? 'Compilation Error' : 
                 result.runtimeError ? 'Runtime Error' : 
                 result.error ? 'Execution Error' : null
    };
    
    console.log(`✅ Execution completed: ${result.success ? 'Success' : 'Failed'}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Custom execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Code execution failed',
      error: error.message,
      errorType: 'System Error'
    });
  }
};

// Run code against sample test cases (Dry Run)
exports.runSampleTests = async (req, res) => {
  try {
    const { questionId, code, language } = req.body;
    
    if (!questionId || !code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Question ID, code, and language are required'
      });
    }
    
    // Get question with sample test cases
    const question = await CodingQuestion.findByPk(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    const sampleTestCases = question.sampleTestCases || [];
    if (sampleTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No sample test cases available'
      });
    }
    
    console.log(`🧪 Running ${language} code against ${sampleTestCases.length} sample test cases`);
    
    const evaluation = await evaluateTestCases(code, language, sampleTestCases, question.timeLimit);
    
    // Format results for UI
    const testResults = evaluation.results.map((result, index) => ({
      testCaseNumber: index + 1,
      input: result.input,
      expectedOutput: result.expectedOutput,
      actualOutput: result.actualOutput,
      passed: result.passed,
      error: result.error || null,
      executionTime: result.executionTime || 0
    }));
    
    const summary = {
      totalTestCases: evaluation.totalTests,
      passedTestCases: evaluation.totalScore,
      failedTestCases: evaluation.totalTests - evaluation.totalScore,
      percentage: evaluation.percentage,
      overallStatus: evaluation.percentage === 100 ? 'All Passed' : 
                     evaluation.percentage > 0 ? 'Partial Pass' : 'All Failed'
    };
    
    console.log(`✅ Sample test completed: ${evaluation.totalScore}/${evaluation.totalTests} passed`);
    
    res.json({
      success: true,
      testResults,
      summary,
      hasErrors: evaluation.results.some(r => r.error)
    });
    
  } catch (error) {
    console.error('❌ Sample test execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run sample tests',
      error: error.message
    });
  }
};

// Submit final solution
exports.submitSolution = async (req, res) => {
  try {
    const { questionId, code, language, studentId, testId } = req.body;
    
    if (!questionId || !code || !language || !studentId || !testId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    const question = await CodingQuestion.findByPk(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Combine sample and hidden test cases
    const allTestCases = [
      ...(question.sampleTestCases || []),
      ...(question.hiddenTestCases || [])
    ];
    
    if (allTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No test cases available for evaluation'
      });
    }
    
    console.log(`📝 Submitting ${language} solution for question ${questionId}`);
    
    const evaluation = await evaluateTestCases(code, language, allTestCases, question.timeLimit);
    
    // Calculate score
    const finalScore = Math.round((evaluation.totalScore / evaluation.totalTests) * question.marks);
    const status = evaluation.percentage === 100 ? 'passed' : 'failed';
    
    // Save submission
    const submission = await CodeSubmission.create({
      studentId,
      codingQuestionId: questionId,
      testId,
      code,
      language,
      status,
      testResults: evaluation.results,
      score: finalScore,
      isDryRun: false
    });
    
    console.log(`✅ Solution submitted: ${evaluation.totalScore}/${evaluation.totalTests} test cases passed, Score: ${finalScore}/${question.marks}`);
    
    res.json({
      success: true,
      submissionId: submission.id,
      results: {
        totalTestCases: evaluation.totalTests,
        passedTestCases: evaluation.totalScore,
        failedTestCases: evaluation.totalTests - evaluation.totalScore,
        percentage: evaluation.percentage,
        score: finalScore,
        maxScore: question.marks,
        status
      }
    });
    
  } catch (error) {
    console.error('❌ Solution submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit solution',
      error: error.message
    });
  }
};