import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Home, Download, Eye } from "lucide-react";
import CodingTestCaseDetails from "@/components/CodingTestCaseDetails";
import { isValidTestResult } from "@/utils/testResultCleanup";
import jsPDF from 'jspdf';

interface TestResult {
  testId: string;
  testName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: string;
  startedAt: string;
  completedAt: string;
  mcqResults?: {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unansweredCount: number;
    accuracyRate: number;
    questions: QuestionResult[];
    performance: {
      excellent: boolean;
      good: boolean;
      average: boolean;
      needsImprovement: boolean;
    };
  };
  codingResults?: CodingResult[];
  codingStatistics?: CodingStatistics;
  hasCodingQuestions?: boolean;
  hasMCQQuestions?: boolean;
}

interface CodingResult {
  submissionId: number;
  questionNumber: number;
  questionName: string;
  problemStatement: string;
  testCasesPassed: number;
  totalTestCases: number;
  score: number;
  maxScore: number;
  language: string;
  status: string;
  grade: string;
  percentage: number;
  userCode: string;
  testResults: TestCaseResult[];
  executionTime?: number;
  memoryUsed?: number;
  errorMessage?: string;
  submittedAt: string;
  compilationError?: boolean;
  runtimeError?: boolean;
}

interface TestCaseResult {
  testCaseNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  executionTime?: number;
  status: string;
}

interface CodingStatistics {
  totalQuestions: number;
  totalTestCases: number;
  totalPassedTestCases: number;
  testCaseSuccessRate: number;
  totalScore: number;
  totalMaxScore: number;
  averageScore: number;
  questionsFullyPassed: number;
  questionsPartiallyPassed: number;
  questionsFailed: number;
}

interface QuestionResult {
  id: number;
  questionText: string;
  questionImage?: string;
  optionA: string;
  optionAImage?: string;
  optionB: string;
  optionBImage?: string;
  optionC: string;
  optionCImage?: string;
  optionD: string;
  optionDImage?: string;
  correctOption: string;
  correctOptionLetter: string;
  userAnswer?: string;
  isCorrect: boolean;
  isUnanswered: boolean;
  explanation?: string;
}

const TestResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCodingQuestion, setSelectedCodingQuestion] = useState<number | null>(null);
  const [showTestCases, setShowTestCases] = useState<{ [key: number]: boolean }>({});
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

  const downloadPDFReport = () => {
    try {
      const pdf = new jsPDF();
      let y = 30;
      
      pdf.setFontSize(18);
      pdf.text('TEST RESULT REPORT', 20, y);
      y += 20;
      
      // Get actual user information from auth context
      const studentName = user?.name || user?.fullName || localStorage.getItem('userName') || 'Student';
      const studentEmail = user?.email || localStorage.getItem('userEmail') || 'student@test.com';
      
      // Student Information Section with improved styling
      pdf.setFillColor(240, 248, 255); // Light blue background
      pdf.rect(15, y - 5, 180, 25, 'F');
      pdf.setDrawColor(59, 130, 246); // Blue border
      pdf.setLineWidth(0.5);
      pdf.rect(15, y - 5, 180, 25);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 64, 175); // Dark blue
      pdf.text('STUDENT INFORMATION', 20, y + 3);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81); // Dark gray
      pdf.text('Student: ' + studentName, 20, y + 12);
      pdf.text('Email: ' + studentEmail, 110, y + 12);
      y += 20;
      
      // Test Information Section
      pdf.setFillColor(254, 249, 195); // Light yellow background
      pdf.rect(15, y - 5, 180, 25, 'F');
      pdf.setDrawColor(245, 158, 11); // Yellow border
      pdf.rect(15, y - 5, 180, 25);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(146, 64, 14); // Dark yellow/orange
      pdf.text('TEST INFORMATION', 20, y + 3);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      pdf.text('Test: ' + (testName || 'Test'), 20, y + 12);
      pdf.text('Date: ' + new Date().toLocaleDateString(), 110, y + 12);
      pdf.text('Time: ' + new Date().toLocaleTimeString(), 20, y + 20);
      y += 30;
      
      // Overall Results Section with enhanced styling
      const resultColor = displayPercentage >= 60 ? [34, 197, 94] : [239, 68, 68]; // Green or Red
      const resultBgColor = displayPercentage >= 60 ? [240, 253, 244] : [254, 242, 242]; // Light green or light red
      
      pdf.setFillColor(resultBgColor[0], resultBgColor[1], resultBgColor[2]);
      pdf.rect(15, y - 5, 180, 40, 'F');
      pdf.setDrawColor(resultColor[0], resultColor[1], resultColor[2]);
      pdf.setLineWidth(1);
      pdf.rect(15, y - 5, 180, 40);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
      pdf.text('OVERALL RESULTS', 20, y + 5);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      pdf.text('Score: ' + totalScore + '/' + maxScore, 20, y + 16);
      pdf.text('Percentage: ' + displayPercentage + '%', 110, y + 16);
      pdf.text('Grade: ' + getGradeLetter(displayPercentage), 20, y + 26);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
      pdf.text('Status: ' + (displayPercentage >= 60 ? 'PASS ✓' : 'FAIL ✗'), 110, y + 26);
      
      y += 50;
      
      // MCQ Summary
      if (result.mcqResults && result.mcqResults.totalQuestions > 0) {
        pdf.setFontSize(14);
        pdf.text('MCQ SECTION SUMMARY', 20, y);
        y += 10;
        
        pdf.setFontSize(12);
        pdf.text('Total MCQ Questions: ' + result.mcqResults.totalQuestions, 20, y);
        y += 8;
        pdf.text('Correct Answers: ' + result.mcqResults.correctAnswers, 20, y);
        y += 8;
        pdf.text('Wrong Answers: ' + (result.mcqResults.totalQuestions - result.mcqResults.correctAnswers - result.mcqResults.unansweredCount), 20, y);
        y += 8;
        pdf.text('Unanswered Questions: ' + result.mcqResults.unansweredCount, 20, y);
        y += 8;
        pdf.text('MCQ Accuracy Rate: ' + Math.round((result.mcqResults.correctAnswers / result.mcqResults.totalQuestions) * 100) + '%', 20, y);
        y += 15;
        
        // MCQ Questions Details
        if (result.mcqResults.questions && result.mcqResults.questions.length > 0) {
          pdf.setFontSize(14);
          pdf.text('MCQ QUESTIONS BREAKDOWN', 20, y);
          y += 10;
          
          result.mcqResults.questions.forEach((q, i) => {
            if (y > 240) {
              pdf.addPage();
              y = 20;
            }
            
            pdf.setFontSize(11);
            pdf.text('Q' + (i + 1) + ': ' + q.questionText.substring(0, 80), 20, y);
            y += 8;
            
            pdf.setFontSize(10);
            pdf.text('A) ' + (q.optionA || '').substring(0, 60), 25, y);
            y += 6;
            pdf.text('B) ' + (q.optionB || '').substring(0, 60), 25, y);
            y += 6;
            pdf.text('C) ' + (q.optionC || '').substring(0, 60), 25, y);
            y += 6;
            pdf.text('D) ' + (q.optionD || '').substring(0, 60), 25, y);
            y += 8;
            
            pdf.text('Your Answer: ' + (q.userAnswer || 'Not Answered'), 25, y);
            y += 6;
            pdf.text('Correct Answer: ' + q.correctOptionLetter, 25, y);
            y += 6;
            pdf.text('Result: ' + (q.isUnanswered ? 'UNANSWERED' : q.isCorrect ? 'CORRECT' : 'WRONG'), 25, y);
            y += 6;
            pdf.text('Points: ' + (q.isCorrect ? '1/1' : '0/1'), 25, y);
            y += 6;
            
            // Add explanation
            pdf.setFontSize(9);
            const explanation = q.explanation || `The correct answer is ${q.correctOptionLetter}. ${q.isCorrect ? 'Well done!' : 'Review this topic for better understanding.'}`;
            const lines = pdf.splitTextToSize('Explanation: ' + explanation, 170);
            pdf.text(lines, 25, y);
            y += lines.length * 4 + 8;
          });
          y += 10;
        }
      }
      
      // Coding Summary
      if (result.codingResults && result.codingResults.length > 0) {
        pdf.setFontSize(14);
        pdf.text('CODING SECTION SUMMARY', 20, y);
        y += 10;
        
        const totalCodingQuestions = result.codingResults.length;
        const totalTestCases = result.codingResults.reduce((sum, cr) => sum + cr.totalTestCases, 0);
        const passedTestCases = result.codingResults.reduce((sum, cr) => sum + cr.testCasesPassed, 0);
        const failedTestCases = totalTestCases - passedTestCases;
        const codingScore = result.codingResults.reduce((sum, cr) => sum + cr.score, 0);
        const maxCodingScore = result.codingResults.reduce((sum, cr) => sum + cr.maxScore, 0);
        const successRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;
        const questionsFullyPassed = result.codingResults.filter(cr => cr.testCasesPassed === cr.totalTestCases).length;
        const questionsPartiallyPassed = result.codingResults.filter(cr => cr.testCasesPassed > 0 && cr.testCasesPassed < cr.totalTestCases).length;
        const questionsFailed = result.codingResults.filter(cr => cr.testCasesPassed === 0).length;
        
        pdf.setFontSize(12);
        pdf.text('Total Coding Questions: ' + totalCodingQuestions, 20, y);
        y += 8;
        pdf.text('Questions Fully Passed: ' + questionsFullyPassed, 20, y);
        y += 8;
        pdf.text('Questions Partially Passed: ' + questionsPartiallyPassed, 20, y);
        y += 8;
        pdf.text('Questions Failed: ' + questionsFailed, 20, y);
        y += 8;
        pdf.text('Total Test Cases: ' + totalTestCases, 20, y);
        y += 8;
        pdf.text('Test Cases Passed: ' + passedTestCases, 20, y);
        y += 8;
        pdf.text('Test Cases Failed: ' + failedTestCases, 20, y);
        y += 8;
        pdf.text('Test Case Success Rate: ' + successRate + '%', 20, y);
        y += 8;
        pdf.text('Total Coding Score: ' + codingScore + '/' + maxCodingScore, 20, y);
        y += 15;
        
        // Individual coding questions detailed breakdown
        pdf.setFontSize(14);
        pdf.text('CODING QUESTIONS DETAILED BREAKDOWN', 20, y);
        y += 10;
        
        result.codingResults.forEach((cr, i) => {
          if (y > 220) {
            pdf.addPage();
            y = 20;
          }
          
          pdf.setFontSize(12);
          pdf.text('Question ' + (i + 1) + ': ' + cr.questionName, 20, y);
          y += 10;
          
          pdf.setFontSize(10);
          pdf.text('Programming Language: ' + cr.language, 25, y);
          y += 6;
          pdf.text('Problem Statement: ' + (cr.problemStatement || 'N/A').substring(0, 80), 25, y);
          y += 6;
          pdf.text('Test Cases Passed: ' + cr.testCasesPassed + '/' + cr.totalTestCases, 25, y);
          y += 6;
          pdf.text('Test Cases Failed: ' + (cr.totalTestCases - cr.testCasesPassed) + '/' + cr.totalTestCases, 25, y);
          y += 6;
          pdf.text('Success Percentage: ' + cr.percentage + '%', 25, y);
          y += 6;
          pdf.text('Marks Earned: ' + cr.score + '/' + cr.maxScore, 25, y);
          y += 6;
          pdf.text('Grade Assigned: ' + cr.grade, 25, y);
          y += 6;
          pdf.text('Overall Status: ' + cr.status, 25, y);
          y += 6;
          
          // Add coding explanation
          pdf.setFontSize(8);
          let explanation = '';
          if (cr.percentage === 100) {
            explanation = 'Excellent! All test cases passed. Your solution is correct and efficient.';
          } else if (cr.percentage >= 80) {
            explanation = 'Good work! Most test cases passed. Consider edge cases for improvement.';
          } else if (cr.percentage >= 60) {
            explanation = 'Partial success. Review your logic for failed test cases.';
          } else if (cr.percentage > 0) {
            explanation = 'Some test cases passed. Check your algorithm and implementation.';
          } else {
            explanation = 'No test cases passed. Review the problem requirements and your approach.';
          }
          
          const expLines = pdf.splitTextToSize('Explanation: ' + explanation, 170);
          pdf.text(expLines, 25, y);
          y += expLines.length * 3 + 8;
          
          // Individual test case results
          if (cr.testResults && cr.testResults.length > 0) {
            pdf.text('Test Case Results:', 25, y);
            y += 6;
            cr.testResults.forEach((tc, tcIndex) => {
              if (y > 270) {
                pdf.addPage();
                y = 20;
              }
              pdf.setFontSize(9);
              pdf.text('  Test Case ' + (tcIndex + 1) + ': ' + (tc.passed ? 'PASS' : 'FAIL'), 30, y);
              y += 5;
            });
            y += 3;
          }
          
          if (cr.executionTime) {
            pdf.setFontSize(10);
            pdf.text('Execution Time: ' + cr.executionTime + 'ms', 25, y);
            y += 6;
          }
          
          if (cr.memoryUsed) {
            pdf.text('Memory Used: ' + cr.memoryUsed + 'KB', 25, y);
            y += 6;
          }
          
          y += 8;
        });
      }
      
      // Add summary footer
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text('FINAL SUMMARY', 20, y);
      y += 10;
      
      pdf.setFontSize(12);
      pdf.text('Overall Score: ' + totalScore + '/' + maxScore + ' (' + displayPercentage + '%)', 20, y);
      y += 8;
      pdf.text('Final Grade: ' + getGradeLetter(displayPercentage), 20, y);
      y += 8;
      pdf.text('Result: ' + (displayPercentage >= 60 ? 'PASSED' : 'FAILED'), 20, y);
      y += 8;
      pdf.text('Generated on: ' + new Date().toLocaleString(), 20, y);
      
      pdf.save('Test_Report_' + (testName.replace(/\s+/g, '_')) + '.pdf');
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Error generating PDF');
    }
  };

  const downloadDetailedReport = async () => {
    if (!result) return;
    
    try {
      const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId');
      const response = await fetch(`http://localhost:5000/api/test-result/${testId}/student/${studentId}/download-report?format=json`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.testName.replace(/\s+/g, '_')}_Detailed_Report.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading detailed report:', error);
    }
  };

  const toggleTestCases = (questionIndex: number) => {
    setShowTestCases(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50';
    if (grade === 'D') return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    if (status === 'All Passed') return 'bg-green-100 text-green-800';
    if (status === 'Partially Passed' || status === 'Some Passed') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        // Check for invalid testId first
        if (!testId || testId === 'test' || testId.trim() === '') {
          console.log('Invalid testId detected:', testId);
          setLoading(false);
          return;
        }
        
        // First try localStorage for immediate results
        console.log('Looking for localStorage key:', `test_result_${testId}`);
        const localResult = localStorage.getItem(`test_result_${testId}`);
        if (localResult) {
          try {
            const parsed = JSON.parse(localResult);
            console.log('Found localStorage result:', parsed);
            const basicResult = {
              testId: testId,
              testName: parsed.testName || 'Test Result',
              totalScore: parsed.totalScore || 0,
              maxScore: parsed.maxScore || 0,
              percentage: parsed.percentage || Math.round((parsed.totalScore / parsed.maxScore) * 100) || 0,
              status: 'completed',
              completedAt: new Date().toISOString(),
              mcqResults: parsed.mcqResults,
              codingResults: parsed.codingResults,
              mcqAnswers: parsed.mcqAnswers
            };
            setResult(basicResult);
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing localStorage result:', error);
          }
        } else {
          console.log('No localStorage result found for key:', `test_result_${testId}`);
          // Check all localStorage keys to see what's available
          const allKeys = Object.keys(localStorage).filter(key => key.startsWith('test_result_'));
          console.log('Available test result keys:', allKeys);
        }
        
        // Try to get studentId from localStorage or session
        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId') || 'default';

        // Fetch comprehensive test results from database API
        try {
          const response = await fetch(`http://localhost:5000/api/test-results/test/${testId}/student/${studentId}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.testResult) {
              console.log('Fetched test results from database:', data.testResult);
              setResult(data.testResult);
              setLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.log('Primary API failed:', apiError);
        }
        
        // Fallback to old API
        try {
          const fallbackResponse = await fetch(`http://localhost:5000/api/test-result/${testId}/student/${studentId}`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.success && fallbackData.results) {
              setResult(fallbackData.results);
              setLoading(false);
              return;
            }
          }
        } catch (fallbackError) {
          console.log('Fallback API failed:', fallbackError);
        }
        
      } catch (error) {
        console.error('Error fetching test results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [testId]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="p-6 text-center">Loading results...</div>
      </StudentLayout>
    );
  }

  // Debug logging
  console.log('TestResult validation check:', {
    testId,
    hasResult: !!result,
    testName: result?.testName,
    totalScore: result?.totalScore,
    maxScore: result?.maxScore,
    isValid: result ? isValidTestResult(result) : false
  });

  // Only check for truly invalid cases - be more lenient
  if (!testId || testId === 'test' || testId.trim() === '') {
    console.log('Invalid testId detected:', testId);
    return (
      <StudentLayout>
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Invalid Test ID</h2>
          <p className="text-gray-600 mb-4">Please return to tests and try again.</p>
          <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
        </div>
      </StudentLayout>
    );
  }
  
  // Show loading if still fetching
  if (!result && !loading) {
    console.log('No result found, checking localStorage for testId:', testId);
    
    // Try multiple localStorage key formats
    let localResult = localStorage.getItem(`test_result_${testId}`);
    
    // If not found, try to find any key that contains the testId
    if (!localResult) {
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('test_result_'));
      console.log('Searching through available keys:', allKeys);
      
      // Look for a key that contains the testId
      const matchingKey = allKeys.find(key => key.includes(testId));
      if (matchingKey) {
        console.log('Found matching key:', matchingKey);
        localResult = localStorage.getItem(matchingKey);
      }
    }
    
    if (localResult) {
      try {
        const parsed = JSON.parse(localResult);
        console.log('Found localStorage result:', parsed);
        // Create a basic result structure
        const basicResult = {
          testId: testId,
          testName: parsed.testName || 'Test Result',
          totalScore: parsed.totalScore || 0,
          maxScore: parsed.maxScore || 0,
          percentage: parsed.percentage || Math.round((parsed.totalScore / parsed.maxScore) * 100) || 0,
          status: 'completed',
          completedAt: new Date().toISOString(),
          mcqResults: parsed.mcqResults,
          codingResults: parsed.codingResults,
          mcqAnswers: parsed.mcqAnswers
        };
        setResult(basicResult);
        return;
      } catch (error) {
        console.error('Error parsing localStorage result:', error);
      }
    }
    
    return (
      <StudentLayout>
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">No Results Found</h2>
          <p className="text-gray-600 mb-4">Unable to load test results. Please try again.</p>
          <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
        </div>
      </StudentLayout>
    );
  }

  // Debug logging
  console.log('TestResult - Full result object:', result);
  console.log('TestResult - Scores:', {
    totalScore: result.totalScore,
    maxScore: result.maxScore,
    percentage: result.percentage
  });

  // Handle missing data with fallbacks
  const totalScore = result.totalScore ?? 0;
  const maxScore = result.maxScore ?? result.mcqResults?.totalQuestions ?? 0;
  const percentage = result.percentage ?? 0;
  
  // Calculate percentage if not provided
  const calculatedPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const displayPercentage = percentage > 0 ? percentage : calculatedPercentage;
  
  // Ensure we have a valid test name
  const testName = result.testName || `Test ${testId}` || 'Test Result';
  
  console.log('TestResult - Display values:', {
    totalScore,
    maxScore,
    percentage,
    calculatedPercentage,
    displayPercentage
  });

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">🎉 Test Completed!</CardTitle>
            <p className="text-blue-100 text-xl">{testName}</p>
            <p className="text-sm text-blue-200">
              {result.completedAt && `Completed on ${new Date(result.completedAt).toLocaleString()}`}
            </p>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{displayPercentage}%</div>
              <div className="text-xl mb-4">
                {displayPercentage >= 60 ? '🎊 CONGRATULATIONS! YOU PASSED!' : '📚 KEEP PRACTICING!'}
              </div>
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={downloadPDFReport} 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF Report
                </Button>
                <Button 
                  onClick={() => navigate('/student/assessment')} 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3"
                  size="lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Back to Tests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">📊 Your Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{totalScore}/{maxScore}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div className={`p-4 rounded-lg ${getGradeColor(getGradeLetter(displayPercentage))}`}>
                <div className="text-3xl font-bold">{displayPercentage}%</div>
                <div className="text-sm">Percentage</div>
              </div>
              <div className={`p-4 rounded-lg ${getGradeColor(getGradeLetter(displayPercentage))}`}>
                <div className="text-3xl font-bold">{getGradeLetter(displayPercentage)}</div>
                <div className="text-sm">Grade</div>
              </div>
              <div className={`p-4 rounded-lg ${
                displayPercentage >= 60 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`text-3xl font-bold ${
                  displayPercentage >= 60 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {displayPercentage >= 60 ? '✅ PASS' : '❌ FAIL'}
                </div>
                <div className="text-sm text-gray-600">Final Result</div>
                <div className="text-xs text-gray-500 mt-1">
                  {displayPercentage >= 60 ? 'Congratulations!' : 'Keep practicing!'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MCQ Performance Summary */}
        {result.mcqResults && result.mcqResults.totalQuestions > 0 ? (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  📝 MCQ Performance Overview
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.mcqResults.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.mcqResults.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {result.mcqResults.totalQuestions - result.mcqResults.correctAnswers - result.mcqResults.unansweredCount}
                  </div>
                  <div className="text-sm text-gray-600">Wrong Answers</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{result.mcqResults.unansweredCount}</div>
                  <div className="text-sm text-gray-600">Unanswered</div>
                </div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold">
                  Accuracy Rate: {result.mcqResults.totalQuestions > 0 ? 
                    Math.round((result.mcqResults.correctAnswers / result.mcqResults.totalQuestions) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">
                  {result.mcqResults.correctAnswers} out of {result.mcqResults.totalQuestions} questions answered correctly
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Show overall results when no detailed MCQ data is available
          !result.hasCodingQuestions && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    📊 OVERALL RESULTS
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalScore}/{maxScore}</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{totalScore}</div>
                    <div className="text-sm text-gray-600">Correct Answers</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{Math.max(0, maxScore - totalScore)}</div>
                    <div className="text-sm text-gray-600">Wrong Answers</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-sm text-gray-600">Unanswered</div>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold">
                    Percentage: {displayPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {displayPercentage >= 60 ? 'PASS' : 'FAIL'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* MCQ Questions Review - Only show if there are MCQ questions */}
        {result.mcqResults?.questions && result.mcqResults.questions.length > 0 && !result.hasCodingQuestions ? (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">MCQ Questions Review</h3>
            {result.mcqResults.questions.map((question, index) => {
              const questionStatus = !question.userAnswer ? 'unanswered' : 
                                   question.isCorrect ? 'correct' : 'wrong';
              const statusColor = questionStatus === 'correct' ? 'border-green-500 bg-green-50' :
                                 questionStatus === 'wrong' ? 'border-red-500 bg-red-50' :
                                 'border-orange-500 bg-orange-50';
              
              return (
                <Card key={question.id} className={`border-l-4 ${statusColor}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            Q{index + 1}
                          </span>
                          {question.questionText}
                        </CardTitle>
                        {question.questionImage && (
                          <div className="mt-3">
                            <img 
                              src={question.questionImage} 
                              alt="Question" 
                              className="max-w-full h-auto rounded border shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={
                          questionStatus === 'correct' ? 'bg-green-100 text-green-800' :
                          questionStatus === 'wrong' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }>
                          {questionStatus === 'unanswered' ? (
                            <span className="flex items-center gap-1">⚠️ Unanswered</span>
                          ) : questionStatus === 'correct' ? (
                            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Correct</span>
                          ) : (
                            <span className="flex items-center gap-1"><XCircle className="w-4 h-4" /> Wrong</span>
                          )}
                        </Badge>
                        {questionStatus === 'correct' && (
                          <span className="text-xs text-green-600 font-medium">+1 Point</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {["A", "B", "C", "D"].map((option) => {
                          const optionText = question[`option${option}` as keyof QuestionResult] as string;
                          const isCorrect = question.correctOptionLetter === option;
                          const isUserAnswer = question.userAnswer === option;
                          
                          let className = "p-3 border rounded-lg transition-colors";
                          if (isCorrect) {
                            className += " bg-green-100 border-green-300 shadow-sm";
                          } else if (isUserAnswer && !isCorrect) {
                            className += " bg-red-100 border-red-300 shadow-sm";
                          } else {
                            className += " bg-gray-50 border-gray-200";
                          }
                          
                          return (
                            <div key={option} className={className}>
                              <div className="flex items-start gap-3">
                                <span className="font-semibold text-gray-700 min-w-[24px]">{option})</span>
                                <div className="flex-1">
                                  <div className="text-gray-800">{optionText}</div>
                                  {question[`option${option}Image` as keyof QuestionResult] && (
                                    <img 
                                      src={question[`option${option}Image` as keyof QuestionResult] as string} 
                                      alt={`Option ${option}`} 
                                      className="mt-2 max-w-xs h-auto rounded border shadow-sm"
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {isCorrect && (
                                    <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4" /> Correct Answer
                                    </span>
                                  )}
                                  {isUserAnswer && !isCorrect && (
                                    <span className="text-red-600 font-semibold text-sm flex items-center gap-1">
                                      <XCircle className="w-4 h-4" /> Your Choice
                                    </span>
                                  )}
                                  {!question.userAnswer && isCorrect && (
                                    <span className="text-orange-600 font-semibold text-sm flex items-center gap-1">
                                      ⚠️ Missed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Answer Analysis */}
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-blue-800 min-w-[80px]">Analysis:</span>
                          <div className="flex-1">
                            {questionStatus === 'correct' && (
                              <p className="text-green-700">
                                ✅ <strong>Correct!</strong> You selected the right answer ({question.correctOptionLetter}).
                              </p>
                            )}
                            {questionStatus === 'wrong' && (
                              <p className="text-red-700">
                                ❌ <strong>Incorrect.</strong> You selected {question.userAnswer}, but the correct answer is {question.correctOptionLetter}.
                              </p>
                            )}
                            {questionStatus === 'unanswered' && (
                              <p className="text-orange-700">
                                ⚠️ <strong>Not Answered.</strong> The correct answer is {question.correctOptionLetter}.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Explanation */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-800 min-w-[80px]">Explanation:</span>
                          <div className="flex-1 text-gray-700">
                            {question.explanation || `The correct answer is ${question.correctOptionLetter}) ${question.correctOption}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // Show message when no MCQ questions but test has other content
          result.hasMCQQuestions === false && result.hasCodingQuestions && (
            <Card className="border-l-4 border-l-gray-300">
              <CardContent className="pt-6">
                <div className="text-center text-gray-600">
                  <p>This test contains only coding questions. MCQ section not applicable.</p>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Coding Statistics */}
        {result.codingResults && result.codingResults.length > 0 && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  💻 Coding Performance Overview
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const totalCodingQuestions = result.codingResults.length;
                const totalTestCases = result.codingResults.reduce((sum, cr) => sum + cr.totalTestCases, 0);
                const passedTestCases = result.codingResults.reduce((sum, cr) => sum + cr.testCasesPassed, 0);
                const failedTestCases = totalTestCases - passedTestCases;
                const successRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;
                const codingScore = result.codingResults.reduce((sum, cr) => sum + cr.score, 0);
                const maxCodingScore = result.codingResults.reduce((sum, cr) => sum + cr.maxScore, 0);
                const questionsFullyPassed = result.codingResults.filter(cr => cr.testCasesPassed === cr.totalTestCases).length;
                const questionsPartiallyPassed = result.codingResults.filter(cr => cr.testCasesPassed > 0 && cr.testCasesPassed < cr.totalTestCases).length;
                const questionsFailed = result.codingResults.filter(cr => cr.testCasesPassed === 0).length;
                
                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{totalCodingQuestions}</div>
                        <div className="text-sm text-gray-600">Total Questions</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{questionsFullyPassed}</div>
                        <div className="text-sm text-gray-600">Fully Passed</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{questionsPartiallyPassed}</div>
                        <div className="text-sm text-gray-600">Partially Passed</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{questionsFailed}</div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{passedTestCases}</div>
                        <div className="text-sm text-gray-600">Test Cases Passed</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{failedTestCases}</div>
                        <div className="text-sm text-gray-600">Test Cases Failed</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{totalTestCases}</div>
                        <div className="text-sm text-gray-600">Total Test Cases</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">{successRate}%</div>
                        <div className="text-sm text-gray-600">Test Case Success Rate</div>
                        <div className="text-xs text-gray-500 mt-1">{passedTestCases}/{totalTestCases} test cases passed</div>
                      </div>
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <div className="text-3xl font-bold text-indigo-600">{codingScore}/{maxCodingScore}</div>
                        <div className="text-sm text-gray-600">Coding Score</div>
                        <div className="text-xs text-gray-500 mt-1">{maxCodingScore > 0 ? Math.round((codingScore / maxCodingScore) * 100) : 0}% of total marks</div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Coding Questions Review */}
        {result.codingResults && result.codingResults.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              💻 Coding Questions Results
              <Badge variant="outline" className="text-xs">
                {result.codingResults.length} Question{result.codingResults.length > 1 ? 's' : ''}
              </Badge>
            </h3>
            {result.codingResults.map((codingResult, index) => (
              <Card key={index} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          Q{index + 1}: {codingResult.questionName}
                        </span>
                        <span className="text-gray-600">({codingResult.language})</span>
                        <Badge className={`${getGradeColor(codingResult.grade)} border-0`}>
                          Grade: {codingResult.grade}
                        </Badge>
                      </CardTitle>
                      <p className="text-gray-600 mt-2 text-sm">{codingResult.problemStatement}</p>
                    </div>
                    <Badge className={getStatusColor(codingResult.status)}>
                      {codingResult.status === 'All Passed' ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      {codingResult.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* Test Cases Passed */}
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {codingResult.testCasesPassed}/{codingResult.totalTestCases}
                      </div>
                      <div className="text-sm text-gray-600">Test Cases</div>
                      <div className="text-xs text-gray-500 mt-1">{codingResult.percentage}% Success</div>
                    </div>
                    
                    {/* Score Earned */}
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {codingResult.score}/{codingResult.maxScore}
                      </div>
                      <div className="text-sm text-gray-600">Score</div>
                      <div className="text-xs text-gray-500 mt-1">Points Earned</div>
                    </div>
                    
                    {/* Execution Time */}
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {codingResult.executionTime || 0}ms
                      </div>
                      <div className="text-sm text-gray-600">Execution Time</div>
                      <div className="text-xs text-gray-500 mt-1">Runtime</div>
                    </div>
                    
                    {/* Memory Usage */}
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {codingResult.memoryUsed || 0}KB
                      </div>
                      <div className="text-sm text-gray-600">Memory Used</div>
                      <div className="text-xs text-gray-500 mt-1">Peak Usage</div>
                    </div>
                  </div>

                  {/* Error Messages */}
                  {codingResult.errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-800 mb-1">
                        {codingResult.compilationError ? '🔧 Compilation Error:' : 
                         codingResult.runtimeError ? '⚠️ Runtime Error:' : '❌ Error:'}
                      </div>
                      <div className="text-sm text-red-700 font-mono">{codingResult.errorMessage}</div>
                    </div>
                  )}

                  {/* Test Cases Details */}
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleTestCases(index)}
                      className="w-full"
                    >
                      {showTestCases[index] ? 'Hide' : 'Show'} Test Cases Details
                    </Button>
                    
                    {showTestCases[index] && codingResult.testResults && (
                      <div className="space-y-3 mt-3">
                        {codingResult.testResults.map((testCase, tcIndex) => (
                          <div key={tcIndex} className={`p-3 rounded-lg border ${
                            testCase.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                Test Case {testCase.testCaseNumber}
                              </span>
                              <Badge variant={testCase.passed ? "default" : "destructive"}>
                                {testCase.passed ? 'PASS' : 'FAIL'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="font-medium text-gray-700">Input:</div>
                                <div className="bg-white p-2 rounded border font-mono">
                                  {testCase.input || 'No input'}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700">Expected:</div>
                                <div className="bg-white p-2 rounded border font-mono">
                                  {testCase.expectedOutput || 'No expected output'}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700">Your Output:</div>
                                <div className={`p-2 rounded border font-mono ${
                                  testCase.passed ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                  {testCase.actualOutput || 'No output'}
                                </div>
                              </div>
                            </div>
                            {testCase.error && (
                              <div className="mt-2">
                                <div className="font-medium text-red-700 text-xs">Error:</div>
                                <div className="bg-red-100 p-2 rounded border text-xs font-mono text-red-800">
                                  {testCase.error}
                                </div>
                              </div>
                            )}
                            {testCase.executionTime && (
                              <div className="mt-1 text-xs text-gray-600">
                                Execution Time: {testCase.executionTime}ms
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCodingQuestion(
                        selectedCodingQuestion === index ? null : index
                      )}
                      className="flex-1"
                    >
                      {selectedCodingQuestion === index ? 'Hide' : 'Show'} Your Code
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedSubmissionId(codingResult.submissionId)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                  
                  {/* User Code Preview */}
                  {selectedCodingQuestion === index && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Your Solution ({codingResult.language}):</div>
                      <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                        <code>{codingResult.userCode}</code>
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Additional Actions */}
        {result.hasCodingQuestions && (
          <div className="text-center">
            <Button onClick={downloadDetailedReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Detailed Coding Report
            </Button>
          </div>
        )}
        
        {/* Coding Test Case Details Modal */}
        {selectedSubmissionId && (
          <CodingTestCaseDetails 
            submissionId={selectedSubmissionId}
            onClose={() => setSelectedSubmissionId(null)}
          />
        )}
      </div>
    </StudentLayout>
  );
};

export default TestResult;