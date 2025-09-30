import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Memory, Code, Download } from 'lucide-react';

interface TestCaseResult {
  testCase: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  executionTime?: number;
  status: string;
}

interface CodingSubmissionDetails {
  id: number;
  questionName: string;
  problemStatement: string;
  language: string;
  code: string;
  status: string;
  score: number;
  maxScore: number;
  executionTime?: number;
  memoryUsed?: number;
  testCasesPassed: number;
  totalTestCases: number;
  percentage: number;
  grade: string;
  testResults: TestCaseResult[];
  errorMessage?: string;
  submittedAt: string;
  studentName?: string;
  studentEmail?: string;
  compilationError?: boolean;
  runtimeError?: boolean;
}

interface CodingTestCaseDetailsProps {
  submissionId: number;
  onClose: () => void;
}

const CodingTestCaseDetails: React.FC<CodingTestCaseDetailsProps> = ({ submissionId, onClose }) => {
  const [submission, setSubmission] = useState<CodingSubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/test-result/coding/${submissionId}/details`);
      const data = await response.json();
      
      if (data.success) {
        setSubmission(data.submission);
      } else {
        setError(data.error || 'Failed to fetch submission details');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching submission details:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadSubmissionReport = () => {
    if (!submission) return;
    
    const reportData = {
      submissionId: submission.id,
      questionName: submission.questionName,
      studentInfo: {
        name: submission.studentName,
        email: submission.studentEmail
      },
      performance: {
        score: submission.score,
        maxScore: submission.maxScore,
        percentage: submission.percentage,
        grade: submission.grade,
        testCasesPassed: submission.testCasesPassed,
        totalTestCases: submission.totalTestCases
      },
      execution: {
        language: submission.language,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        status: submission.status
      },
      code: submission.code,
      testResults: submission.testResults,
      errors: submission.errorMessage,
      submittedAt: submission.submittedAt,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coding_submission_${submissionId}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50';
    if (grade === 'D') return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    if (status === 'passed') return 'bg-green-100 text-green-800';
    if (status === 'failed') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Coding Submission Details</h2>
          <div className="flex gap-2">
            <Button onClick={downloadSubmissionReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Download Report
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Question Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                {submission.questionName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{submission.problemStatement}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Language: <strong>{submission.language}</strong></span>
                <span>Submitted: <strong>{new Date(submission.submittedAt).toLocaleString()}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{submission.score}/{submission.maxScore}</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${getGradeColor(submission.grade)}`}>
                  <div className="text-2xl font-bold">{submission.grade}</div>
                  <div className="text-sm">Grade</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{submission.testCasesPassed}/{submission.totalTestCases}</div>
                  <div className="text-sm text-gray-600">Test Cases</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{submission.executionTime || 0}ms</div>
                  <div className="text-sm text-gray-600">Execution Time</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{submission.memoryUsed || 0}KB</div>
                  <div className="text-sm text-gray-600">Memory Used</div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-center">
                <Badge className={getStatusColor(submission.status)} variant="outline">
                  {submission.status === 'passed' ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  {submission.status.toUpperCase()} - {submission.percentage}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Error Messages */}
          {submission.errorMessage && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  {submission.compilationError ? 'Compilation Error' : 
                   submission.runtimeError ? 'Runtime Error' : 'Error'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 p-3 rounded-lg">
                  <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                    {submission.errorMessage}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Test Cases Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submission.testResults.map((testCase, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    testCase.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Test Case {testCase.testCase}</h4>
                      <div className="flex items-center gap-2">
                        {testCase.executionTime && (
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {testCase.executionTime}ms
                          </span>
                        )}
                        <Badge variant={testCase.passed ? "default" : "destructive"}>
                          {testCase.passed ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {testCase.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Input:</div>
                        <div className="bg-white p-2 rounded border text-sm font-mono">
                          {testCase.input || 'No input'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Expected Output:</div>
                        <div className="bg-white p-2 rounded border text-sm font-mono">
                          {testCase.expectedOutput || 'No expected output'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Your Output:</div>
                        <div className={`p-2 rounded border text-sm font-mono ${
                          testCase.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          {testCase.actualOutput || 'No output'}
                        </div>
                      </div>
                    </div>
                    
                    {testCase.error && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-red-700 mb-1">Error:</div>
                        <div className="bg-red-100 p-2 rounded border text-sm font-mono text-red-800">
                          {testCase.error}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Code */}
          <Card>
            <CardHeader>
              <CardTitle>Your Solution ({submission.language})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  <code>{submission.code}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CodingTestCaseDetails;