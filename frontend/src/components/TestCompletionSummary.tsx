import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Award, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestCompletionData {
  testId: string;
  testName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: string;
  hasCodingQuestions: boolean;
  hasMCQQuestions: boolean;
  codingResults?: Array<{
    questionName: string;
    score: number;
    maxScore: number;
    testCasesPassed: number;
    totalTestCases: number;
    percentage: number;
    status: string;
    grade: string;
    language: string;
  }>;
  codingStatistics?: {
    totalQuestions: number;
    totalTestCases: number;
    totalPassedTestCases: number;
    testCaseSuccessRate: number;
    questionsFullyPassed: number;
    questionsPartiallyPassed: number;
    questionsFailed: number;
  };
  mcqResults?: {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unansweredCount: number;
    accuracyRate: number;
  };
  submittedAt: string;
}

interface TestCompletionSummaryProps {
  completionData: TestCompletionData;
  onViewFullResults: () => void;
  onDownloadReport: () => void;
}

const TestCompletionSummary: React.FC<TestCompletionSummaryProps> = ({
  completionData,
  onViewFullResults,
  onDownloadReport
}) => {
  const navigate = useNavigate();

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
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

  const getStatusIcon = (status: string) => {
    if (status === 'completed' || status === 'passed') {
      return <CheckCircle className="w-8 h-8 text-green-600" />;
    }
    return <XCircle className="w-8 h-8 text-red-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon(completionData.status)}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h1>
        <p className="text-gray-600 text-lg">{completionData.testName}</p>
        <p className="text-sm text-gray-500">
          Submitted on {new Date(completionData.submittedAt).toLocaleString()}
        </p>
      </div>

      {/* Overall Results */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-center text-xl">Your Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {completionData.totalScore}/{completionData.maxScore}
              </div>
              <div className="text-sm text-gray-600">Total Score</div>
            </div>
            
            <div className={`p-4 rounded-lg ${getGradeColor(completionData.percentage)}`}>
              <div className="text-3xl font-bold">
                {completionData.percentage}%
              </div>
              <div className="text-sm">Percentage</div>
            </div>
            
            <div className={`p-4 rounded-lg ${getGradeColor(completionData.percentage)}`}>
              <div className="text-3xl font-bold">
                {getGradeLetter(completionData.percentage)}
              </div>
              <div className="text-sm">Grade</div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className={`text-3xl font-bold ${
                completionData.percentage >= 60 ? 'text-green-600' : 'text-red-600'
              }`}>
                {completionData.percentage >= 60 ? 'PASS' : 'FAIL'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coding Results Summary */}
      {completionData.hasCodingQuestions && completionData.codingStatistics && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Coding Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {completionData.codingStatistics.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Coding Questions</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {completionData.codingStatistics.questionsFullyPassed}
                </div>
                <div className="text-sm text-gray-600">Fully Passed</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {completionData.codingStatistics.questionsPartiallyPassed}
                </div>
                <div className="text-sm text-gray-600">Partially Passed</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {completionData.codingStatistics.questionsFailed}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">
                Test Case Success Rate: {completionData.codingStatistics.testCaseSuccessRate}%
              </div>
              <div className="text-sm text-gray-600">
                {completionData.codingStatistics.totalPassedTestCases}/{completionData.codingStatistics.totalTestCases} test cases passed
              </div>
            </div>

            {/* Individual Coding Questions */}
            {completionData.codingResults && completionData.codingResults.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium text-gray-900">Question-wise Results:</h4>\n                {completionData.codingResults.map((result, index) => (\n                  <div key={index} className=\"flex items-center justify-between p-3 bg-white border rounded-lg\">\n                    <div className=\"flex-1\">\n                      <div className=\"font-medium text-sm\">{result.questionName}</div>\n                      <div className=\"text-xs text-gray-600\">\n                        {result.language} • {result.testCasesPassed}/{result.totalTestCases} test cases\n                      </div>\n                    </div>\n                    <div className=\"text-right\">\n                      <div className=\"font-bold text-sm\">{result.score}/{result.maxScore}</div>\n                      <Badge className={getGradeColor(result.percentage)} variant=\"outline\">\n                        {result.grade}\n                      </Badge>\n                    </div>\n                  </div>\n                ))}\n              </div>\n            )}\n          </CardContent>\n        </Card>\n      )}\n\n      {/* MCQ Results Summary */}\n      {completionData.hasMCQQuestions && completionData.mcqResults && (\n        <Card className=\"border-l-4 border-l-green-500\">\n          <CardHeader>\n            <CardTitle className=\"flex items-center gap-2\">\n              <CheckCircle className=\"w-5 h-5\" />\n              MCQ Performance Summary\n            </CardTitle>\n          </CardHeader>\n          <CardContent>\n            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">\n              <div className=\"text-center p-3 bg-blue-50 rounded-lg\">\n                <div className=\"text-2xl font-bold text-blue-600\">\n                  {completionData.mcqResults.totalQuestions}\n                </div>\n                <div className=\"text-sm text-gray-600\">Total Questions</div>\n              </div>\n              <div className=\"text-center p-3 bg-green-50 rounded-lg\">\n                <div className=\"text-2xl font-bold text-green-600\">\n                  {completionData.mcqResults.correctAnswers}\n                </div>\n                <div className=\"text-sm text-gray-600\">Correct</div>\n              </div>\n              <div className=\"text-center p-3 bg-red-50 rounded-lg\">\n                <div className=\"text-2xl font-bold text-red-600\">\n                  {completionData.mcqResults.wrongAnswers}\n                </div>\n                <div className=\"text-sm text-gray-600\">Wrong</div>\n              </div>\n              <div className=\"text-center p-3 bg-orange-50 rounded-lg\">\n                <div className=\"text-2xl font-bold text-orange-600\">\n                  {completionData.mcqResults.unansweredCount}\n                </div>\n                <div className=\"text-sm text-gray-600\">Unanswered</div>\n              </div>\n            </div>\n          </CardContent>\n        </Card>\n      )}\n\n      {/* Action Buttons */}\n      <div className=\"flex flex-col sm:flex-row gap-4 justify-center\">\n        <Button onClick={onViewFullResults} className=\"flex items-center gap-2\">\n          <Eye className=\"w-4 h-4\" />\n          View Detailed Results\n        </Button>\n        \n        <Button onClick={onDownloadReport} variant=\"outline\" className=\"flex items-center gap-2\">\n          <Download className=\"w-4 h-4\" />\n          Download Report\n        </Button>\n        \n        <Button \n          onClick={() => navigate('/student/assessment')} \n          variant=\"outline\"\n          className=\"flex items-center gap-2\"\n        >\n          Back to Tests\n        </Button>\n      </div>\n\n      {/* Next Steps */}\n      <Card className=\"bg-blue-50 border-blue-200\">\n        <CardContent className=\"p-4\">\n          <div className=\"text-center\">\n            <h3 className=\"font-medium text-blue-900 mb-2\">What's Next?</h3>\n            <p className=\"text-sm text-blue-800\">\n              • Review your detailed results to understand your performance<br/>\n              • Download your report for your records<br/>\n              • Check with your instructor for feedback and next steps\n            </p>\n          </div>\n        </CardContent>\n      </Card>\n    </div>\n  );\n};\n\nexport default TestCompletionSummary;