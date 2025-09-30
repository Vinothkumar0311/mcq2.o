import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import TestResultNotification from "@/components/TestResultNotification";
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileDown,
  Timer
} from "lucide-react";
import TestCountdown from "@/components/TestCountdown";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

const AdminReports = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [overviewStats, setOverviewStats] = useState({
    totalTests: 0,
    completedTests: 0,
    totalStudents: 0,
    averageScore: 0
  });
  const [selectedTest, setSelectedTest] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [showStudentResults, setShowStudentResults] = useState(false);

  const timePeriods = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "last3months", label: "Last 3 Months" }
  ];

  const statsDisplay = [
    { title: "Total Tests", value: overviewStats.totalTests, icon: FileText, color: "blue" },
    { title: "Completed Tests", value: overviewStats.completedTests, icon: CheckCircle, color: "green" },
    { title: "Total Students", value: overviewStats.totalStudents, icon: Users, color: "purple" },
    { title: "Average Score", value: `${overviewStats.averageScore}%`, icon: TrendingUp, color: "orange" }
  ];

  const downloadTestReport = async (testId: string, testName: string, reportType: 'detailed' | 'assessment' = 'detailed') => {
    try {
      setDownloading(prev => ({ ...prev, [testId]: true }));
      
      const endpoint = reportType === 'detailed' 
        ? `${API_BASE_URL}/api/reports/download-test-report/${testId}`
        : `${API_BASE_URL}/api/reports/download-assessment/${testId}`;
      
      console.log('📄 Downloading report from:', endpoint);
      
      const response = await axios.get(endpoint, {
        responseType: 'blob',
        timeout: 30000,
        headers: {
          'Accept': 'application/pdf, application/octet-stream'
        }
      });
      
      if (response.data.size === 0) {
        throw new Error('Empty file received from server');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = reportType === 'detailed' 
        ? `${testName.replace(/\s+/g, '_')}_Detailed_Report.pdf`
        : `${testName.replace(/\s+/g, '_')}_Assessment_Report.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `${testName} ${reportType} report downloaded successfully.`,
      });
    } catch (error) {
      console.error('❌ Error downloading report:', error);
      
      let errorMessage = "Failed to download report. Please try again.";
      
      if (error.response?.status === 404) {
        errorMessage = "Report not found. The test may not have any completed results.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error while generating report. Please contact support.";
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      }
      
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDownloading(prev => ({ ...prev, [testId]: false }));
    }
  };

  const downloadBulkReport = async () => {
    try {
      setDownloading(prev => ({ ...prev, 'bulk': true }));
      
      const response = await axios.get(`${API_BASE_URL}/api/reports/download-bulk-report`, {
        params: { period: selectedPeriod },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bulk_Test_Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Bulk Download Complete",
        description: `Bulk report for ${selectedPeriod} downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error downloading bulk report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download bulk report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloading(prev => ({ ...prev, 'bulk': false }));
    }
  };

  const fetchTestHistory = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching test history from:', `${API_BASE_URL}/api/reports/test-history`);
      
      const response = await axios.get(`${API_BASE_URL}/api/reports/test-history`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Response received:', response.status, response.data);
      
      if (response.data && response.data.success && response.data.data) {
        const tests = response.data.data.map(test => ({
          testId: test.testId,
          testName: test.testName,
          description: test.description,
          createdDate: new Date(test.createdDate).toLocaleDateString(),
          createdDateTime: test.createdDate,
          totalAttempts: test.totalAttempts || 0,
          completedAttempts: test.completedAttempts || 0,
          averageScore: test.averageScore || 0,
          status: test.status || 'active',
          lastAttempt: test.lastAttempt ? new Date(test.lastAttempt).toLocaleDateString() : 'No attempts',
          hasResults: test.hasResults || false
        }));
        
        console.log('📋 Processed tests:', tests.length);
        setTestHistory(tests);
        setFilteredHistory(tests);
        
        const totalTests = tests.length;
        const completedTests = tests.filter(t => t.completedAttempts > 0).length;
        const totalStudents = tests.reduce((sum, t) => sum + t.completedAttempts, 0);
        const avgScore = tests.length > 0 ? 
          Math.round(tests.reduce((sum, t) => sum + t.averageScore, 0) / tests.length) : 0;
        
        setOverviewStats({
          totalTests,
          completedTests,
          totalStudents,
          averageScore: avgScore
        });
        
        toast({
          title: "Success",
          description: `Loaded ${tests.length} tests successfully.`,
        });
      } else {
        console.error('❌ Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Error fetching test history:', error);
      
      let errorMessage = "Failed to fetch test history. Please try again.";
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your network connection.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTestHistory = () => {
    let filtered = [...testHistory];
    
    if (searchTerm) {
      filtered = filtered.filter(test => 
        test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.testId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      switch (selectedPeriod) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'last7days':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30days':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last3months':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(test => new Date(test.createdDateTime) >= cutoffDate);
      }
    }
    
    setFilteredHistory(filtered);
  };
  
  const refreshData = async () => {
    const isConnected = await testConnection();
    if (isConnected) {
      await fetchTestHistory();
    }
  };

  const viewStudentResults = async (testId: string, testName: string) => {
    try {
      setSelectedTest({ testId, testName });
      setShowStudentResults(true);
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/test-results/${testId}/students`);
      
      if (response.data && response.data.success) {
        setStudentResults(response.data.results || []);
      } else {
        throw new Error('Failed to fetch student results');
      }
    } catch (error) {
      console.error('Error fetching student results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student results",
        variant: "destructive"
      });
    }
  };

  const downloadStudentReport = async (studentId: string, studentName: string, studentData?: any) => {
    try {
      // Try API first, fallback to local generation
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/admin/student-report/${selectedTest.testId}/${studentId}`,
          { responseType: 'blob' }
        );
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${studentName}_${selectedTest.testName}_Report.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Complete",
          description: `${studentName}'s report downloaded successfully.`,
        });
        return;
      } catch (apiError) {
        console.log('API download failed, generating local report:', apiError);
      }
      
      // Generate comprehensive PDF locally
      const student = studentData || studentResults.find(s => s.studentId === studentId);
      if (!student) {
        throw new Error('Student data not found');
      }
      
      const pdf = new jsPDF();
      let y = 20;
      
      // Header
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('COMPREHENSIVE STUDENT REPORT', 105, 25, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Generated on ' + new Date().toLocaleString(), 105, 32, { align: 'center' });
      
      y = 50;
      pdf.setTextColor(0, 0, 0);
      
      // Student Details
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
      pdf.text('Name: ' + studentName, 15, y + 8);
      pdf.text('Email: ' + (student.studentEmail || 'N/A'), 15, y + 16);
      pdf.text('Department: ' + (student.department || 'N/A'), 15, y + 24);
      pdf.text('SIN: ' + (student.sin || 'N/A'), 110, y + 8);
      
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
      pdf.text('Test Name: ' + selectedTest.testName, 15, y + 8);
      pdf.text('Date: ' + new Date(student.completedAt).toLocaleDateString(), 15, y + 16);
      pdf.text('Time: ' + new Date(student.completedAt).toLocaleTimeString(), 15, y + 24);
      pdf.text('Test ID: ' + selectedTest.testId, 110, y + 8);
      
      y += 40;
      
      // Overall Score
      const isPassed = student.percentage >= 60;
      
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
      pdf.text('Score: ' + student.totalScore + '/' + student.maxScore, 15, y + 10);
      pdf.text('Percentage: ' + student.percentage + '%', 15, y + 20);
      
      pdf.setTextColor(isPassed ? 22 : 220, isPassed ? 163 : 38, isPassed ? 74 : 38);
      pdf.text('Status: ' + (isPassed ? '✓ PASS' : '✗ FAIL'), 110, y + 15);
      
      y += 35;
      
      // MCQ Section
      if (student.mcqResults && student.mcqResults.totalQuestions > 0) {
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
        pdf.text('MCQ SECTION: EACH QUESTION, SELECTED ANSWER, CORRECT ANSWER & EXPLANATION', 15, y + 4);
        
        y += 15;
        pdf.setTextColor(0, 0, 0);
        
        // MCQ Summary
        pdf.setFillColor(239, 246, 255);
        pdf.rect(10, y, 190, 25, 'F');
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Questions: ${student.mcqResults.totalQuestions}`, 15, y + 8);
        pdf.text(`Correct Answers: ${student.mcqResults.correctAnswers}`, 15, y + 16);
        pdf.text(`Wrong Answers: ${student.mcqResults.totalQuestions - student.mcqResults.correctAnswers - student.mcqResults.unansweredCount}`, 110, y + 8);
        pdf.text(`Unanswered: ${student.mcqResults.unansweredCount}`, 110, y + 16);
        
        y += 35;
      }
      
      // Coding Section
      if (student.codingResults && student.codingResults.length > 0) {
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
        
        student.codingResults.forEach((codingResult, index) => {
          if (y > 200) {
            pdf.addPage();
            y = 20;
          }
          
          const isPassed = codingResult.testCasesPassed === codingResult.totalTestCases;
          
          pdf.setFillColor(isPassed ? 220 : 254, isPassed ? 252 : 226, isPassed ? 231 : 226);
          pdf.rect(10, y, 190, 60, 'F');
          
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
            const codeLines = pdf.splitTextToSize(`Submitted Code: ${codingResult.submittedCode.substring(0, 300)}...`, 180);
            pdf.text(codeLines, 15, y + 40);
          }
          
          y += 70;
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
      
      if (student.mcqResults) {
        correctCount += student.mcqResults.correctAnswers;
        totalCount += student.mcqResults.totalQuestions;
      }
      
      if (student.codingResults) {
        const codingCorrect = student.codingResults.filter(cr => cr.testCasesPassed === cr.totalTestCases).length;
        correctCount += codingCorrect;
        totalCount += student.codingResults.length;
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
      
      pdf.save(`${studentName.replace(/\s+/g, '_')}_${selectedTest.testName.replace(/\s+/g, '_')}_Comprehensive_Report.pdf`);
      
      toast({
        title: "Download Complete",
        description: `${studentName}'s comprehensive report downloaded successfully.`,
      });
      
    } catch (error) {
      console.error('Error downloading student report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download student report",
        variant: "destructive"
      });
    }
  };

  const testConnection = async () => {
    try {
      console.log('🔍 Testing API connection...');
      const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
      console.log('✅ API connection successful:', response.data);
      return true;
    } catch (error) {
      console.error('❌ API connection failed:', error);
      toast({
        title: "Connection Error",
        description: "Cannot connect to the backend server. Please check if it's running on port 5000.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const isConnected = await testConnection();
      if (isConnected) {
        await fetchTestHistory();
      }
    };
    
    initializeData();
  }, []);
  
  useEffect(() => {
    filterTestHistory();
  }, [searchTerm, selectedPeriod, testHistory]);

  return (
    <AdminLayout>
      <TestResultNotification />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Reports Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and download test assessment reports</p>
            <p className="text-sm text-gray-500 mt-1">API URL: {API_BASE_URL}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={testConnection} 
              variant="outline" 
              size="sm"
            >
              Test Connection
            </Button>
            <Button 
              onClick={downloadBulkReport} 
              variant="outline" 
              disabled={downloading['bulk'] || filteredHistory.length === 0}
            >
              {downloading['bulk'] ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download All
            </Button>
            <Button onClick={refreshData} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by test name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  {timePeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Test History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Test History
              </div>
              <Badge variant="secondary">
                {filteredHistory.length} tests
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading test history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedPeriod !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Test history will appear here when tests are created'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                  <div className="col-span-4">Test Information</div>
                  <div className="col-span-2">Created Date</div>
                  <div className="col-span-2">Attempts</div>
                  <div className="col-span-2">Avg Score</div>
                  <div className="col-span-2">Actions</div>
                </div>
                
                {/* Table Rows */}
                {filteredHistory.map((test) => (
                  <div key={test.testId} className="grid grid-cols-12 gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="col-span-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{test.testName}</h3>
                          <p className="text-sm text-gray-500">{test.testId}</p>
                          <Badge 
                            variant={test.status === 'active' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {test.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center">
                      <div>
                        <div className="flex items-center gap-1 text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{test.createdDate}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {test.lastAttempt !== 'No attempts' ? `Last: ${test.lastAttempt}` : 'No attempts yet'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {test.completedAttempts}
                        </div>
                        <p className="text-xs text-gray-500">
                          of {test.totalAttempts} total
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {test.averageScore}%
                        </div>
                        <p className="text-xs text-gray-500">
                          {test.completedAttempts > 0 ? 'average' : 'no data'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center gap-1">
                      {test.testInProgress ? (
                        <div className="flex-1">
                          <TestCountdown 
                            testId={test.testId} 
                            testName={test.testName}
                            onComplete={() => {
                              setTimeout(refreshData, 1000);
                            }}
                          />
                        </div>
                      ) : test.hasResults ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => downloadTestReport(test.testId, test.testName, 'detailed')}
                            disabled={downloading[test.testId]}
                            className="flex-1 text-xs"
                            title="Download Detailed Report"
                          >
                            {downloading[test.testId] ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <FileDown className="w-3 h-3 mr-1" />
                                Detailed
                              </>
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadTestReport(test.testId, test.testName, 'assessment')}
                            disabled={downloading[test.testId]}
                            className="flex-1 text-xs"
                            title="Download Assessment Report"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Assessment
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewStudentResults(test.testId, test.testName)}
                            className="px-2"
                            title="View Student Results"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex-1 text-center text-sm text-gray-500">
                          No results available
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Results Modal */}
        {showStudentResults && selectedTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Student Results: {selectedTest.testName}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {studentResults.length} student{studentResults.length !== 1 ? 's' : ''} completed this test
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowStudentResults(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {studentResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                    <p className="text-gray-500">No students have completed this test yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Results Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                      <div className="col-span-3">Student Information</div>
                      <div className="col-span-2">Completion Date</div>
                      <div className="col-span-2">Overall Score</div>
                      <div className="col-span-2">MCQ Performance</div>
                      <div className="col-span-2">Coding Performance</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                    
                    {/* Results Table Rows */}
                    {studentResults.map((result, index) => {
                      const totalTestCases = result.codingResults ? result.codingResults.reduce((sum, cr) => sum + cr.totalTestCases, 0) : 0;
                      const passedTestCases = result.codingResults ? result.codingResults.reduce((sum, cr) => sum + cr.testCasesPassed, 0) : 0;
                      const successRate = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;
                      
                      return (
                        <div key={index} className="grid grid-cols-12 gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all">
                          <div className="col-span-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {result.studentName?.charAt(0) || 'S'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{result.studentName || 'Unknown Student'}</h4>
                                <p className="text-sm text-gray-500">{result.studentEmail || 'No email'}</p>
                                <p className="text-xs text-gray-400">ID: {result.studentId}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-2 flex items-center">
                            <div>
                              <div className="flex items-center gap-1 text-gray-900">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">
                                  {new Date(result.completedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(result.completedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="col-span-2 flex items-center">
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                result.percentage >= 80 ? 'text-green-600' :
                                result.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {result.percentage}%
                              </div>
                              <p className="text-xs text-gray-500">
                                {result.totalScore}/{result.maxScore} points
                              </p>
                              <Badge className={`mt-1 text-xs ${
                                result.percentage >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {result.percentage >= 60 ? 'PASS' : 'FAIL'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="col-span-2 flex items-center">
                            {result.mcqResults ? (
                              <div className="text-center">
                                <div className="text-lg font-semibold text-blue-600">
                                  {result.mcqResults.correctAnswers}/{result.mcqResults.totalQuestions}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {Math.round((result.mcqResults.correctAnswers / result.mcqResults.totalQuestions) * 100)}% accuracy
                                </p>
                                <p className="text-xs text-gray-400">
                                  {result.mcqResults.unansweredCount} unanswered
                                </p>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-sm">
                                No MCQ
                              </div>
                            )}
                          </div>
                          
                          <div className="col-span-2 flex items-center">
                            {result.codingResults && result.codingResults.length > 0 ? (
                              <div className="text-center">
                                <div className="text-lg font-semibold text-purple-600">
                                  {passedTestCases}/{totalTestCases}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {successRate}% test cases
                                </p>
                                <p className="text-xs text-gray-400">
                                  {result.codingResults.length} question{result.codingResults.length !== 1 ? 's' : ''}
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
                              onClick={() => downloadStudentReport(result.studentId, result.studentName)}
                              className="w-full text-xs"
                              title="Download Student Report"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;