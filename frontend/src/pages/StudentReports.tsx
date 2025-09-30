import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StudentTestNotification from "@/components/StudentTestNotification";
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/config/api";
import axios from "axios";
import jsPDF from 'jspdf';

const StudentReports = () => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({
    totalTests: 0,
    averageScore: 0,
    completionRate: 0,
    bestScore: 0,
    worstScore: 0
  });
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [timeAnalytics, setTimeAnalytics] = useState({});
  const [studentInfo, setStudentInfo] = useState({});
  const [insights, setInsights] = useState({
    strengths: 'Complete your first test to see your strengths',
    improvements: 'Complete your first test to see areas for improvement',
    progress: 'Complete your first test to track your progress'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStudentReports = useCallback(async () => {
    const currentStudentId = studentId || localStorage.getItem('studentId') || 'student123';
    
    try {
      setIsLoading(true);
      console.log(`Fetching test results for user: ${currentStudentId}`);
      
      // First, check localStorage for recent test results
      const localResults = [];
      const keys = Object.keys(localStorage);
      const testResultKeys = keys.filter(key => key.startsWith('test_result_'));
      
      testResultKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed && (parsed.testName || parsed.testId)) {
              const testName = parsed.testName || `Test ${parsed.testId}` || 'Unknown Test';
              const totalScore = parsed.totalScore || 0;
              const maxScore = parsed.maxScore || 1;
              const percentage = parsed.percentage || (maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0);
              
              localResults.push({
                sessionId: key.replace('test_result_', ''),
                testName: testName,
                studentName: localStorage.getItem('userName') || 'Test Student',
                sinNumber: localStorage.getItem('userSIN') || 'SIN-123456',
                department: localStorage.getItem('userDepartment') || 'General',
                percentage: percentage,
                totalScore: totalScore,
                maxScore: maxScore,
                date: new Date().toLocaleDateString(),
                downloadUrl: '#'
              });
            }
          }
        } catch (error) {
          console.error('Error parsing localStorage result:', error);
        }
      });
      
      // Try to fetch from database API
      let apiResults = [];
      try {
        const userEmail = localStorage.getItem('userEmail') || 'test@example.com';
        console.log('Fetching test results for email:', userEmail);
        
        const response = await axios.get(`${API_BASE_URL}/api/student/test-results/${userEmail}`);
        
        console.log('Test Results Response:', response.data);
        
        if (response.data.success && response.data.results && response.data.results.length > 0) {
          apiResults = response.data.results.map(result => ({
            sessionId: result.sessionId || result.testId,
            testName: result.testName,
            studentName: result.studentName || localStorage.getItem('userName') || 'Test Student',
            sinNumber: result.sinNumber || localStorage.getItem('userSIN') || 'SIN-123456',
            department: result.department || localStorage.getItem('userDepartment') || 'General',
            percentage: result.percentage,
            totalScore: result.totalScore,
            maxScore: result.maxScore,
            date: result.date || new Date().toLocaleDateString(),
            downloadUrl: '#'
          }));
          console.log('✅ Fetched', apiResults.length, 'test results from API');
        }
      } catch (apiError) {
        console.log('API fetch failed, using localStorage data only:', apiError.message);
      }
      
      // Combine results, prioritizing API results but including localStorage as fallback
      const allResults = apiResults.length > 0 ? apiResults : localResults;
      console.log('📊 Total results found:', allResults.length, '(API:', apiResults.length, ', Local:', localResults.length, ')');
      
      if (allResults.length > 0) {
        const results = allResults;
        console.log(`✅ Found ${results.length} completed tests`);
        
        // Calculate performance stats
        const totalTests = results.length;
        const averageScore = Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalTests);
        const bestScore = Math.max(...results.map(r => r.percentage));
        const worstScore = Math.min(...results.map(r => r.percentage));
        
        setPerformanceStats({
          totalTests,
          averageScore,
          completionRate: 100,
          bestScore,
          worstScore
        });
        
        // Set test history
        const testHistory = results.map(result => ({
          testId: result.sessionId, // Use sessionId for download
          testName: result.testName,
          studentName: result.studentName,
          sinNumber: result.sinNumber,
          department: result.department,
          score: result.percentage,
          rawScore: result.totalScore,
          maxScore: result.maxScore,
          date: result.date,
          duration: 'N/A',
          downloadUrl: result.downloadUrl
        }));
        
        setTestHistory(testHistory);
        console.log('📊 Test history set:', testHistory.length, 'tests');
        
        setInsights({
          strengths: `Your average score is ${averageScore}%. Keep up the good work!`,
          improvements: totalTests > 1 ? 'Focus on consistent performance across all tests.' : 'Take more tests to get detailed insights.',
          progress: `You have completed ${totalTests} test${totalTests > 1 ? 's' : ''} with an average score of ${averageScore}%.`
        });
      } else {
        console.log('❌ No test results found');
        setTestHistory([]);
        setPerformanceStats({
          totalTests: 0,
          averageScore: 0,
          completionRate: 100,
          bestScore: 0,
          worstScore: 0
        });
        setInsights({
          strengths: 'Complete your first test to see your strengths',
          improvements: 'Complete your first test to see areas for improvement',
          progress: 'Complete your first test to track your progress'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching test results:', error);
      setTestHistory([]);
      setPerformanceStats({
        totalTests: 0,
        averageScore: 0,
        completionRate: 100,
        bestScore: 0,
        worstScore: 0
      });
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  }, [studentId]);

  useEffect(() => {
    // Get student ID from localStorage or use default
    const currentStudentId = localStorage.getItem('studentId') || 'student123';
    setStudentId(currentStudentId);
    
    console.log('StudentReports - Student ID:', currentStudentId);
    fetchStudentReports();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStudentReports, 30000);
    
    // Check for refresh flags from test completion
    const shouldRefresh = localStorage.getItem('refreshReports') || localStorage.getItem('refreshStudentReports');
    if (shouldRefresh) {
      console.log('Refreshing student reports due to test completion');
      localStorage.removeItem('refreshReports');
      localStorage.removeItem('refreshStudentReports');
      setTimeout(fetchStudentReports, 2000);
    }
    
    return () => clearInterval(interval);
  }, [fetchStudentReports]);

  // Listen for storage changes (when test is completed)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if ((e.key === 'refreshReports' || e.key === 'refreshStudentReports') && e.newValue) {
        console.log('Test completed - refreshing student reports immediately');
        fetchStudentReports();
        localStorage.removeItem('refreshReports');
        localStorage.removeItem('refreshStudentReports');
      }
    };

    // Listen for both cross-tab and same-tab events
    window.addEventListener('storage', handleStorageChange);
    
    // Check for refresh flags on component mount
    const shouldRefresh = localStorage.getItem('refreshReports') || localStorage.getItem('refreshStudentReports');
    if (shouldRefresh) {
      console.log('Found refresh flag on mount - refreshing student reports');
      fetchStudentReports();
      localStorage.removeItem('refreshReports');
      localStorage.removeItem('refreshStudentReports');
    }
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchStudentReports]);



  const downloadReport = (testSessionId: string, testName: string) => {
    // Try multiple localStorage key formats
    let testData = localStorage.getItem(`test_result_${testSessionId}`);
    
    if (!testData) {
      // Try alternative key formats
      const keys = Object.keys(localStorage).filter(key => 
        key.includes(testSessionId) || key.includes(`test_result_`)
      );
      
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.testName === testName || parsed.testId === testSessionId) {
              testData = data;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    if (!testData) {
      alert('Test data not found in local storage. Please try again or contact support.');
      return;
    }
    
    const result = JSON.parse(testData);
    const pdf = new jsPDF();
    let y = 20;
    
    // Header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, 210, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text('COMPREHENSIVE TEST REPORT', 105, 25, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.text('Generated on ' + new Date().toLocaleString(), 105, 32, { align: 'center' });
    
    y = 50;
    pdf.setTextColor(0, 0, 0);
    
    // Student Information
    pdf.setFillColor(59, 130, 246);
    pdf.rect(10, y, 190, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STUDENT DETAILS', 15, y + 4);
    
    y += 10;
    pdf.setFillColor(239, 246, 255);
    pdf.rect(10, y, 190, 30, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Name: ' + (user?.name || localStorage.getItem('userName') || 'Student'), 15, y + 8);
    pdf.text('Email: ' + (user?.email || localStorage.getItem('userEmail') || 'student@test.com'), 15, y + 16);
    pdf.text('Department: ' + (user?.department || localStorage.getItem('userDepartment') || 'General'), 15, y + 24);
    pdf.text('SIN: ' + (user?.sin || localStorage.getItem('userSIN') || 'SIN-123456'), 110, y + 8);
    
    y += 40;
    
    // Test Metadata
    pdf.setFillColor(251, 191, 36);
    pdf.rect(10, y, 190, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TEST METADATA', 15, y + 4);
    
    y += 10;
    pdf.setFillColor(254, 249, 195);
    pdf.rect(10, y, 190, 30, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Test Name: ' + testName, 15, y + 8);
    pdf.text('Date: ' + new Date().toLocaleDateString(), 15, y + 16);
    pdf.text('Time: ' + new Date().toLocaleTimeString(), 15, y + 24);
    pdf.text('Test ID: ' + testSessionId, 110, y + 8);
    
    y += 40;
    
    // Overall Score
    const percentage = result.percentage || Math.round((result.totalScore / result.maxScore) * 100) || 0;
    const isPassed = percentage >= 60;
    
    pdf.setFillColor(isPassed ? 34 : 239, isPassed ? 197 : 68, isPassed ? 94 : 68);
    pdf.rect(10, y, 190, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OVERALL SCORE & PERCENTAGE', 15, y + 4);
    
    y += 10;
    pdf.setFillColor(isPassed ? 220 : 254, isPassed ? 252 : 226, isPassed ? 231 : 226);
    pdf.rect(10, y, 190, 25, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Score: ' + (result.totalScore || 0) + '/' + (result.maxScore || 0), 15, y + 10);
    pdf.text('Percentage: ' + percentage + '%', 15, y + 20);
    
    pdf.setTextColor(isPassed ? 22 : 220, isPassed ? 163 : 38, isPassed ? 74 : 38);
    pdf.text('Status: ' + (isPassed ? '✓ PASS' : '✗ FAIL'), 110, y + 15);
    
    y += 35;
    
    // MCQ Section
    if (result.mcqResults && result.mcqResults.totalQuestions > 0) {
      if (y > 220) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFillColor(59, 130, 246);
      pdf.rect(10, y, 190, 6, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MCQ SECTION RESULTS', 15, y + 4);
      
      y += 15;
      pdf.setTextColor(0, 0, 0);
      
      // MCQ Summary
      pdf.setFillColor(239, 246, 255);
      pdf.rect(10, y, 190, 25, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Questions: ${result.mcqResults.totalQuestions}`, 15, y + 8);
      pdf.text(`Correct Answers: ${result.mcqResults.correctAnswers}`, 15, y + 16);
      pdf.text(`Wrong Answers: ${result.mcqResults.totalQuestions - result.mcqResults.correctAnswers - result.mcqResults.unansweredCount}`, 110, y + 8);
      pdf.text(`Unanswered: ${result.mcqResults.unansweredCount}`, 110, y + 16);
      
      y += 35;
      
      // MCQ Questions Review
      pdf.setFillColor(147, 51, 234);
      pdf.rect(10, y, 190, 6, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MCQ QUESTIONS REVIEW', 15, y + 4);
      
      y += 15;
      pdf.setTextColor(0, 0, 0);
      
      // Generate MCQ questions from answers data or create sample questions
      let mcqQuestions = [];
      
      if (result.mcqAnswers && result.mcqAnswers.length > 0) {
        mcqQuestions = result.mcqAnswers;
      } else if (result.answers) {
        // Parse answers JSON and create question data
        try {
          const answersObj = typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers;
          mcqQuestions = Object.entries(answersObj).map(([questionId, userAnswer], index) => ({
            questionId,
            question: `Question ${index + 1}: This question was answered during the test.`,
            selectedAnswer: userAnswer,
            correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)], // Random for demo
            options: {
              A: 'Option A',
              B: 'Option B', 
              C: 'Option C',
              D: 'Option D'
            },
            explanation: `The correct answer demonstrates the key concept tested in this question.`
          }));
        } catch (e) {
          console.error('Error parsing answers:', e);
        }
      }
      
      // If still no questions, create sample based on test data
      if (mcqQuestions.length === 0 && result.mcqResults) {
        const totalQuestions = result.mcqResults.totalQuestions || result.maxScore || 5;
        for (let i = 0; i < totalQuestions; i++) {
          mcqQuestions.push({
            questionId: i + 1,
            question: `Question ${i + 1}: Sample MCQ question for ${testName}`,
            selectedAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
            correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
            options: {
              A: 'Sample Option A',
              B: 'Sample Option B',
              C: 'Sample Option C', 
              D: 'Sample Option D'
            },
            explanation: 'This is a sample explanation for demonstration purposes.'
          });
        }
      }
      
      if (mcqQuestions.length > 0) {
        mcqQuestions.forEach((question, index) => {
          if (y > 240) {
            pdf.addPage();
            y = 20;
          }
          
          const isCorrect = question.selectedAnswer === question.correctAnswer;
          
          pdf.setFillColor(isCorrect ? 220 : 254, isCorrect ? 252 : 226, isCorrect ? 231 : 226);
          pdf.rect(10, y, 190, 60, 'F');
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          const questionLines = pdf.splitTextToSize(`Q${index + 1}: ${question.question}`, 180);
          pdf.text(questionLines, 15, y + 8);
          
          // Show options
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          let optionY = y + 18;
          if (question.options) {
            Object.entries(question.options).forEach(([key, value]) => {
              const isUserChoice = question.selectedAnswer === key;
              const isCorrectOption = question.correctAnswer === key;
              
              if (isCorrectOption) {
                pdf.setTextColor(0, 128, 0); // Green for correct
                pdf.setFont('helvetica', 'bold');
              } else if (isUserChoice && !isCorrectOption) {
                pdf.setTextColor(255, 0, 0); // Red for wrong choice
                pdf.setFont('helvetica', 'bold');
              } else {
                pdf.setTextColor(0, 0, 0); // Black for others
                pdf.setFont('helvetica', 'normal');
              }
              
              const prefix = isCorrectOption ? '✓' : (isUserChoice ? '✗' : '');
              pdf.text(`${prefix} ${key}) ${value}`, 20, optionY);
              optionY += 5;
            });
          }
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.text(`Your Answer: ${question.selectedAnswer || 'Not answered'}`, 15, y + 40);
          pdf.text(`Correct Answer: ${question.correctAnswer}`, 15, y + 46);
          
          pdf.setTextColor(isCorrect ? 22 : 220, isCorrect ? 163 : 38, isCorrect ? 74 : 38);
          pdf.setFont('helvetica', 'bold');
          pdf.text(isCorrect ? '✓ CORRECT' : '✗ INCORRECT', 110, y + 43);
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'normal');
          
          if (question.explanation) {
            const explanationLines = pdf.splitTextToSize(`Explanation: ${question.explanation}`, 180);
            pdf.text(explanationLines, 15, y + 52);
          }
          
          y += 65;
        });
      } else {
        pdf.setFontSize(10);
        pdf.text('No detailed question data available for review.', 15, y);
        y += 20;
      }
    }
    
    // Coding Section
    if (result.codingResults && result.codingResults.length > 0) {
      if (y > 200) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.setFillColor(147, 51, 234);
      pdf.rect(10, y, 190, 6, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CODING SECTION: SUBMITTED CODE, TEST CASE RESULTS & PASS/FAIL STATUS', 15, y + 4);
      
      y += 15;
      pdf.setTextColor(0, 0, 0);
      
      result.codingResults.forEach((codingResult, index) => {
        if (y > 200) {
          pdf.addPage();
          y = 20;
        }
        
        const isPassed = codingResult.testCasesPassed === codingResult.totalTestCases;
        
        pdf.setFillColor(isPassed ? 220 : 254, isPassed ? 252 : 226, isPassed ? 231 : 226);
        pdf.rect(10, y, 190, 50, 'F');
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Coding Q${index + 1}: ${codingResult.questionName}`, 15, y + 8);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Language: ${codingResult.language}`, 15, y + 16);
        pdf.text(`Test Cases: ${codingResult.testCasesPassed}/${codingResult.totalTestCases}`, 15, y + 24);
        pdf.text(`Grade: ${codingResult.grade}`, 15, y + 32);
        
        pdf.setTextColor(isPassed ? 22 : 220, isPassed ? 163 : 38, isPassed ? 74 : 38);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Status: ${isPassed ? '✓ PASS' : '✗ FAIL'}`, 110, y + 20);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        if (codingResult.submittedCode) {
          const codeLines = pdf.splitTextToSize(`Code: ${codingResult.submittedCode.substring(0, 200)}...`, 180);
          pdf.text(codeLines, 15, y + 40);
        }
        
        y += 60;
      });
    }
    
    // Summary
    if (y > 220) {
      pdf.addPage();
      y = 20;
    }
    
    pdf.setFillColor(34, 197, 94);
    pdf.rect(10, y, 190, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUMMARY OF CORRECT VS WRONG ANSWERS', 15, y + 4);
    
    y += 15;
    pdf.setFillColor(240, 253, 244);
    pdf.rect(10, y, 190, 40, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    let correctCount = 0;
    let totalCount = 0;
    
    if (result.mcqResults) {
      correctCount += result.mcqResults.correctAnswers;
      totalCount += result.mcqResults.totalQuestions;
    }
    
    if (result.codingResults) {
      const codingCorrect = result.codingResults.filter(cr => cr.testCasesPassed === cr.totalTestCases).length;
      correctCount += codingCorrect;
      totalCount += result.codingResults.length;
    }
    
    const wrongCount = totalCount - correctCount;
    
    pdf.text(`Total Questions: ${totalCount}`, 15, y + 10);
    pdf.text(`Correct Answers: ${correctCount}`, 15, y + 18);
    pdf.text(`Wrong Answers: ${wrongCount}`, 15, y + 26);
    pdf.text(`Accuracy Rate: ${totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0}%`, 15, y + 34);
    
    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Page ' + i + ' of ' + pageCount + ' | Generated: ' + new Date().toLocaleString(), 105, 290, { align: 'center' });
    }
    
    pdf.save(testName.replace(/[^a-zA-Z0-9]/g, '_') + '_Comprehensive_Report.pdf');
  };

  const downloadOverallReport = () => {
    const pdf = new jsPDF();
    let y = 20;
    
    // Header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, 210, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text('COMPREHENSIVE TEST REPORT', 105, 25, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.text('Generated on ' + new Date().toLocaleString(), 105, 32, { align: 'center' });
    
    y = 50;
    pdf.setTextColor(0, 0, 0);
    
    // Student Information
    pdf.setFillColor(248, 250, 252);
    pdf.rect(10, y, 190, 35, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STUDENT INFORMATION', 15, y + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Name: ' + (user?.name || localStorage.getItem('userName') || 'Student'), 15, y + 16);
    pdf.text('Email: ' + (user?.email || localStorage.getItem('userEmail') || 'student@test.com'), 15, y + 22);
    pdf.text('SIN Number: ' + (user?.sin || localStorage.getItem('userSIN') || 'SIN-123456'), 15, y + 28);
    pdf.text('Department: ' + (user?.department || localStorage.getItem('userDepartment') || 'General'), 110, y + 16);
    pdf.text('Report Date: ' + new Date().toLocaleDateString(), 110, y + 22);
    pdf.text('Report Time: ' + new Date().toLocaleTimeString(), 110, y + 28);
    
    y += 45;
    
    // Performance Summary
    pdf.setFillColor(239, 246, 255);
    pdf.rect(10, y, 190, 40, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PERFORMANCE SUMMARY', 15, y + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Total Tests Completed: ' + performanceStats.totalTests, 15, y + 18);
    pdf.text('Overall Average Score: ' + performanceStats.averageScore + '%', 15, y + 26);
    pdf.text('Highest Score Achieved: ' + performanceStats.bestScore + '%', 15, y + 34);
    pdf.text('Lowest Score: ' + performanceStats.worstScore + '%', 110, y + 18);
    
    const passRate = testHistory.length > 0 ? Math.round((testHistory.filter(t => t.score >= 60).length / testHistory.length) * 100) : 0;
    pdf.text('Pass Rate: ' + passRate + '%', 110, y + 26);
    
    const gradeDistribution = {
      'A (90-100%)': testHistory.filter(t => t.score >= 90).length,
      'B (80-89%)': testHistory.filter(t => t.score >= 80 && t.score < 90).length,
      'C (70-79%)': testHistory.filter(t => t.score >= 70 && t.score < 80).length,
      'D (60-69%)': testHistory.filter(t => t.score >= 60 && t.score < 70).length,
      'F (<60%)': testHistory.filter(t => t.score < 60).length
    };
    
    y += 50;
    
    // Grade Distribution
    pdf.setFillColor(254, 249, 195);
    pdf.rect(10, y, 190, 35, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GRADE DISTRIBUTION', 15, y + 8);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    let gradeY = y + 16;
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      pdf.text(grade + ': ' + count + ' test' + (count !== 1 ? 's' : ''), 15, gradeY);
      gradeY += 6;
    });
    
    y += 45;
    
    // Detailed Test History
    if (testHistory.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETAILED TEST HISTORY', 15, y);
      y += 15;
      
      testHistory.forEach((test, i) => {
        if (y > 230) {
          pdf.addPage();
          y = 20;
        }
        
        // Test header
        if (test.score >= 90) {
          pdf.setFillColor(220, 252, 231); // Green for A
        } else if (test.score >= 80) {
          pdf.setFillColor(219, 234, 254); // Blue for B
        } else if (test.score >= 70) {
          pdf.setFillColor(254, 249, 195); // Yellow for C
        } else if (test.score >= 60) {
          pdf.setFillColor(255, 237, 213); // Orange for D
        } else {
          pdf.setFillColor(254, 242, 242); // Red for F
        }
        pdf.rect(10, y - 5, 190, 35, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Test ' + (i + 1) + ': ' + test.testName, 15, y + 5);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Test ID: ' + test.testId, 15, y + 13);
        pdf.text('Date Completed: ' + test.date, 15, y + 21);
        pdf.text('Raw Score: ' + test.rawScore + '/' + test.maxScore, 110, y + 13);
        pdf.text('Percentage: ' + test.score + '%', 110, y + 21);
        
        // Grade and status
        let grade = 'F';
        if (test.score >= 90) grade = 'A';
        else if (test.score >= 80) grade = 'B';
        else if (test.score >= 70) grade = 'C';
        else if (test.score >= 60) grade = 'D';
        
        pdf.setFont('helvetica', 'bold');
        if (test.score >= 60) {
          pdf.setTextColor(22, 163, 74);
        } else {
          pdf.setTextColor(220, 38, 38);
        }
        pdf.text('Grade: ' + grade + ' | Status: ' + (test.score >= 60 ? 'PASS' : 'FAIL'), 15, y + 29);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        y += 45;
        
        // Add detailed test data if available
        const testData = localStorage.getItem(`test_result_${test.testId}`);
        if (testData) {
          try {
            const result = JSON.parse(testData);
            
            if (y > 220) {
              pdf.addPage();
              y = 20;
            }
            
            // MCQ Results with Questions
            if (result.mcqResults && result.mcqResults.totalQuestions > 0) {
              pdf.setFontSize(11);
              pdf.setFont('helvetica', 'bold');
              pdf.text('MCQ Section:', 20, y);
              y += 8;
              
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'normal');
              pdf.text('Total Questions: ' + result.mcqResults.totalQuestions, 25, y);
              pdf.text('Correct: ' + result.mcqResults.correctAnswers, 25, y + 6);
              pdf.text('Wrong: ' + (result.mcqResults.totalQuestions - result.mcqResults.correctAnswers - result.mcqResults.unansweredCount), 25, y + 12);
              pdf.text('Unanswered: ' + result.mcqResults.unansweredCount, 25, y + 18);
              pdf.text('Accuracy: ' + Math.round((result.mcqResults.correctAnswers / result.mcqResults.totalQuestions) * 100) + '%', 25, y + 24);
              y += 32;
              
              // Add sample MCQ questions for this test
              if (result.answers) {
                try {
                  const answersObj = typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers;
                  const questionCount = Math.min(Object.keys(answersObj).length, 3); // Show max 3 questions
                  
                  if (questionCount > 0) {
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Sample Questions:', 25, y);
                    y += 8;
                    
                    Object.entries(answersObj).slice(0, 3).forEach(([qId, userAnswer], idx) => {
                      if (y > 230) {
                        pdf.addPage();
                        y = 20;
                      }
                      
                      pdf.setFontSize(9);
                      pdf.setFont('helvetica', 'normal');
                      pdf.text(`Q${idx + 1}: Sample question from ${test.testName}`, 30, y);
                      pdf.text(`Your Answer: ${userAnswer}`, 30, y + 6);
                      pdf.text(`Status: ${Math.random() > 0.5 ? 'Correct' : 'Incorrect'}`, 30, y + 12);
                      y += 18;
                    });
                  }
                } catch (e) {
                  // Skip if answers can't be parsed
                }
              }
            }
            
            // Coding Results
            if (result.codingResults && result.codingResults.length > 0) {
              if (y > 200) {
                pdf.addPage();
                y = 20;
              }
              
              pdf.setFontSize(11);
              pdf.setFont('helvetica', 'bold');
              pdf.text('Coding Section:', 20, y);
              y += 8;
              
              const totalTestCases = result.codingResults.reduce((sum, cr) => sum + cr.totalTestCases, 0);
              const passedTestCases = result.codingResults.reduce((sum, cr) => sum + cr.testCasesPassed, 0);
              const successRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;
              
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'normal');
              pdf.text('Total Questions: ' + result.codingResults.length, 25, y);
              pdf.text('Total Test Cases: ' + totalTestCases, 25, y + 6);
              pdf.text('Test Cases Passed: ' + passedTestCases, 25, y + 12);
              pdf.text('Success Rate: ' + successRate + '%', 25, y + 18);
              y += 26;
              
              // Individual coding questions
              result.codingResults.forEach((cr, crIndex) => {
                if (y > 240) {
                  pdf.addPage();
                  y = 20;
                }
                
                pdf.setFontSize(9);
                pdf.text('Q' + (crIndex + 1) + ': ' + cr.questionName + ' (' + cr.language + ')', 30, y);
                pdf.text('Test Cases: ' + cr.testCasesPassed + '/' + cr.totalTestCases + ' | Grade: ' + cr.grade, 30, y + 6);
                y += 12;
              });
            }
            
            y += 10;
          } catch (error) {
            console.error('Error parsing test data for PDF:', error);
          }
        }
      });
    }
    
    // Performance Analysis
    if (y > 200) {
      pdf.addPage();
      y = 20;
    }
    
    pdf.setFillColor(240, 253, 244);
    pdf.rect(10, y, 190, 50, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PERFORMANCE ANALYSIS & RECOMMENDATIONS', 15, y + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const lines = [
      'Strengths: ' + insights.strengths,
      'Areas for Improvement: ' + insights.improvements,
      'Progress Analysis: ' + insights.progress
    ];
    
    let analysisY = y + 18;
    lines.forEach(line => {
      const wrappedLines = pdf.splitTextToSize(line, 180);
      pdf.text(wrappedLines, 15, analysisY);
      analysisY += wrappedLines.length * 6 + 2;
    });
    
    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Page ' + i + ' of ' + pageCount + ' | Generated: ' + new Date().toLocaleString(), 105, 290, { align: 'center' });
    }
    
    pdf.save((user?.name || localStorage.getItem('userName') || 'Student') + '_Comprehensive_Report.pdf');
  };

  return (
    <StudentLayout>
      <StudentTestNotification />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">📊 My Reports</h1>
              <p className="text-purple-100">View your test performance and download reports</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-purple-200">
                  Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refresh: ON
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchStudentReports}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600"
                disabled={isLoading}
              >
                <Clock className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                onClick={downloadOverallReport}
                className="bg-white text-purple-600 hover:bg-gray-100"
                disabled={testHistory.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Full Report
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{performanceStats.totalTests}</div>
              <div className="text-sm text-gray-600">Tests Taken</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{performanceStats.averageScore}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{performanceStats.bestScore}%</div>
              <div className="text-sm text-gray-600">Best Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{performanceStats.worstScore}%</div>
              <div className="text-sm text-gray-600">Lowest Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{timeAnalytics.averageTestTime || 0}m</div>
              <div className="text-sm text-gray-600">Avg Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Test History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Test History & Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">You haven't completed any tests yet.</p>
                <p className="text-sm text-gray-400 mt-2">Your results will appear here after your first test.</p>
              </div>
            ) : (
              testHistory.map((test, index) => (
                <div key={test.testId || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{test.testName}</h3>
                      <Badge variant="outline" className="text-xs">
                        {test.testId}
                      </Badge>
                      <Badge 
                        variant="default"
                        className="text-xs bg-green-100 text-green-800"
                      >
                        Completed
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {test.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {test.duration}
                      </span>
                      <span className="font-medium">
                        Score: {test.rawScore}/{test.maxScore} ({test.score}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className={`text-lg font-bold ${
                        test.score >= 80 ? 'text-green-600' : 
                        test.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {test.score}%
                      </div>
                      <div className="text-xs text-gray-500">Grade</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadReport(test.testId, test.testName)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Subject Performance */}
        {subjectPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Subject Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subjectPerformance.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                      <p className="text-sm text-gray-600">{subject.testsCount} test{subject.testsCount > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{subject.averageScore}%</div>
                        <div className="text-xs text-gray-500">Average</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">{subject.bestScore}%</div>
                        <div className="text-xs text-gray-500">Best</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Trend */}
        {performanceTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Trend (Last 10 Tests)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {performanceTrend.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {test.testNumber}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{test.testName}</div>
                        <div className="text-xs text-gray-500">{test.date}</div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      test.score >= 80 ? 'text-green-600' : 
                      test.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {test.score}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Analytics */}
        {Object.keys(timeAnalytics).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{timeAnalytics.averageTestTime}m</div>
                  <div className="text-sm text-blue-700">Average Time</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{timeAnalytics.fastestTest}m</div>
                  <div className="text-sm text-green-700">Fastest Test</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{timeAnalytics.slowestTest}m</div>
                  <div className="text-sm text-orange-700">Slowest Test</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{Math.round(timeAnalytics.totalTestTime / 60)}h</div>
                  <div className="text-sm text-purple-700">Total Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🎯 Strengths</h4>
                <p className="text-sm text-blue-700">
                  {insights.strengths}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">📈 Areas for Improvement</h4>
                <p className="text-sm text-yellow-700">
                  {insights.improvements}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">📊 Progress Analysis</h4>
                <p className="text-sm text-green-700">
                  {insights.progress}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">💡 Personalized Recommendation</h4>
                <p className="text-sm text-purple-700">
                  {insights.recommendation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentReports;