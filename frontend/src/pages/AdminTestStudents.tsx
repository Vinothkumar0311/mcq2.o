import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Download, 
  Calendar, 
  Users, 
  TrendingUp,
  Eye,
  FileText,
  Code
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

interface StudentResult {
  studentId: string;
  studentName: string;
  studentEmail: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  mcqResults?: {
    totalQuestions: number;
    correctAnswers: number;
    unansweredCount: number;
  };
  codingResults?: Array<{
    questionName: string;
    testCasesPassed: number;
    totalTestCases: number;
    score: number;
    maxScore: number;
    grade: string;
  }>;
}

const AdminTestStudents = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [testInfo, setTestInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (testId) {
      fetchStudentResults();
    }
  }, [testId]);

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      console.log('Fetching student results for test:', testId);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/test-results/${testId}/students`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Student results data:', data);
      
      if (data.success) {
        setStudents(data.results || []);
        setTestInfo(data.testInfo || { testName: `Test ${testId}` });
      } else {
        throw new Error(data.message || 'Failed to fetch student results');
      }
    } catch (error) {
      console.error('Error fetching student results:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch student results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadStudentReport = async (studentId: string, studentName: string) => {
    try {
      setDownloading(studentId);
      
      const response = await fetch(
        `${API_BASE_URL}/api/admin/student-report/${testId}/${studentId}`,
        { 
          method: 'GET',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studentName.replace(/\s+/g, '_')}_${testInfo?.testName?.replace(/\s+/g, '_') || 'Test'}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `${studentName}'s report downloaded successfully`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download student report",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const downloadAllReports = async () => {
    try {
      setDownloading('all');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/test-reports/${testId}/download-all`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${testInfo?.testName?.replace(/\s+/g, '_') || 'Test'}_All_Students_Reports.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "All student reports downloaded successfully",
      });
    } catch (error) {
      console.error('Download all error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download all reports",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading student results...</p>
        </div>
      </AdminLayout>
    );
  }

  const totalStudents = students.length;
  const avgScore = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.percentage, 0) / totalStudents) : 0;
  const passedStudents = students.filter(s => s.percentage >= 60).length;
  const failedStudents = totalStudents - passedStudents;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/test-reports')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {testInfo?.testName || `Test ${testId}`} - Student Results
              </h1>
              <p className="text-gray-600 mt-1">
                {totalStudents} student{totalStudents !== 1 ? 's' : ''} completed this test
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={downloadAllReports}
              disabled={downloading === 'all' || totalStudents === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {downloading === 'all' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download All Reports
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{passedStudents}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{failedStudents}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-purple-600">{avgScore}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalStudents === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-500">No students have completed this test yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                  <div className="col-span-3">Student Information</div>
                  <div className="col-span-2">Completion Date</div>
                  <div className="col-span-2">Overall Score</div>
                  <div className="col-span-2">MCQ Performance</div>
                  <div className="col-span-2">Coding Performance</div>
                  <div className="col-span-1">Actions</div>
                </div>
                
                {/* Table Rows */}
                {students.map((student, index) => {
                  const totalTestCases = student.codingResults ? 
                    student.codingResults.reduce((sum, cr) => sum + cr.totalTestCases, 0) : 0;
                  const passedTestCases = student.codingResults ? 
                    student.codingResults.reduce((sum, cr) => sum + cr.testCasesPassed, 0) : 0;
                  const codingSuccessRate = totalTestCases > 0 ? 
                    Math.round((passedTestCases / totalTestCases) * 100) : 0;
                  
                  return (
                    <div key={index} className="grid grid-cols-12 gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all">
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {student.studentName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{student.studentName || 'Unknown Student'}</h4>
                            <p className="text-sm text-gray-500">{student.studentEmail || 'No email'}</p>
                            <p className="text-xs text-gray-400">ID: {student.studentId}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <div>
                          <div className="flex items-center gap-1 text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {new Date(student.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(student.completedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            student.percentage >= 80 ? 'text-green-600' :
                            student.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {student.percentage}%
                          </div>
                          <p className="text-xs text-gray-500">
                            {student.totalScore}/{student.maxScore} points
                          </p>
                          <Badge className={`mt-1 text-xs ${
                            student.percentage >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {student.percentage >= 60 ? 'PASS' : 'FAIL'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        {student.mcqResults ? (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {student.mcqResults.correctAnswers}/{student.mcqResults.totalQuestions}
                            </div>
                            <p className="text-xs text-gray-500">
                              {student.percentage}% overall
                            </p>
                            <p className="text-xs text-gray-400">
                              {student.mcqResults.unansweredCount} unanswered
                            </p>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 text-sm">
                            No MCQ
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        {student.codingResults && student.codingResults.length > 0 ? (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              {passedTestCases}/{totalTestCases}
                            </div>
                            <p className="text-xs text-gray-500">
                              {codingSuccessRate}% test cases
                            </p>
                            <p className="text-xs text-gray-400">
                              {student.codingResults.length} question{student.codingResults.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 text-sm">
                            No Coding
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-1 flex items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadStudentReport(student.studentId, student.studentName)}
                          disabled={downloading === student.studentId}
                          className="w-full text-xs"
                          title="Download Student Report"
                        >
                          {downloading === student.studentId ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTestStudents;