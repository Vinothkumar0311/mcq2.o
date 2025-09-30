import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import './CodingPlatform.css';
import { 
  Play, 
  Send, 
  Clock, 
  Wifi, 
  Code, 
  FileText, 
  Terminal, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
  Bug,
  Zap,
  Edit
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/config/api';

interface CodingTestPlatformProps {
  questions: any[];
  testDuration: number;
  onSubmit: (answers: any) => void;
  testName: string;
}

interface ErrorInfo {
  line?: number;
  column?: number;
  message: string;
  type: 'compilation' | 'runtime' | 'timeout';
}

const CodingTestPlatform: React.FC<CodingTestPlatformProps> = ({
  questions,
  testDuration,
  onSubmit,
  testName
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(testDuration * 60);
  const [selectedLanguage, setSelectedLanguage] = useState<Record<number, string>>({});
  const [code, setCode] = useState<Record<number, string>>({});
  const [customInput, setCustomInput] = useState('');
  const [testResults, setTestResults] = useState<Record<number, any>>({});
  const [customResults, setCustomResults] = useState<Record<number, any>>({});
  const [errors, setErrors] = useState<Record<number, ErrorInfo[]>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testRunCount, setTestRunCount] = useState<Record<number, number>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('Connected');
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set());
  
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Network status check
  useEffect(() => {
    const checkNetwork = () => {
      setNetworkStatus(navigator.onLine ? 'Connected' : 'Disconnected');
    };
    
    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', checkNetwork);
    
    return () => {
      window.removeEventListener('online', checkNetwork);
      window.removeEventListener('offline', checkNetwork);
    };
  }, []);

  // Initialize default language for each question
  useEffect(() => {
    const defaultLanguages: Record<number, string> = {};
    questions.forEach((q, index) => {
      if (q.allowedLanguages && q.allowedLanguages.length > 0) {
        defaultLanguages[index] = q.allowedLanguages[0];
      }
    });
    setSelectedLanguage(defaultLanguages);
  }, [questions]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLanguageChange = (questionIndex: number, language: string) => {
    setSelectedLanguage(prev => ({ ...prev, [questionIndex]: language }));
  };

  const handleCodeChange = (questionIndex: number, newCode: string) => {
    setCode(prev => ({ ...prev, [questionIndex]: newCode }));
    // Clear errors when code changes
    setErrors(prev => ({ ...prev, [questionIndex]: [] }));
  };

  const parseError = (errorMessage: string): ErrorInfo => {
    // Parse different error formats
    const javaError = errorMessage.match(/:(\d+):\s*error:/i);
    const pythonError = errorMessage.match(/line (\d+)/i);
    const cppError = errorMessage.match(/:?(\d+):(\d+):/i);
    
    let line = 0;
    let column = 0;
    let type: 'compilation' | 'runtime' | 'timeout' = 'compilation';
    
    if (javaError) {
      line = parseInt(javaError[1]);
      type = 'compilation';
    } else if (pythonError) {
      line = parseInt(pythonError[1]);
      type = errorMessage.includes('Traceback') ? 'runtime' : 'compilation';
    } else if (cppError) {
      line = parseInt(cppError[1]);
      column = parseInt(cppError[2] || '0');
      type = 'compilation';
    }
    
    if (errorMessage.toLowerCase().includes('timeout')) {
      type = 'timeout';
    }
    
    return {
      line,
      column,
      message: errorMessage,
      type
    };
  };

  const handleDryRun = async () => {
    if (!code[currentQuestion]?.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before running",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    try {
      // Mock dry run for local testing
      const mockResult = {
        success: Math.random() > 0.1, // 90% success rate for dry runs
        output: customInput ? `Processed input: ${customInput}\nOutput: ${customInput.split('').reverse().join('')}` : "Hello World!\nCode executed successfully",
        error: null
      };
      
      if (!mockResult.success) {
        mockResult.error = "Syntax error: unexpected token at line 5";
        mockResult.output = null;
        const errorInfo = parseError(mockResult.error);
        setErrors(prev => ({ ...prev, [currentQuestion]: [errorInfo] }));
      } else {
        setErrors(prev => ({ ...prev, [currentQuestion]: [] }));
      }
      
      setCustomResults(prev => ({ ...prev, [currentQuestion]: mockResult }));
      
      toast({
        title: mockResult.success ? "Execution Complete" : "Execution Failed",
        description: mockResult.success ? "Code executed successfully with custom input" : mockResult.error,
        variant: mockResult.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Dry run error:', error);
      toast({
        title: "Error",
        description: "Failed to execute code",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestRun = async () => {
    const currentCount = testRunCount[currentQuestion] || 0;
    if (currentCount >= 25) {
      toast({
        title: "Limit Reached",
        description: "You have reached the maximum test runs (25) for this question",
        variant: "destructive",
      });
      return;
    }

    if (!code[currentQuestion]?.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before testing",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    try {
      // Mock test run for local testing
      const mockResult = {
        success: Math.random() > 0.2, // 80% success rate
        summary: {
          passed: Math.floor(Math.random() * 4) + 1, // 1-4 passed
          total: 4
        },
        results: [
          {
            passed: true,
            input: "5",
            expectedOutput: "120",
            actualOutput: "120"
          },
          {
            passed: Math.random() > 0.3,
            input: "3",
            expectedOutput: "6",
            actualOutput: Math.random() > 0.3 ? "6" : "5"
          },
          {
            passed: Math.random() > 0.4,
            input: "0",
            expectedOutput: "1",
            actualOutput: Math.random() > 0.4 ? "1" : "0"
          },
          {
            passed: Math.random() > 0.5,
            input: "1",
            expectedOutput: "1",
            actualOutput: "1"
          }
        ]
      };
      
      // Calculate actual passed count
      const actualPassed = mockResult.results.filter(r => r.passed).length;
      mockResult.summary.passed = actualPassed;
      mockResult.success = actualPassed >= 2;
      
      setTestResults(prev => ({ ...prev, [currentQuestion]: mockResult }));
      setTestRunCount(prev => ({ ...prev, [currentQuestion]: currentCount + 1 }));
      setErrors(prev => ({ ...prev, [currentQuestion]: [] }));
      
      toast({
        title: mockResult.success ? "Test Complete" : "Test Failed",
        description: mockResult.success 
          ? `Passed ${actualPassed}/4 sample test cases`
          : `Only ${actualPassed}/4 test cases passed - check your logic`,
        variant: mockResult.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Test run error:', error);
      toast({
        title: "Error",
        description: "Failed to run tests",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!code[currentQuestion]?.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before submitting",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to submit this solution?\n\n" +
      "After submission:\n" +
      "• Your code will be locked and cannot be edited\n" +
      "• The solution will be evaluated immediately\n\n" +
      "Click OK to proceed with submission."
    );
    
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const testCases = [
        { input: "5", expectedOutput: "120", passed: true, actualOutput: "120" },
        { input: "3", expectedOutput: "6", passed: Math.random() > 0.2, actualOutput: "" },
        { input: "0", expectedOutput: "1", passed: Math.random() > 0.3, actualOutput: "" },
        { input: "10", expectedOutput: "3628800", passed: Math.random() > 0.4, actualOutput: "" },
        { input: "1", expectedOutput: "1", passed: Math.random() > 0.1, actualOutput: "" }
      ];
      
      testCases.forEach(tc => {
        tc.actualOutput = tc.passed ? tc.expectedOutput : "Wrong Output";
      });
      
      const actualPassed = testCases.filter(tc => tc.passed).length;
      const maxMarks = currentQ?.marks || 10;
      const earnedMarks = Math.round((actualPassed / 5) * maxMarks);
      const percentage = Math.round((actualPassed / 5) * 100);
      
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else if (percentage >= 40) grade = 'D';
      
      const mockResult = {
        success: actualPassed >= 3,
        summary: { passed: actualPassed, total: 5 },
        results: testCases
      };
      
      setTestResults(prev => ({ ...prev, [currentQuestion]: mockResult }));
      setSubmittedQuestions(prev => new Set([...prev, currentQuestion]));
      
      const answers = {
        [currentQuestion]: {
          code: code[currentQuestion],
          language: selectedLanguage[currentQuestion],
          result: mockResult,
          codingResult: {
            testCasesPassed: actualPassed,
            totalTestCases: 5,
            score: earnedMarks,
            maxScore: maxMarks,
            percentage: percentage,
            grade: grade
          }
        }
      };
      
      onSubmit(answers);
      
      const resultMessage = 
        `CODE SUBMISSION SUCCESSFUL!\n\n` +
        `RESULTS:\n` +
        `Test Cases Passed: ${actualPassed}/5\n` +
        `Marks Earned: ${earnedMarks}/${maxMarks}\n` +
        `Percentage: ${percentage}%\n` +
        `Grade: ${grade}\n\n` +
        `Your code is now locked and cannot be edited.`;
      
      alert(resultMessage);
      
      toast({
        title: "Solution Submitted Successfully!",
        description: `Grade: ${grade} | ${earnedMarks}/${maxMarks} marks (${percentage}%) | ${actualPassed}/5 test cases passed`,
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      
      setSubmittedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestion);
        return newSet;
      });
      
      toast({
        title: "Submission Failed",
        description: "Failed to submit and evaluate code",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    const allAnswers: Record<number, any> = {};
    questions.forEach((_, index) => {
      if (code[index]) {
        allAnswers[index] = {
          code: code[index],
          language: selectedLanguage[index]
        };
      }
    });
    
    await onSubmit(allAnswers);
  };

  const getPlaceholderCode = (language: string) => {
    const templates = {
      'java': `public class Solution {
    public static void main(String[] args) {
        // Your code here
        
    }
}`,
      'python': `# Write your Python solution here

def solve():
    # Your code here
    pass

if __name__ == "__main__":
    solve()`,
      'cpp': `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Your code here
    
    return 0;
}`,
      'c': `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Your code here
    
    return 0;
}`,
      'javascript': `// Write your JavaScript solution here

function solve() {
    // Your code here
    
}

solve();`
    };
    
    return templates[language?.toLowerCase()] || `// Write your ${language || 'code'} solution here...\n\nfunction solve() {\n    // Your code here\n    \n}`;
  };

  const currentQ = questions[currentQuestion];
  const currentTestResult = testResults[currentQuestion];
  const currentCustomResult = customResults[currentQuestion];
  const currentErrors = errors[currentQuestion] || [];
  const isCurrentQuestionSubmitted = submittedQuestions.has(currentQuestion);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth >= 30 && newWidth <= 70) {
        setLeftPanelWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className={`h-screen flex flex-col bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{testName}</h1>
              <p className="text-xs text-gray-500">Coding Assessment Platform</p>
            </div>
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${
            timeLeft < 300 
              ? 'timer-critical bg-red-50 text-red-700 border border-red-200' 
              : timeLeft < 900
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Network Status */}
          <div className={`network-status flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            networkStatus === 'Connected' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              networkStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {networkStatus}
          </div>
          
          {/* Language Status */}
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="bg-white">
              {Object.keys(code).filter(k => code[parseInt(k)]?.trim()).length}/{questions.length} Solutions
            </Badge>
            <div className="text-gray-600 font-medium">
              MCQ Coding Platform
            </div>
          </div>
          
          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hover:bg-gray-100"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Question Navigation Sidebar */}
        <div className="w-20 bg-gray-900 text-white flex flex-col border-r border-gray-700">
          <div className="p-3 text-xs font-semibold text-gray-300 text-center border-b border-gray-700 bg-gray-800">
            <div className="mb-1">Questions</div>
            <div className="text-gray-400">{questions.length} Total</div>
          </div>
          <div className="flex-1 py-3">
            {questions.map((_, index) => {
              const hasCode = code[index]?.trim();
              const hasResult = testResults[index];
              const hasError = errors[index]?.length > 0;
              const isSubmitted = submittedQuestions.has(index);
              
              return (
                <div key={index} className="px-2 mb-2">
                  <button
                    onClick={() => setCurrentQuestion(index)}
                    className={`question-nav-button status-indicator w-full h-14 flex flex-col items-center justify-center text-xs font-medium rounded-lg border-2 transition-all duration-200 relative ${
                      currentQuestion === index
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg transform scale-105'
                        : isSubmitted
                        ? 'bg-purple-900/50 border-purple-600 text-purple-200 hover:bg-purple-800/50 submitted'
                        : hasError
                        ? 'bg-red-900/50 border-red-600 text-red-200 hover:bg-red-800/50 error'
                        : hasResult?.success
                        ? 'bg-green-900/50 border-green-600 text-green-200 hover:bg-green-800/50 completed'
                        : hasCode
                        ? 'bg-yellow-900/50 border-yellow-600 text-yellow-200 hover:bg-yellow-800/50'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-lg font-bold mb-0.5">{index + 1}</div>
                    <div className="flex items-center gap-1">
                      {isSubmitted ? (
                        <Send className="w-3 h-3" />
                      ) : hasError ? (
                        <XCircle className="w-3 h-3" />
                      ) : hasResult?.success ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : hasCode ? (
                        <Edit className="w-3 h-3" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-current opacity-50" />
                      )}
                    </div>
                    
                    {/* Active indicator */}
                    {currentQuestion === index && (
                      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-l" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* Progress Summary */}
          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="text-xs text-gray-400 text-center">
              <div className="mb-1">Progress</div>
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(questions.length)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      submittedQuestions.has(i)
                        ? 'bg-purple-500'
                        : errors[i]?.length > 0
                        ? 'bg-red-500'
                        : testResults[i]?.success
                        ? 'bg-green-500'
                        : code[i]?.trim()
                        ? 'bg-yellow-500'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs">
                {Object.keys(code).filter(k => code[parseInt(k)]?.trim()).length}/{questions.length} Started
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex relative min-h-0">
          {/* Left Panel - Problem Statement */}
          <div 
            className="bg-white border-r flex flex-col shadow-sm min-w-0" 
            style={{ 
              width: `${leftPanelWidth}%`,
              minWidth: window.innerWidth < 768 ? '300px' : '400px',
              maxWidth: '70%'
            }}
          >
            <Tabs defaultValue="problem" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-gray-50 h-12">
                <TabsTrigger value="problem" className="gap-2 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 font-medium">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Problem</span>
                </TabsTrigger>
                <TabsTrigger value="testcases" className="gap-2 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 font-medium">
                  <Terminal className="w-4 h-4" />
                  <span className="hidden sm:inline">Test Cases</span>
                </TabsTrigger>
                <TabsTrigger value="instructions" className="gap-2 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 font-medium">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Instructions</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="problem" className="flex-1 p-6 overflow-y-auto light-scrollbar">
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Problem {currentQuestion + 1}
                      </h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-blue-100 text-blue-800 font-medium">
                          {currentQ?.marks || 0} points
                        </Badge>
                        <Badge variant="outline" className="text-gray-600">
                          {selectedLanguage[currentQuestion] || 'Select Language'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose prose-gray max-w-none">
                    <div className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap">
                      {currentQ?.problemStatement}
                    </div>
                  </div>

                  {currentQ?.constraints && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <h4 className="font-semibold text-amber-800">Constraints</h4>
                      </div>
                      <div className="text-sm text-amber-700 font-mono whitespace-pre-wrap bg-amber-100/50 p-3 rounded border border-amber-200">
                        {currentQ.constraints}
                      </div>
                    </div>
                  )}
                  
                  {/* Problem difficulty indicator */}
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Difficulty:</span>
                      <Badge variant="secondary" className="ml-2">
                        {currentQ?.difficulty || 'Medium'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Time Limit:</span>
                      <span className="ml-2 font-mono">2 seconds</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Memory Limit:</span>
                      <span className="ml-2 font-mono">256 MB</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="testcases" className="flex-1 p-6 overflow-y-auto light-scrollbar">
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Sample Test Cases</h3>
                    <p className="text-sm text-gray-600">
                      Use these examples to understand the expected input/output format
                    </p>
                  </div>
                  
                  {currentQ?.sampleTestCases?.map((testCase: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-blue-500 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                          </div>
                          <span className="font-semibold text-gray-800">Test Case {index + 1}</span>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-semibold text-green-700">Input</span>
                            </div>
                            <pre className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {testCase.input || '(empty)'}
                            </pre>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-semibold text-blue-700">Expected Output</span>
                            </div>
                            <pre className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {testCase.output || '(empty)'}
                            </pre>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!currentQ?.sampleTestCases || currentQ.sampleTestCases.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Terminal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No sample test cases available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="flex-1 p-6 overflow-y-auto light-scrollbar">
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">How to Use This Platform</h3>
                    <p className="text-sm text-gray-600">
                      Follow these guidelines to make the most of your coding session
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Code Editor Features
                      </h4>
                      <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>Select your preferred programming language from the dropdown</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>Auto-indentation and syntax highlighting included</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>Use Tab key for indentation, Enter for auto-indent</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>Line numbers and error highlighting available</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Testing Your Code
                      </h4>
                      <ul className="space-y-2 text-sm text-green-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span><strong>Dry Run:</strong> Test with custom input (unlimited uses)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span><strong>Test Run:</strong> Run against sample test cases (25 attempts max)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>Check the results panel for detailed feedback</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>Fix any errors shown in the "Your Solution" section</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Submission Guidelines
                      </h4>
                      <ul className="space-y-2 text-sm text-amber-700">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>Submit your solution when you're confident it's correct</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>You can submit multiple times, but final submission counts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>Make sure to submit before the timer runs out</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>Review your solution in different questions using the sidebar</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Important Tips
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Read the problem statement and constraints carefully</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Test with the provided sample cases first</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Consider edge cases and boundary conditions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span>Optimize for both correctness and efficiency</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Resizer */}
          <div 
            className="resizer w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-all duration-200 relative group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20 transition-colors" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-gray-400 group-hover:bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
              <div className="w-0.5 h-6 bg-white rounded-full" />
            </div>
          </div>
          
          {/* Right Panel - Code Editor */}
          <div 
            className="bg-gray-900 text-white flex flex-col min-w-0" 
            style={{ 
              width: `${100 - leftPanelWidth}%`,
              minWidth: window.innerWidth < 768 ? '400px' : '500px'
            }}
          >
            {/* Code Editor Header */}
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-blue-400" />
                  <Select
                    value={selectedLanguage[currentQuestion] || ''}
                    onValueChange={(value) => handleLanguageChange(currentQuestion, value)}
                    disabled={isCurrentQuestionSubmitted}
                  >
                    <SelectTrigger className={`w-36 border-gray-600 transition-colors ${
                      isCurrentQuestionSubmitted 
                        ? 'bg-gray-600 opacity-50 cursor-not-allowed' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentQ?.allowedLanguages?.map((lang: string) => (
                        <SelectItem key={lang} value={lang} className="font-mono">
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    (testRunCount[currentQuestion] || 0) >= 20
                      ? 'bg-red-900/50 text-red-300 border border-red-700'
                      : (testRunCount[currentQuestion] || 0) >= 15
                      ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                      : 'bg-gray-700 text-gray-300 border border-gray-600'
                  }`}>
                    Test Runs: {testRunCount[currentQuestion] || 0}/25
                  </div>
                  
                  {code[currentQuestion]?.trim() && (
                    <div className="text-xs text-gray-400">
                      {code[currentQuestion].split('\n').length} lines
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDryRun}
                  disabled={isRunning || isCurrentQuestionSubmitted}
                  className="action-button gap-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200 hover:text-white transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? 'Running...' : 'Dry Run'}
                  <Badge variant="secondary" className="ml-1 text-xs bg-gray-600 text-gray-300">
                    ∞
                  </Badge>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestRun}
                  disabled={isRunning || (testRunCount[currentQuestion] || 0) >= 25 || isCurrentQuestionSubmitted}
                  className="action-button gap-2 bg-blue-700 border-blue-600 hover:bg-blue-600 text-blue-100 hover:text-white transition-all disabled:opacity-50"
                >
                  <Terminal className="w-4 h-4" />
                  Test Run
                  <Badge variant="secondary" className="ml-1 text-xs bg-blue-600 text-blue-100">
                    {25 - (testRunCount[currentQuestion] || 0)}
                  </Badge>
                </Button>
                
                {isCurrentQuestionSubmitted ? (
                  <Button
                    size="sm"
                    disabled
                    className="action-button gap-2 bg-purple-600 text-white font-medium opacity-75 cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Submitted
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmitSolution}
                    disabled={isSubmitting || !code[currentQuestion]?.trim()}
                    className="action-button gap-2 bg-green-600 hover:bg-green-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                  </Button>
                )}
              </div>
            </div>

            {/* Code Editor with Line Numbers */}
            <div className="flex-1 flex">
              {/* Line Numbers */}
              <div className="line-numbers bg-gray-800 text-gray-400 text-sm font-mono p-4 pr-2 border-r border-gray-700 select-none">
                {(code[currentQuestion] || '').split('\n').map((_, index) => (
                  <div key={index} className={`leading-6 text-right ${
                    currentErrors.some(err => err.line === index + 1) ? 'text-red-400 error-line' : ''
                  }`}>
                    {index + 1}
                  </div>
                ))}
              </div>
              
              {/* Code Editor */}
              <div className="flex-1 relative">
                {/* Submission Overlay */}
                {isCurrentQuestionSubmitted && (
                  <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="bg-purple-800/90 text-purple-100 px-6 py-4 rounded-lg border border-purple-600 shadow-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-purple-300" />
                        <div>
                          <div className="font-semibold">Solution Submitted</div>
                          <div className="text-sm text-purple-200">This question has been submitted and cannot be edited</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <Textarea
                  ref={codeEditorRef}
                  value={code[currentQuestion] || ''}
                  onChange={(e) => !isCurrentQuestionSubmitted && handleCodeChange(currentQuestion, e.target.value)}
                  disabled={isCurrentQuestionSubmitted}
                  onKeyDown={(e) => {
                    if (isCurrentQuestionSubmitted) {
                      e.preventDefault();
                      return;
                    }
                    // Auto-indentation on Enter
                    if (e.key === 'Enter') {
                      const textarea = e.target as HTMLTextAreaElement;
                      const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
                      const currentLine = lines[lines.length - 1];
                      const indent = currentLine.match(/^\s*/)?.[0] || '';
                      
                      // Add extra indent for opening braces
                      const extraIndent = currentLine.trim().endsWith('{') ? '    ' : '';
                      
                      setTimeout(() => {
                        const start = textarea.selectionStart;
                        const newValue = textarea.value.substring(0, start) + indent + extraIndent + textarea.value.substring(start);
                        handleCodeChange(currentQuestion, newValue);
                        
                        // Set cursor position
                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + indent.length + extraIndent.length;
                        }, 0);
                      }, 0);
                    }
                    
                    // Tab for indentation
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const textarea = e.target as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const newValue = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                      handleCodeChange(currentQuestion, newValue);
                      
                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + 4;
                      }, 0);
                    }
                  }}
                  placeholder={isCurrentQuestionSubmitted ? "Solution submitted - editing disabled" : getPlaceholderCode(selectedLanguage[currentQuestion])}
                  className={`code-editor w-full h-full font-mono text-sm border-none resize-none focus:ring-0 p-4 pl-2 leading-6 selection:bg-blue-600/30 dark-scrollbar focus:outline-none ${
                    isCurrentQuestionSubmitted 
                      ? 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-75' 
                      : 'bg-gray-900 text-green-400'
                  }`}
                  style={{ 
                    minHeight: '400px',
                    tabSize: 4,
                    fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace'
                  }}
                  readOnly={isCurrentQuestionSubmitted}
                />
                
                {/* Error Indicators */}
                {currentErrors.map((error, index) => error.line > 0 && (
                  <div
                    key={index}
                    className="absolute left-0 bg-red-500/20 border-l-2 border-red-500 pointer-events-none animate-pulse"
                    style={{
                      top: `${(error.line - 1) * 24 + 16}px`,
                      height: '24px',
                      width: '100%'
                    }}
                  />
                ))}
                
                {/* Code completion hints */}
                {!code[currentQuestion]?.trim() && (
                  <div className="absolute top-4 left-2 pointer-events-none">
                    <div className="text-gray-500 text-sm font-mono leading-6 whitespace-pre">
                      {getPlaceholderCode(selectedLanguage[currentQuestion])}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Error Display Section - Enhanced */}
            {currentErrors.length > 0 && (
              <div className="border-t border-gray-700 bg-red-900/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold text-sm">Your Solution</span>
                  <Badge variant="destructive" className="text-xs">
                    {currentErrors.length} Error{currentErrors.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {currentErrors.map((error, index) => (
                    <div key={index} className="bg-red-900/40 border border-red-600/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <XCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs bg-red-800 border-red-600 text-red-200">
                              {error.type.toUpperCase()}
                            </Badge>
                            {error.line > 0 && (
                              <span className="text-red-300 text-xs font-medium">
                                Line {error.line}{error.column > 0 && `:${error.column}`}
                              </span>
                            )}
                          </div>
                          <div className="bg-red-950/50 rounded p-3 border border-red-700/30">
                            <pre className="text-red-100 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                              {error.message}
                            </pre>
                          </div>
                          {error.line > 0 && (
                            <div className="mt-2 text-xs text-red-300 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Click on line {error.line} in the editor to see the issue
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-red-950/30 rounded border border-red-700/30">
                  <div className="text-xs text-red-200 flex items-start gap-2">
                    <div className="text-red-400 mt-0.5">💡</div>
                    <div>
                      <div className="font-medium mb-1">Debugging Tips:</div>
                      <ul className="space-y-1 text-red-300">
                        <li>• Check syntax and variable names</li>
                        <li>• Verify input/output format matches expected</li>
                        <li>• Test with sample inputs first</li>
                        <li>• Make sure all edge cases are handled</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Panel */}
            <div className="border-t border-gray-700 bg-gray-800">
              <Tabs defaultValue="output" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-700 rounded-none">
                  <TabsTrigger value="output">Custom Output</TabsTrigger>
                  <TabsTrigger value="results">Test Results</TabsTrigger>
                </TabsList>
                
                <TabsContent value="output" className="p-4 space-y-3">
                  <Textarea
                    placeholder={isCurrentQuestionSubmitted ? "Custom input disabled - question submitted" : "Enter custom input here..."}
                    value={customInput}
                    onChange={(e) => !isCurrentQuestionSubmitted && setCustomInput(e.target.value)}
                    disabled={isCurrentQuestionSubmitted}
                    className={`border-gray-600 text-white font-mono text-sm ${
                      isCurrentQuestionSubmitted 
                        ? 'bg-gray-600 opacity-50 cursor-not-allowed' 
                        : 'bg-gray-700'
                    }`}
                    rows={3}
                  />
                  
                  {currentCustomResult && (
                    <div className={`p-3 rounded text-sm font-mono ${
                      currentCustomResult.success 
                        ? 'bg-green-900 border border-green-700' 
                        : 'bg-red-900 border border-red-700'
                    }`}>
                      <div className="whitespace-pre-wrap">
                        {currentCustomResult.success 
                          ? (currentCustomResult.output || '(No output)')
                          : currentCustomResult.error
                        }
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="results" className="p-4 max-h-60 overflow-y-auto dark-scrollbar">
                  {currentTestResult ? (
                    <div className="space-y-4">
                      {/* Overall Result Header */}
                      <div className={`flex items-center justify-between p-3 rounded-lg border ${
                        currentTestResult.success 
                          ? 'bg-green-900/20 border-green-700/50' 
                          : 'bg-red-900/20 border-red-700/50'
                      }`}>
                        <div className="flex items-center gap-2">
                          {currentTestResult.success ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className={`font-medium ${
                            currentTestResult.success ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {currentTestResult.success ? 'All Tests Passed!' : 'Some Tests Failed'}
                          </span>
                        </div>
                        <Badge variant={currentTestResult.success ? "default" : "destructive"} className="text-xs">
                          {currentTestResult.summary?.passed || 0}/{currentTestResult.summary?.total || 0} Passed
                        </Badge>
                      </div>
                      
                      {/* Detailed Test Results */}
                      {currentTestResult.results && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-gray-300 mb-2">Test Case Details:</div>
                          {currentTestResult.results.map((result: any, index: number) => (
                            <div key={index} className={`rounded-lg border p-3 ${
                              result.passed 
                                ? 'bg-green-900/20 border-green-700/50' 
                                : 'bg-red-900/20 border-red-700/50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {result.passed ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                  )}
                                  <span className={`text-sm font-medium ${
                                    result.passed ? 'text-green-300' : 'text-red-300'
                                  }`}>
                                    Test Case {index + 1}
                                  </span>
                                </div>
                                <Badge 
                                  variant={result.passed ? "default" : "destructive"} 
                                  className="text-xs"
                                >
                                  {result.passed ? 'PASS' : 'FAIL'}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2 font-mono text-xs">
                                <div className="grid grid-cols-1 gap-2">
                                  <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                    <div className="text-blue-300 font-medium mb-1">Input:</div>
                                    <pre className="text-gray-200 whitespace-pre-wrap">{result.input || '(empty)'}</pre>
                                  </div>
                                  
                                  <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                    <div className="text-green-300 font-medium mb-1">Expected Output:</div>
                                    <pre className="text-gray-200 whitespace-pre-wrap">{result.expectedOutput || '(empty)'}</pre>
                                  </div>
                                  
                                  <div className={`p-2 rounded border ${
                                    result.passed 
                                      ? 'bg-green-900/20 border-green-700/50' 
                                      : 'bg-red-900/20 border-red-700/50'
                                  }`}>
                                    <div className={`font-medium mb-1 ${
                                      result.passed ? 'text-green-300' : 'text-red-300'
                                    }`}>
                                      Your Output:
                                    </div>
                                    <pre className={`whitespace-pre-wrap ${
                                      result.passed ? 'text-green-200' : 'text-red-200'
                                    }`}>
                                      {result.actualOutput || '(no output)'}
                                    </pre>
                                  </div>
                                  
                                  {result.error && (
                                    <div className="bg-red-900/30 p-2 rounded border border-red-700/50">
                                      <div className="text-red-300 font-medium mb-1">Runtime Error:</div>
                                      <pre className="text-red-200 whitespace-pre-wrap text-xs">{result.error}</pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Error Display for Failed Overall Result */}
                      {!currentTestResult.success && currentTestResult.error && !currentTestResult.results && (
                        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-300 font-medium text-sm">Execution Error</span>
                          </div>
                          <pre className="text-red-200 text-xs font-mono whitespace-pre-wrap bg-red-950/50 p-3 rounded border border-red-700/30">
                            {currentTestResult.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-8">
                      <Terminal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <div className="font-medium mb-1">No Test Results Yet</div>
                      <div className="text-xs text-gray-500">
                        Click "Test Run Code" to see how your solution performs
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingTestPlatform;