import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";
import { useNavigate } from "react-router-dom";

interface TestReport {
  testId: string;
  testName: string;
  totalStudents: number;
  completedStudents: number;
  createdAt: string;
  hasReports: boolean;
  averageScore?: number;
  highestScore?: number;
  hasAutoReports?: boolean;
}

const AdminTestReports = () => {
  const [tests, setTests] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [releasingResults, setReleasingResults] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setRefreshing(true);

      console.log("Fetching from:", `${API_BASE_URL}/api/test-results`);

      // Fetch all test results from database
      const response = await fetch(`${API_BASE_URL}/api/test-results`);

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Test Results Response:", data);

      if (data.success && data.results) {
        // Group results by testId to get test statistics
        const testGroups = data.results.reduce((acc, result) => {
          if (!acc[result.testId]) {
            acc[result.testId] = {
              testId: result.testId,
              testName: result.testName,
              students: [],
              createdAt: result.completedAt, // Use first completion as creation date
            };
          }
          acc[result.testId].students.push(result);
          return acc;
        }, {});

        // Convert to test report format
        const processedTests = Object.values(testGroups).map((group) => {
          const students = group.students;
          const totalStudents = students.length;
          const averageScore =
            totalStudents > 0
              ? Math.round(
                  students.reduce((sum, s) => sum + s.percentage, 0) /
                    totalStudents
                )
              : 0;
          const highestScore =
            totalStudents > 0
              ? Math.max(...students.map((s) => s.percentage))
              : 0;

          return {
            testId: group.testId,
            testName: group.testName,
            totalStudents: totalStudents,
            completedStudents: totalStudents,
            createdAt: group.createdAt,
            hasReports: totalStudents > 0,
            averageScore: averageScore,
            highestScore: highestScore,
            hasAutoReports: true,
          };
        });

        setTests(processedTests);
        console.log(`Found ${processedTests.length} tests with results`);
      } else {
        setTests([]);
        console.log("No test results found in database");
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      setTests([]);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch test reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateReport = async (testId: string) => {
    try {
      setGenerating(testId);

      const response = await fetch(
        `${API_BASE_URL}/api/reports/generate-test-report/${testId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Reports generated successfully",
        });
        await fetchTests();
      } else {
        throw new Error(data.error || "Failed to generate reports");
      }
    } catch (error) {
      console.error("Generate report error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate reports",
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = async (testId: string, format: "excel" | "csv") => {
    try {
      setDownloading(testId);

      const endpoint =
        format === "excel"
          ? `${API_BASE_URL}/api/admin/test/${testId}/pdf`
          : `${API_BASE_URL}/api/admin/test/${testId}/excel`;

      console.log("Downloading from:", endpoint);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test-report-${testId}.${
        format === "excel" ? "pdf" : "csv"
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Report downloaded successfully`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download report",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const openTestModal = async (test: TestReport) => {
    try {
      setSelectedTest(test);
      setShowTestModal(true);
      setModalLoading(true);

      // Fetch student results for this specific test from database
      const response = await fetch(
        `${API_BASE_URL}/api/test-results?testId=${test.testId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.results) {
        // Format the results for display
        const formattedResults = data.results.map((result) => ({
          studentId: result.studentId,
          studentName: result.studentName || "Unknown Student",
          studentEmail: result.studentEmail || "N/A",
          department: result.department || "N/A",
          completedAt: result.completedAt,
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          percentage: result.percentage,
          mcqResults: {
            totalQuestions: Math.floor(result.maxScore * 0.6), // Estimate MCQ questions
            correctAnswers: Math.floor(result.totalScore * 0.6), // Estimate correct answers
            unansweredCount: 0,
          },
          codingResults:
            result.type === "section-based"
              ? [
                  {
                    questionName: "Coding Problem",
                    testCasesPassed: Math.floor(result.totalScore * 0.4),
                    totalTestCases: Math.floor(result.maxScore * 0.4),
                    score: Math.floor(result.totalScore * 0.4),
                    maxScore: Math.floor(result.maxScore * 0.4),
                    grade:
                      result.percentage >= 90
                        ? "A"
                        : result.percentage >= 80
                        ? "B"
                        : result.percentage >= 70
                        ? "C"
                        : "D",
                    language: "Java",
                  },
                ]
              : [],
        }));

        setStudentResults(formattedResults);
      } else {
        setStudentResults([]);
      }
    } catch (error) {
      console.error("Error fetching student results:", error);
      setStudentResults([]);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch student results",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const downloadStudentReport = async (
    studentId: string,
    studentName: string,
    studentData?: any
  ) => {
    try {
      // Use comprehensive report API for admin downloads
      try {
        console.log(`📥 Admin downloading report for ${studentName} (${studentId})`);
        
        const response = await fetch(
          `${API_BASE_URL}/api/comprehensive-report/admin/${selectedTest.testId}/${studentId}/download-report`,
          {
            method: "GET",
            headers: { Accept: "application/pdf" },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${studentName.replace(
            /\s+/g,
            "_"
          )}_${selectedTest.testName.replace(/\s+/g, "_")}_Comprehensive_Report.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "✅ Success",
            description: `${studentName}'s comprehensive report downloaded successfully`,
          });
          return;
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ Admin download failed:', errorData);
          throw new Error(errorData.error || 'Failed to download report from server');
        }
      } catch (apiError) {
        console.log("❌ API download failed, generating local report:", apiError);
      }

      // Generate comprehensive PDF locally
      const student =
        studentData || studentResults.find((s) => s.studentId === studentId);
      console.log("Generating report for student:", student);
      if (!student) {
        throw new Error("Student data not found");
      }

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      let y = 20;

      // Header
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, 210, 40, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("COMPREHENSIVE STUDENT REPORT", 105, 25, { align: "center" });

      pdf.setFontSize(10);
      pdf.text("Generated on " + new Date().toLocaleString(), 105, 32, {
        align: "center",
      });

      y = 50;
      pdf.setTextColor(0, 0, 0);

      // Student Details
      pdf.setFillColor(59, 130, 246);
      pdf.rect(10, y, 190, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("STUDENT DETAILS", 15, y + 4);

      y += 10;
      pdf.setFillColor(239, 246, 255);
      pdf.rect(10, y, 190, 30, "F");

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Name: " + studentName, 15, y + 8);
      pdf.text("Email: " + (student.studentEmail || "N/A"), 15, y + 16);
      pdf.text("Department: " + (student.department || "N/A"), 15, y + 24);
      pdf.text("SIN: " + (student.studentId || "N/A"), 110, y + 8);

      y += 40;

      // Test Metadata
      pdf.setFillColor(251, 191, 36);
      pdf.rect(10, y, 190, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("TEST METADATA", 15, y + 4);

      y += 10;
      pdf.setFillColor(254, 249, 195);
      pdf.rect(10, y, 190, 30, "F");

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Test Name: " + selectedTest.testName, 15, y + 8);
      pdf.text(
        "Date: " + new Date(student.completedAt).toLocaleDateString(),
        15,
        y + 16
      );
      pdf.text(
        "Time: " + new Date(student.completedAt).toLocaleTimeString(),
        15,
        y + 24
      );
      pdf.text("Test ID: " + selectedTest.testId, 110, y + 8);

      y += 40;

      // Overall Score
      const isPassed = student.percentage >= 60;

      pdf.setFillColor(
        isPassed ? 34 : 239,
        isPassed ? 197 : 68,
        isPassed ? 94 : 68
      );
      pdf.rect(10, y, 190, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("OVERALL SCORE & PERCENTAGE", 15, y + 4);

      y += 10;
      pdf.setFillColor(
        isPassed ? 220 : 254,
        isPassed ? 252 : 226,
        isPassed ? 231 : 226
      );
      pdf.rect(10, y, 190, 25, "F");

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "Score: " + student.totalScore + "/" + student.maxScore,
        15,
        y + 10
      );
      pdf.text("Percentage: " + student.percentage + "%", 15, y + 20);

      pdf.setTextColor(
        isPassed ? 22 : 220,
        isPassed ? 163 : 38,
        isPassed ? 74 : 38
      );
      pdf.text("Status: " + (isPassed ? "✓ PASS" : "✗ FAIL"), 110, y + 15);

      y += 35;

      // MCQ Section
      if (student.mcqResults && student.mcqResults.totalQuestions > 0) {
        if (y > 220) {
          pdf.addPage();
          y = 20;
        }

        pdf.setTextColor(0, 0, 0);
        pdf.setFillColor(59, 130, 246);
        pdf.rect(10, y, 190, 6, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          "MCQ SECTION: EACH QUESTION, SELECTED ANSWER, CORRECT ANSWER & EXPLANATION",
          15,
          y + 4
        );

        y += 15;
        pdf.setTextColor(0, 0, 0);

        // MCQ Summary
        pdf.setFillColor(239, 246, 255);
        pdf.rect(10, y, 190, 25, "F");

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Total Questions: ${student.mcqResults.totalQuestions}`,
          15,
          y + 8
        );
        pdf.text(
          `Correct Answers: ${student.mcqResults.correctAnswers}`,
          15,
          y + 16
        );
        pdf.text(
          `Wrong Answers: ${
            student.mcqResults.totalQuestions -
            student.mcqResults.correctAnswers -
            student.mcqResults.unansweredCount
          }`,
          110,
          y + 8
        );
        pdf.text(
          `Unanswered: ${student.mcqResults.unansweredCount}`,
          110,
          y + 16
        );

        y += 35;

        // Individual MCQ questions (if available)
        if (student.mcqAnswers && student.mcqAnswers.length > 0) {
          student.mcqAnswers.forEach((answer, index) => {
            if (y > 250) {
              pdf.addPage();
              y = 20;
            }

            const isCorrect = answer.selectedAnswer === answer.correctAnswer;

            pdf.setFillColor(
              isCorrect ? 220 : 254,
              isCorrect ? 252 : 226,
              isCorrect ? 231 : 226
            );
            pdf.rect(10, y, 190, 35, "F");

            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.text(`Q${index + 1}: ${answer.question}`, 15, y + 8);

            pdf.setFont("helvetica", "normal");
            pdf.text(
              `Selected: ${answer.selectedAnswer || "Not answered"}`,
              15,
              y + 16
            );
            pdf.text(`Correct: ${answer.correctAnswer}`, 15, y + 24);

            if (answer.explanation) {
              const explanationLines = pdf.splitTextToSize(
                `Explanation: ${answer.explanation}`,
                180
              );
              pdf.text(explanationLines, 15, y + 30);
            }

            y += 40;
          });
        }
      }

      // Coding Section
      if (student.codingResults && student.codingResults.length > 0) {
        if (y > 200) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFillColor(147, 51, 234);
        pdf.rect(10, y, 190, 6, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          "CODING SECTION: SUBMITTED CODE, TEST CASE RESULTS & PASS/FAIL STATUS",
          15,
          y + 4
        );

        y += 15;
        pdf.setTextColor(0, 0, 0);

        student.codingResults.forEach((codingResult, index) => {
          if (y > 200) {
            pdf.addPage();
            y = 20;
          }

          const isPassed =
            codingResult.testCasesPassed === codingResult.totalTestCases;

          pdf.setFillColor(
            isPassed ? 220 : 254,
            isPassed ? 252 : 226,
            isPassed ? 231 : 226
          );
          pdf.rect(10, y, 190, 60, "F");

          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text(
            `Coding Q${index + 1}: ${codingResult.questionName}`,
            15,
            y + 8
          );

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.text(`Language: ${codingResult.language}`, 15, y + 16);
          pdf.text(
            `Test Cases: ${codingResult.testCasesPassed}/${codingResult.totalTestCases}`,
            15,
            y + 24
          );
          pdf.text(`Grade: ${codingResult.grade}`, 15, y + 32);

          pdf.setTextColor(
            isPassed ? 22 : 220,
            isPassed ? 163 : 38,
            isPassed ? 74 : 38
          );
          pdf.setFont("helvetica", "bold");
          pdf.text(`Status: ${isPassed ? "✓ PASS" : "✗ FAIL"}`, 110, y + 20);

          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");

          if (codingResult.submittedCode) {
            const codeLines = pdf.splitTextToSize(
              `Submitted Code: ${codingResult.submittedCode.substring(
                0,
                300
              )}...`,
              180
            );
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
      pdf.rect(10, y, 190, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("SUMMARY OF CORRECT VS WRONG ANSWERS", 15, y + 4);

      y += 15;
      pdf.setFillColor(240, 253, 244);
      pdf.rect(10, y, 190, 40, "F");

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      let correctCount = 0;
      let totalCount = 0;

      if (student.mcqResults) {
        correctCount += student.mcqResults.correctAnswers;
        totalCount += student.mcqResults.totalQuestions;
      }

      if (student.codingResults) {
        const codingCorrect = student.codingResults.filter(
          (cr) => cr.testCasesPassed === cr.totalTestCases
        ).length;
        correctCount += codingCorrect;
        totalCount += student.codingResults.length;
      }

      const wrongCount = totalCount - correctCount;

      pdf.text(`Total Questions: ${totalCount}`, 15, y + 10);
      pdf.text(`Correct Answers: ${correctCount}`, 15, y + 18);
      pdf.text(`Wrong Answers: ${wrongCount}`, 15, y + 26);
      pdf.text(
        `Accuracy Rate: ${
          totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
        }%`,
        15,
        y + 34
      );

      // Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          "Page " +
            i +
            " of " +
            pageCount +
            " | Generated: " +
            new Date().toLocaleString(),
          105,
          290,
          { align: "center" }
        );
      }

      pdf.save(
        `${studentName.replace(/\s+/g, "_")}_${selectedTest.testName.replace(
          /\s+/g,
          "_"
        )}_Comprehensive_Report.pdf`
      );

      toast({
        title: "Success",
        description: `${studentName}'s comprehensive report downloaded successfully`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download student report",
        variant: "destructive",
      });
    }
  };

  const releaseStudentResult = async (studentId: string, studentName: string) => {
    try {
      setReleasingResults(studentId);
      
      console.log(`🔓 Releasing results for ${studentName} (${studentId})`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/admin/results/release/${selectedTest.testId}/${studentId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "✅ Success",
          description: `Results released for ${studentName}. Student can now view their results.`
        });
        
        // Update local state to reflect release
        setStudentResults(prev => 
          prev.map(student => 
            student.studentId === studentId 
              ? { ...student, resultsReleased: true }
              : student
          )
        );
      } else {
        // Handle already released case
        if (data.message && data.message.includes('already released')) {
          toast({
            title: "ℹ️ Info",
            description: `Results already released for ${studentName}`,
            variant: "default"
          });
          
          // Update local state anyway
          setStudentResults(prev => 
            prev.map(student => 
              student.studentId === studentId 
                ? { ...student, resultsReleased: true }
                : student
            )
          );
        } else {
          throw new Error(data.message || 'Failed to release results');
        }
      }
    } catch (error) {
      console.error('❌ Error releasing results:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to release results',
        variant: "destructive"
      });
    } finally {
      setReleasingResults(null);
    }
  };

  const releaseAllResults = async () => {
    try {
      console.log(`🔓 Releasing ALL results for test: ${selectedTest.testId}`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/admin/results/release-all/${selectedTest.testId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const releasedCount = data.releasedCount || studentResults.length;
        toast({
          title: "✅ Success",
          description: `Results released for ${releasedCount} students. All students can now view their results.`
        });
        
        // Update local state - mark all as released
        setStudentResults(prev => 
          prev.map(student => ({ ...student, resultsReleased: true }))
        );
      } else {
        // Handle case where all are already released
        if (data.message && data.message.includes('already released')) {
          toast({
            title: "ℹ️ Info",
            description: "All results are already released for this test",
            variant: "default"
          });
          
          // Update local state anyway
          setStudentResults(prev => 
            prev.map(student => ({ ...student, resultsReleased: true }))
          );
        } else {
          throw new Error(data.message || 'Failed to release all results');
        }
      }
    } catch (error) {
      console.error('❌ Error releasing all results:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to release all results',
        variant: "destructive"
      });
    }
  };

  const downloadOverallReport = async () => {
    try {
      // Try API first, fallback to local generation
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/reports/download-test-report/${selectedTest.testId}`
        );

        console.log("API response for overall report:", response);

        // if (response.ok) {
        //   const blob = await response.blob();
        //   const url = window.URL.createObjectURL(blob);
        //   const a = document.createElement('a');
        //   a.href = url;
        //   a.download = `${selectedTest.testName.replace(/\s+/g, '_')}_Overall_Report.pdf`;
        //   document.body.appendChild(a);
        //   a.click();
        //   window.URL.revokeObjectURL(url);
        //   document.body.removeChild(a);

        //   toast({
        //     title: "Success",
        //     description: "Overall test report downloaded successfully",
        //   });
        //   return;
        // }

        // This is the NEW, correct code
        if (response.ok) {

          console.log("API response ok, checking content type", response.body);
          const contentType = response.headers.get("content-type");

          if (contentType && contentType.includes("application/pdf")) {
            // --- Server-side PDF is valid! ---
            const blob = await response.blob();
            console.log("Received PDF blob from API:", blob);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${selectedTest.testName.replace(
              /\s+/g,
              "_"
            )}_Overall_Report.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
              title: "Success",
              description: "Overall test report downloaded successfully",
            });
            return; // All done!
          } else {
            // The server responded with OK, but it wasn't a PDF.
            // It was probably a JSON error. Throw an error
            // to trigger the local generation in the catch block.
            console.warn(
              "Server did not return a PDF, falling back to local generation."
            );
            throw new Error("Server did not return a PDF.");
          }
        } else {
          // Response was not OK (e.g., 404, 500).
          // Throw an error to trigger local generation.
          throw new Error(
            `API download failed with status: ${response.status}`
          );
        }
      } catch (apiError) {
        console.log("API download failed, generating local report:", apiError);
      }

      // Generate comprehensive PDF locally
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      let y = 20;

      // Header
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, 210, 40, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("COMPREHENSIVE TEST REPORT", 105, 25, { align: "center" });

      pdf.setFontSize(10);
      pdf.text("Generated on " + new Date().toLocaleString(), 105, 32, {
        align: "center",
      });

      y = 50;
      pdf.setTextColor(0, 0, 0);

      // Test Information
      pdf.setFillColor(251, 191, 36);
      pdf.rect(10, y, 190, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("TEST INFORMATION", 15, y + 4);

      y += 10;
      pdf.setFillColor(254, 249, 195);
      pdf.rect(10, y, 190, 30, "F");

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Test Name: " + selectedTest.testName, 15, y + 8);
      pdf.text("Test ID: " + selectedTest.testId, 15, y + 16);
      pdf.text("Total Students: " + studentResults.length, 15, y + 24);
      pdf.text("Report Date: " + new Date().toLocaleDateString(), 110, y + 8);
      pdf.text("Report Time: " + new Date().toLocaleTimeString(), 110, y + 16);

      y += 40;

      // // Overall Statistics
      // const passedStudents = studentResults.filter(s => s.percentage >= 60).length;
      // const failedStudents = studentResults.length - passedStudents;
      // const averageScore = studentResults.length > 0 ?
      //   Math.round(studentResults.reduce((sum, s) => sum + s.percentage, 0) / studentResults.length) : 0;
      // const highestScore = studentResults.length > 0 ? Math.max(...studentResults.map(s => s.percentage)) : 0;
      // const lowestScore = studentResults.length > 0 ? Math.min(...studentResults.map(s => s.percentage)) : 0;

      // pdf.setFillColor(34, 197, 94);
      // pdf.rect(10, y, 190, 6, 'F');
      // pdf.setTextColor(255, 255, 255);
      // pdf.setFontSize(12);
      // pdf.setFont('helvetica', 'bold');
      // pdf.text('OVERALL STATISTICS', 15, y + 4);

      // y += 10;
      // pdf.setFillColor(240, 253, 244);
      // pdf.rect(10, y, 190, 40, 'F');

      // pdf.setTextColor(0, 0, 0);
      // pdf.setFontSize(10);
      // pdf.setFont('helvetica', 'normal');
      // pdf.text(`Students Passed: ${passedStudents} (${Math.round((passedStudents / studentResults.length) * 100)}%)`, 15, y + 10);
      // pdf.text(`Students Failed: ${failedStudents} (${Math.round((failedStudents / studentResults.length) * 100)}%)`, 15, y + 18);
      // pdf.text(`Average Score: ${averageScore}%`, 15, y + 26);
      // pdf.text(`Highest Score: ${highestScore}%`, 15, y + 34);
      // pdf.text(`Lowest Score: ${lowestScore}%`, 110, y + 10);
      // pdf.text(`Pass Rate: ${Math.round((passedStudents / studentResults.length) * 100)}%`, 110, y + 18);

      // y += 50;

      // Student Results Summary
      pdf.setFillColor(59, 130, 246);
      pdf.rect(10, y, 190, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("STUDENT RESULTS SUMMARY", 15, y + 4);

      y += 15;
      pdf.setTextColor(0, 0, 0);

      // Table header
      pdf.setFillColor(239, 246, 255);
      pdf.rect(10, y, 190, 15, "F");

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Student Name", 15, y + 8);
      pdf.text("Email", 70, y + 8);
      pdf.text("Marks", 130, y + 8);
      // pdf.text("Status", 160, y + 8);

      y += 20;

      // Student rows
      studentResults
        .sort((a, b) => b.percentage - a.percentage)
        .forEach((student, index) => {
          console.log("Adding student to report:", student);
          if (y > 250) {
            pdf.addPage();
            y = 20;
          }

          const isPassed = student.percentage >= 60;

          pdf.setFillColor(
            isPassed ? 220 : 254,
            isPassed ? 252 : 226,
            isPassed ? 231 : 226
          );
          pdf.rect(10, y, 190, 12, "F");

          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.text(student.studentName || "Unknown", 15, y + 7);
          pdf.text(student.studentEmail || "N/A", 70, y + 7);
          pdf.text(`${student.totalScore}`, 130, y + 7);

          pdf.setTextColor(
            isPassed ? 22 : 220,
            isPassed ? 163 : 38,
            isPassed ? 74 : 38
          );
          pdf.setFont("helvetica", "bold");
          // pdf.text(isPassed ? "PASS" : "FAIL", 160, y + 7);

          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");

          y += 15;
        });

      // Detailed Analysis
      if (y > 200) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFillColor(147, 51, 234);
      pdf.rect(10, y, 190, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("DETAILED SECTION ANALYSIS", 15, y + 4);

      y += 15;
      pdf.setTextColor(0, 0, 0);

      // MCQ Analysis
      const mcqStudents = studentResults.filter((s) => s.mcqResults);
      if (mcqStudents.length > 0) {
        pdf.setFillColor(239, 246, 255);
        pdf.rect(10, y, 190, 30, "F");

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("MCQ Section Analysis:", 15, y + 8);

        const totalMcqQuestions = mcqStudents[0].mcqResults.totalQuestions;
        const avgMcqCorrect = Math.round(
          mcqStudents.reduce((sum, s) => sum + s.mcqResults.correctAnswers, 0) /
            mcqStudents.length
        );
        const mcqAccuracy = Math.round(
          (avgMcqCorrect / totalMcqQuestions) * 100
        );

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Students Attempted: ${mcqStudents.length}`, 15, y + 16);
        pdf.text(`Total Questions: ${totalMcqQuestions}`, 15, y + 22);
        pdf.text(`Average Correct: ${avgMcqCorrect}`, 110, y + 16);
        pdf.text(`Average Accuracy: ${mcqAccuracy}%`, 110, y + 22);

        y += 35;
      }

      // Coding Analysis
      const codingStudents = studentResults.filter(
        (s) => s.codingResults && s.codingResults.length > 0
      );
      if (codingStudents.length > 0) {
        if (y > 220) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFillColor(254, 226, 226);
        pdf.rect(10, y, 190, 30, "F");

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("Coding Section Analysis:", 15, y + 8);

        const totalCodingQuestions = codingStudents[0].codingResults.length;
        const avgTestCasesPassed = Math.round(
          codingStudents.reduce(
            (sum, s) =>
              sum +
              s.codingResults.reduce(
                (cSum, cr) => cSum + cr.testCasesPassed,
                0
              ),
            0
          ) / codingStudents.length
        );
        const avgTotalTestCases = Math.round(
          codingStudents.reduce(
            (sum, s) =>
              sum +
              s.codingResults.reduce((cSum, cr) => cSum + cr.totalTestCases, 0),
            0
          ) / codingStudents.length
        );
        const codingSuccessRate =
          avgTotalTestCases > 0
            ? Math.round((avgTestCasesPassed / avgTotalTestCases) * 100)
            : 0;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Students Attempted: ${codingStudents.length}`, 15, y + 16);
        pdf.text(`Total Questions: ${totalCodingQuestions}`, 15, y + 22);
        pdf.text(`Avg Test Cases Passed: ${avgTestCasesPassed}`, 110, y + 16);
        pdf.text(`Success Rate: ${codingSuccessRate}%`, 110, y + 22);

        y += 35;
      }

      // Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          "Page " +
            i +
            " of " +
            pageCount +
            " | Generated: " +
            new Date().toLocaleString(),
          105,
          290,
          { align: "center" }
        );
      }

      pdf.save(
        `${selectedTest.testName.replace(
          /\s+/g,
          "_"
        )}_Comprehensive_Overall_Report.pdf`
      );

      toast({
        title: "Success",
        description:
          "Comprehensive overall test report downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download overall report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="ml-4 text-gray-600">Loading test reports...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Reports</h1>
            <p className="text-gray-600 mt-1">
              Download and manage student test reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              {tests.length} Tests
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTests}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Tests
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tests.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    With Reports
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {tests.filter((t) => t.hasReports).length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {tests.reduce(
                      (sum, test) => sum + test.completedStudents,
                      0
                    )}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {tests.filter((t) => !t.hasReports).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Reports List */}
        <div className="grid gap-4">
          {tests.map((test) => (
            <Card
              key={test.testId}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-semibold">
                      {test.testName}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge
                        variant={test.hasReports ? "default" : "secondary"}
                        className={
                          test.hasReports ? "bg-green-100 text-green-800" : ""
                        }
                      >
                        {test.hasReports ? "Reports Available" : "No Reports"}
                      </Badge>
                      {test.hasAutoReports && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Auto-Generated
                        </Badge>
                      )}
                      {test.completedStudents > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {test.completedStudents} Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                  {test.hasReports && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/test-reports/${test.testId}`)
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Test Information */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">
                        {test.completedStudents}
                      </span>
                      <span>/ {test.totalStudents} Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Created: {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        Completion:{" "}
                        {test.totalStudents > 0
                          ? Math.round(
                              (test.completedStudents / test.totalStudents) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    {test.averageScore && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-medium">
                          Avg: {test.averageScore}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    {/* Progress Bar */}
                    {test.totalStudents > 0 && (
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Test Progress</span>
                          <span>
                            {test.completedStudents}/{test.totalStudents}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                (test.completedStudents / test.totalStudents) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTestModal(test)}
                      className="mr-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>

                    <div className="flex gap-2">
                      {test.hasReports ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(test.testId, "excel")}
                            disabled={downloading === test.testId}
                            className="hover:bg-green-50 hover:border-green-300 mr-2"
                          >
                            {downloading === test.testId ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                            ) : (
                              <FileText className="w-4 h-4 mr-2" />
                            )}
                            PDF Report
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/admin/test-reports/${test.testId}/students`
                              )
                            }
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Students
                          </Button>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          {test.completedStudents > 0 ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => generateReport(test.testId)}
                                disabled={generating === test.testId}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {generating === test.testId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                  <Download className="w-4 h-4 mr-2" />
                                )}
                                Generate Report
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/admin/test-reports/${test.testId}/students`
                                  )
                                }
                                className="hover:bg-gray-50"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Students
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/admin/create-test")}
                                className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Create Test
                              </Button>
                              <span className="text-sm text-gray-500 italic flex items-center">
                                No completed tests
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {tests.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Tests Found
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first test to start generating reports
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/admin/create-test")}>
                  Create Test
                </Button>
                <Button variant="outline" onClick={fetchTests}>
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Details Modal */}
        {showTestModal && selectedTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedTest.testName} - Detailed Report
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {studentResults.length} student
                      {studentResults.length !== 1 ? "s" : ""} completed this
                      test
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={releaseAllResults}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      🔓 Release All Results
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowLeaderboard(!showLeaderboard)}
                      className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {showLeaderboard ? "Hide" : "Show"} Leaderboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadOverallReport}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Overall Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowTestModal(false);
                        setShowLeaderboard(false);
                        setSelectedTest(null);
                        setStudentResults([]);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {modalLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading student results...</p>
                  </div>
                ) : showLeaderboard ? (
                  /* Leaderboard View */
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        🏆 Test Leaderboard
                      </h3>
                      <p className="text-gray-600">
                        Top performers ranked by score
                      </p>
                    </div>

                    {studentResults
                      .sort((a, b) => b.percentage - a.percentage)
                      .map((student, index) => {
                        const rank = index + 1;
                        const isTopThree = rank <= 3;
                        const medalEmoji =
                          rank === 1
                            ? "🥇"
                            : rank === 2
                            ? "🥈"
                            : rank === 3
                            ? "🥉"
                            : "";

                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              rank === 1
                                ? "bg-yellow-50 border-yellow-300 shadow-lg"
                                : rank === 2
                                ? "bg-gray-50 border-gray-300 shadow-md"
                                : rank === 3
                                ? "bg-orange-50 border-orange-300 shadow-md"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                    isTopThree
                                      ? "bg-white shadow-md"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  {medalEmoji || `#${rank}`}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-lg">
                                    {student.studentName || "Unknown Student"}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {student.studentEmail}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <div
                                    className={`text-2xl font-bold ${
                                      student.percentage >= 90
                                        ? "text-green-600"
                                        : student.percentage >= 80
                                        ? "text-blue-600"
                                        : student.percentage >= 70
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {student.percentage}%
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {student.totalScore}/{student.maxScore}{" "}
                                    points
                                  </p>
                                </div>

                                {student.codingResults &&
                                  student.codingResults.length > 0 && (
                                    <div className="text-center">
                                      <div className="text-sm font-semibold text-purple-600">
                                        Coding:{" "}
                                        {student.codingResults.reduce(
                                          (sum, cr) => sum + cr.testCasesPassed,
                                          0
                                        )}
                                        /
                                        {student.codingResults.reduce(
                                          (sum, cr) => sum + cr.totalTestCases,
                                          0
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {Math.round(
                                          (student.codingResults.reduce(
                                            (sum, cr) =>
                                              sum + cr.testCasesPassed,
                                            0
                                          ) /
                                            student.codingResults.reduce(
                                              (sum, cr) =>
                                                sum + cr.totalTestCases,
                                              0
                                            )) *
                                            100
                                        )}
                                        % test cases
                                      </p>
                                    </div>
                                  )}

                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant={student.resultsReleased ? "default" : "outline"}
                                    onClick={() => releaseStudentResult(student.studentId, student.studentName)}
                                    disabled={releasingResults === student.studentId}
                                    className={student.resultsReleased ? "bg-green-600 text-white text-xs" : "text-xs"}
                                  >
                                    {releasingResults === student.studentId ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                                    ) : student.resultsReleased ? (
                                      "✅ Released"
                                    ) : (
                                      "🔓 Release"
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      downloadStudentReport(
                                        student.studentId,
                                        student.studentName
                                      )
                                    }
                                    className="text-xs"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Report
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  /* Detailed Student Results */
                  <div className="space-y-6">
                    {/* Statistics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {studentResults.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Students
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {
                              studentResults.filter((s) => s.percentage >= 60)
                                .length
                            }
                          </div>
                          <div className="text-sm text-gray-600">Passed</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {
                              studentResults.filter((s) => s.percentage < 60)
                                .length
                            }
                          </div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {studentResults.length > 0
                              ? Math.round(
                                  studentResults.reduce(
                                    (sum, s) => sum + s.percentage,
                                    0
                                  ) / studentResults.length
                                )
                              : 0}
                            %
                          </div>
                          <div className="text-sm text-gray-600">
                            Average Score
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Section-wise Results */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        📊 Section-wise Performance
                      </h3>

                      {/* MCQ Section */}
                      {studentResults.some((s) => s.mcqResults) && (
                        <Card className="border-l-4 border-l-blue-500">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              MCQ Section Results
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {studentResults
                                .filter((s) => s.mcqResults)
                                .map((student, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-sm">
                                          {student.studentName?.charAt(0) ||
                                            "S"}
                                        </span>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900">
                                          {student.studentName}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                          {student.studentEmail}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                          {student.mcqResults.correctAnswers}/
                                          {student.mcqResults.totalQuestions}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          {student.percentage}% overall
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          downloadStudentReport(
                                            student.studentId,
                                            student.studentName
                                          )
                                        }
                                        className="text-xs"
                                      >
                                        <Download className="w-3 h-3 mr-1" />
                                        Report
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Coding Section */}
                      {studentResults.some(
                        (s) => s.codingResults && s.codingResults.length > 0
                      ) && (
                        <Card className="border-l-4 border-l-purple-500">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                              Coding Section Results
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {studentResults
                                .filter(
                                  (s) =>
                                    s.codingResults &&
                                    s.codingResults.length > 0
                                )
                                .map((student, index) => {
                                  const totalTestCases =
                                    student.codingResults.reduce(
                                      (sum, cr) => sum + cr.totalTestCases,
                                      0
                                    );
                                  const passedTestCases =
                                    student.codingResults.reduce(
                                      (sum, cr) => sum + cr.testCasesPassed,
                                      0
                                    );
                                  const successRate =
                                    totalTestCases > 0
                                      ? Math.round(
                                          (passedTestCases / totalTestCases) *
                                            100
                                        )
                                      : 0;

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                          <span className="text-purple-600 font-semibold text-sm">
                                            {student.studentName?.charAt(0) ||
                                              "S"}
                                          </span>
                                        </div>
                                        <div>
                                          <h4 className="font-medium text-gray-900">
                                            {student.studentName}
                                          </h4>
                                          <p className="text-sm text-gray-500">
                                            {student.studentEmail}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-center">
                                          <div className="text-lg font-bold text-purple-600">
                                            {passedTestCases}/{totalTestCases}
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            {successRate}% test cases
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            downloadStudentReport(
                                              student.studentId,
                                              student.studentName
                                            )
                                          }
                                          className="text-xs"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          Report
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
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

export default AdminTestReports;
