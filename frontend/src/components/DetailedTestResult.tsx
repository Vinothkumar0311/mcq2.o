import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Download, Home } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';

interface DetailedResult {
  testId: string;
  testName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  mcqResults?: any;
  codingResults?: any[];
  completedAt: string;
}

const DetailedTestResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<DetailedResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailedResults = async () => {
      try {
        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId') || '1';
        const response = await fetch(`http://localhost:5000/api/test-result/${testId}/student/${studentId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.results) {
            setResult(data.results);
          }
        }
      } catch (error) {
        console.error('Error fetching detailed results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedResults();
  }, [testId]);

  const downloadPDFReport = async () => {
    try {
      const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId') || '1';
      
      console.log('📥 Downloading PDF report for student:', studentId, 'test:', testId);
      
      const response = await fetch(`http://localhost:5000/api/comprehensive-report/student/${testId}/${studentId}/download-report`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Test_Report_${testId}_${studentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ PDF report downloaded successfully');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Download failed:', errorData);
        
        if (response.status === 403) {
          alert('📋 Report not available. Results have not been released by the admin yet.');
        } else {
          alert(`❌ Error downloading report: ${errorData.error || 'Please try again.'}`);
        }
      }
    } catch (error) {
      console.error('❌ Error downloading report:', error);
      alert('❌ Network error downloading report. Please check your connection and try again.');
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="p-6 text-center">Loading detailed results...</div>
      </StudentLayout>
    );
  }

  if (!result) {
    return (
      <StudentLayout>
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Results Not Available</h2>
          <Button onClick={() => navigate('/student/assessment')}>Back to Dashboard</Button>
        </div>
      </StudentLayout>
    );
  }

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

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">🎉 Test Results</CardTitle>
            <p className="text-blue-100 text-xl">{result.testName}</p>
            <p className="text-sm text-blue-200">
              Completed on {new Date(result.completedAt).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{result.percentage}%</div>
              <div className="text-xl mb-4">
                {result.percentage >= 60 ? '🎊 CONGRATULATIONS! YOU PASSED!' : '📚 KEEP PRACTICING!'}
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
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">📊 Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{result.totalScore}/{result.maxScore}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{result.percentage}%</div>
                <div className="text-sm text-gray-600">Percentage</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{getGradeLetter(result.percentage)}</div>
                <div className="text-sm text-gray-600">Grade</div>
              </div>
              <div className={`p-4 rounded-lg ${result.percentage >= 60 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`text-3xl font-bold ${result.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.percentage >= 60 ? '✅ PASS' : '❌ FAIL'}
                </div>
                <div className="text-sm text-gray-600">Result</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MCQ Results */}
        {result.mcqResults && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-xl">📝 MCQ Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.mcqResults.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.mcqResults.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.mcqResults.wrongAnswers}</div>
                  <div className="text-sm text-gray-600">Wrong</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{result.mcqResults.unansweredCount}</div>
                  <div className="text-sm text-gray-600">Unanswered</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coding Results */}
        {result.codingResults && result.codingResults.length > 0 && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-xl">💻 Coding Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.codingResults.map((coding: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">Q{index + 1}: {coding.questionName}</h3>
                        <p className="text-sm text-gray-600">{coding.language}</p>
                      </div>
                      <Badge className={coding.percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {coding.percentage}% ({coding.testCasesPassed}/{coding.totalTestCases})
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Score:</span> {coding.score}/{coding.maxScore}
                      </div>
                      <div>
                        <span className="font-medium">Grade:</span> {coding.grade}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {coding.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default DetailedTestResult;