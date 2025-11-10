// // import { useEffect, useState } from "react";
// // import { useParams, useNavigate } from "react-router-dom";
// // import { toast } from "@/components/ui/use-toast";
// // import { Button } from "@/components/ui/button";
// // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // import { Label } from "@/components/ui/label";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Badge } from "@/components/ui/badge";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // import { Input } from "@/components/ui/input";
// // import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// // import { Clock, Play, Send, Code } from "lucide-react";
// // import TestLayout from "@/components/TestLayout";
// // import { API_BASE_URL } from "@/config/api";

// // const MCQTest = () => {
// //   const { testId } = useParams();
// //   const navigate = useNavigate();
// //   const [testData, setTestData] = useState<any>(null);
// //   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
// //   const [answers, setAnswers] = useState<Record<number, string>>({});
// //   const [codeAnswers, setCodeAnswers] = useState<Record<number, { code: string; language: string }>>({});
// //   const [selectedLanguages, setSelectedLanguages] = useState<Record<number, string>>({});
// //   const [dryRunResults, setDryRunResults] = useState<Record<number, any>>({});
// //   const [isRunning, setIsRunning] = useState(false);
// //   const [submissionResults, setSubmissionResults] = useState<Record<number, any>>({});
// //   const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
// //   const [timeLeft, setTimeLeft] = useState(1800); // default 30 mins
// //   const [isPaused, setIsPaused] = useState(false);
// //   const [isTestEnded, setIsTestEnded] = useState(false);
// //   const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
// //   const [supervisorPasscode, setSupervisorPasscode] = useState("");
// //   const [isValidatingPasscode, setIsValidatingPasscode] = useState(false);
// //   const [totalTestDuration, setTotalTestDuration] = useState(1800);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);

// //   // Fetch test data
// //   useEffect(() => {
// //     const fetchTest = async () => {
// //       try {
// //         setLoading(true);
// //         setError(null);
// //         const res = await fetch(`http://localhost:5000/api/test/${testId}`);
// //         if (!res.ok) {
// //           throw new Error('Failed to fetch test data');
// //         }
// //         const json = await res.json();
// //         console.log('Fetched test data:', json);
// //         setTestData(json);
// //         const totalSeconds = json.Sections?.reduce((acc: number, sec: any) => acc + (sec.duration || 0) * 60, 0) || 1800;
// //         setTimeLeft(totalSeconds);
// //         setTotalTestDuration(totalSeconds);
// //       } catch (error) {
// //         console.error('Error fetching test:', error);
// //         setError('Failed to load test. Please try again.');
// //         toast({
// //           title: "Error",
// //           description: "Failed to load test. Please try again.",
// //           variant: "destructive",
// //         });
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchTest();
// //   }, [testId, navigate]);

// //   // Timer logic
// //   useEffect(() => {
// //     if (!isPaused && timeLeft > 0 && !isTestEnded) {
// //       const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
// //       return () => clearInterval(timer);
// //     } else if (timeLeft === 0 && !isTestEnded) {
// //       handleTimeUp();
// //     }
// //   }, [timeLeft, isPaused, isTestEnded]);

// //   // Fullscreen + event listeners on mount
// //   useEffect(() => {
// //     if (isTestEnded) return;

// //     const enterFullscreen = async () => {
// //       try {
// //         const elem = document.documentElement;
// //         if (elem.requestFullscreen) {
// //           await elem.requestFullscreen();
// //         }
// //       } catch (err) {
// //         console.error("Fullscreen error:", err);
// //       }
// //     };

// //     const handleVisibilityChange = () => {
// //       if (document.hidden && !isTestEnded) {
// //         endTest("You left the tab. Test ended.");
// //       }
// //     };

// //     const handleFullscreenChange = () => {
// //       if (!document.fullscreenElement && !isTestEnded) {
// //         endTest("You exited fullscreen. Test ended.");
// //       }
// //     };

// //     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
// //       if (!isTestEnded) {
// //         e.preventDefault();
// //         e.returnValue = "Are you sure you want to leave? Your test will be submitted.";
// //       }
// //     };

// //     enterFullscreen();

// //     document.addEventListener("visibilitychange", handleVisibilityChange);
// //     document.addEventListener("fullscreenchange", handleFullscreenChange);
// //     window.addEventListener("beforeunload", handleBeforeUnload);

// //     return () => {
// //       document.removeEventListener("visibilitychange", handleVisibilityChange);
// //       document.removeEventListener("fullscreenchange", handleFullscreenChange);
// //       window.removeEventListener("beforeunload", handleBeforeUnload);
// //     };
// //   }, [isTestEnded]);

// //   // Define allQuestions before using it in endTest
// //   const allQuestions = (testData?.Sections || []).flatMap((section: any) => {
// //     const mcqQuestions = (section?.MCQs || []).map((q: any, index: number) => ({
// //       ...q,
// //       type: 'MCQ',
// //       sectionName: section?.name || 'Unknown Section',
// //       questionNo: index + 1
// //     }));

// //     const codingQuestions = (section?.codingQuestions || []).map((q: any, index: number) => ({
// //       ...q,
// //       type: 'Coding',
// //       sectionName: section?.name || 'Unknown Section',
// //       questionNo: mcqQuestions.length + index + 1
// //     }));

// //     return [...mcqQuestions, ...codingQuestions];
// //   });

// //   const endTest = async (reason: string) => {
// //     setIsTestEnded(true);
// //     if (document.fullscreenElement) {
// //       document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
// //     }

// //     // Calculate results
// //     const results = allQuestions.map(question => {
// //       const userAnswer = answers[question.id];
// //       const isCorrect = userAnswer === question.correctOptionLetter;
// //       return {
// //         ...question,
// //         userAnswer,
// //         isCorrect,
// //         explanation: question.explanation
// //       };
// //     });

// //     const correctAnswers = results.filter(r => r.isCorrect).length;
// //     const totalScore = correctAnswers;
// //     const maxScore = allQuestions.length;

// //     const percentage = Math.round((correctAnswers / allQuestions.length) * 100);
// //     const testResult = {
// //       testId,
// //       testName: testData.name,
// //       totalScore: correctAnswers,
// //       maxScore: allQuestions.length,
// //       percentage,
// //       status: 'completed',
// //       completedAt: new Date().toISOString(),
// //       startedAt: new Date().toISOString(),
// //       hasMCQQuestions: true,
// //       hasCodingQuestions: false,
// //       mcqResults: {
// //         totalQuestions: allQuestions.length,
// //         correctAnswers,
// //         wrongAnswers: allQuestions.length - correctAnswers,
// //         unansweredCount: 0,
// //         accuracyRate: percentage,
// //         questions: results
// //       }
// //     };

// //     // Save test result to database and localStorage
// //     try {
// //       const userEmail = localStorage.getItem('userEmail') || 'test@example.com';
// //       const studentName = localStorage.getItem('userName') || 'Test Student';
// //       const department = localStorage.getItem('userDepartment') || 'General';
// //       const sinNumber = localStorage.getItem('userSIN') || 'SIN-' + Date.now().toString().slice(-6);

// //       const testResultData = {
// //         testId: testId,
// //         testName: testData.name,
// //         userEmail: userEmail,
// //         studentName: studentName,
// //         department: department,
// //         sinNumber: sinNumber,
// //         totalScore: totalScore,
// //         maxScore: maxScore,
// //         percentage: Math.round((totalScore / maxScore) * 100),
// //         completedAt: new Date().toISOString(),
// //         date: new Date().toLocaleDateString(),
// //         answers: JSON.stringify(answers),
// //         sessionId: `session_${testId}_${Date.now()}`
// //       };

// //       // Enhance test result with detailed MCQ data for PDF reports
// //       const enhancedTestResult = {
// //         ...testResult,
// //         mcqAnswers: results.map((question, index) => ({
// //           questionId: question.id,
// //           question: question.questionText || `Question ${index + 1}: Sample MCQ question`,
// //           selectedAnswer: question.userAnswer,
// //           correctAnswer: question.correctOptionLetter,
// //           options: {
// //             A: question.optionA || 'Option A',
// //             B: question.optionB || 'Option B',
// //             C: question.optionC || 'Option C',
// //             D: question.optionD || 'Option D'
// //           },
// //           explanation: question.explanation || `The correct answer is ${question.correctOptionLetter}. ${question.isCorrect ? 'Well done!' : 'Review this topic for better understanding.'}`
// //         }))
// //       };

// //       // Save to localStorage as backup with multiple key formats
// //       localStorage.setItem(`test_result_${testId}`, JSON.stringify(enhancedTestResult));
// //       localStorage.setItem(`testResult_${testId}_${userEmail}`, JSON.stringify(enhancedTestResult));
// //       localStorage.setItem(`testResult_${testId}`, JSON.stringify(enhancedTestResult));

// //       console.log('💾 Saved test result to localStorage with keys:', [
// //         `test_result_${testId}`,
// //         `testResult_${testId}_${userEmail}`,
// //         `testResult_${testId}`
// //       ]);

// //       const response = await fetch(`${API_BASE_URL}/api/student/test-results`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify(testResultData)
// //       });

// //       if (response.ok) {
// //         console.log('✅ Test result saved to database successfully');
// //       } else {
// //         const errorText = await response.text();
// //         console.error('❌ Failed to save test result to database:', response.status, errorText);
// //       }
// //     } catch (error) {
// //       console.error('❌ Error saving test result:', error);
// //       // Still save to localStorage even if API fails
// //       try {
// //         localStorage.setItem(`test_result_${testId}`, JSON.stringify(testResult));
// //         console.log('💾 Fallback: Saved test result to localStorage');
// //       } catch (localError) {
// //         console.error('❌ Failed to save to localStorage:', localError);
// //       }
// //     }

// //     toast({
// //       title: "Test Completed",
// //       description: `You scored ${correctAnswers}/${allQuestions.length}`,
// //     });

// //     // Navigate to results page with a small delay to ensure data is saved
// //     setTimeout(() => {
// //       navigate(`/student/test/${testId}/result`);
// //     }, 1000);
// //   };

// //   const handleTimeUp = () => {
// //     toast({
// //       title: "Time's Up!",
// //       description: "Test time has ended. Please enter supervisor passcode to submit.",
// //       variant: "destructive",
// //     });
// //     setShowPasscodeDialog(true);
// //   };

// //   const handleManualSubmit = () => {
// //     const timeElapsed = (totalTestDuration - timeLeft) / totalTestDuration; // Calculate percentage of time elapsed
// //     if (timeElapsed >= 0.9) { // 90% of time completed
// //       setShowPasscodeDialog(true);
// //     } else {
// //       toast({
// //         title: "Cannot Submit Yet",
// //         description: `You can only submit after 90% of the test duration is completed. Currently ${Math.round(timeElapsed * 100)}% completed.`,
// //         variant: "destructive",
// //       });
// //     }
// //   };

// //   const validateSupervisorPasscode = async () => {
// //     if (!supervisorPasscode.trim()) {
// //       toast({
// //         title: "Error",
// //         description: "Please enter the supervisor passcode.",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     setIsValidatingPasscode(true);
// //     try {
// //       const response = await fetch('http://localhost:5000/api/passcode/validate', {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           code: supervisorPasscode,
// //           type: 'supervisor'
// //         }),
// //       });

// //       const data = await response.json();
// //       if (data.valid) {
// //         setShowPasscodeDialog(false);
// //         setSupervisorPasscode("");
// //         endTest("Test submitted successfully with supervisor approval.");
// //       } else {
// //         toast({
// //           title: "Invalid Passcode",
// //           description: data.message || "The supervisor passcode is incorrect.",
// //           variant: "destructive",
// //         });
// //       }
// //     } catch (error) {
// //       console.error('Passcode validation error:', error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to validate passcode. Please try again.",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsValidatingPasscode(false);
// //     }
// //   };

// //   const handlePasscodeDialogClose = () => {
// //     if (timeLeft > 0) {
// //       setShowPasscodeDialog(false);
// //       setSupervisorPasscode("");
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <TestLayout>
// //         <div className="flex items-center justify-center min-h-screen">
// //           <div className="text-center">
// //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
// //             <p className="text-gray-600">Loading test...</p>
// //           </div>
// //         </div>
// //       </TestLayout>
// //     );
// //   }

// //   if (error || !testData) {
// //     return (
// //       <TestLayout>
// //         <div className="flex items-center justify-center min-h-screen">
// //           <div className="text-center">
// //             <div className="text-red-500 text-xl mb-4">⚠️</div>
// //             <h2 className="text-xl font-bold mb-2">Test Loading Error</h2>
// //             <p className="text-gray-600 mb-4">{error || 'Failed to load test data'}</p>
// //             <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// //           </div>
// //         </div>
// //       </TestLayout>
// //     );
// //   }

// //   console.log('Test Data:', testData);
// //   console.log('All Questions:', allQuestions);

// //   if (!testData || allQuestions.length === 0) {
// //     return (
// //       <TestLayout>
// //         <div className="p-6 text-center">
// //           <h2 className="text-xl font-bold mb-4">No Questions Available</h2>
// //           <p className="text-gray-600 mb-4">
// //             {!testData ? 'Test data could not be loaded.' : 'This test does not contain any questions.'}
// //           </p>
// //           <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// //         </div>
// //       </TestLayout>
// //     );
// //   }

// //   const currentQuestion = allQuestions[currentQuestionIndex];

// //   // Safety check for current question
// //   if (!currentQuestion) {
// //     return (
// //       <TestLayout>
// //         <div className="p-6 text-center">
// //           <h2 className="text-xl font-bold mb-4">Question Not Found</h2>
// //           <p className="text-gray-600 mb-4">Unable to load the current question.</p>
// //           <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// //         </div>
// //       </TestLayout>
// //     );
// //   }

// //   const formatTime = (s: number) =>
// //     `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// //   const handleAnswer = (value: string) => {
// //     setAnswers({ ...answers, [currentQuestion.id]: value });
// //   };

// //   const handleCodeAnswer = (code: string) => {
// //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
// //     setCodeAnswers({ ...codeAnswers, [currentQuestion.id]: { code, language } });
// //   };

// //   const handleLanguageChange = (questionId: number, language: string) => {
// //     setSelectedLanguages({ ...selectedLanguages, [questionId]: language });
// //     const currentCode = codeAnswers[questionId]?.code || '';
// //     setCodeAnswers({ ...codeAnswers, [questionId]: { code: currentCode, language } });
// //   };

// //   const handleDryRun = async () => {
// //     if (currentQuestion.type !== 'Coding') return;

// //     const code = codeAnswers[currentQuestion.id]?.code;
// //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];

// //     if (!code || !code.trim()) {
// //       toast({
// //         title: "Error",
// //         description: "Please write some code before running",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     setIsRunning(true);

// //     try {
// //       const response = await fetch(`${API_BASE_URL}/api/coding/dry-run`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           questionId: currentQuestion.id,
// //           code,
// //           language
// //         })
// //       });

// //       const result = await response.json();

// //       if (result.success) {
// //         setDryRunResults({ ...dryRunResults, [currentQuestion.id]: result });
// //         toast({
// //           title: "Dry Run Complete",
// //           description: `Passed ${result.summary.passed}/${result.summary.total} test cases`,
// //         });
// //       } else {
// //         toast({
// //           title: "Dry Run Failed",
// //           description: result.error || "Failed to execute code",
// //           variant: "destructive",
// //         });
// //       }
// //     } catch (error) {
// //       console.error('Dry run error:', error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to run code. Please try again.",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsRunning(false);
// //     }
// //   };

// //   const handleSubmitCode = async () => {
// //     if (currentQuestion.type !== 'Coding') return;

// //     const code = codeAnswers[currentQuestion.id]?.code;
// //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];

// //     if (!code || !code.trim()) {
// //       toast({
// //         title: "Error",
// //         description: "Please write some code before submitting",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     setIsRunning(true);

// //     try {
// //       const response = await fetch(`${API_BASE_URL}/api/coding/submit`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           questionId: currentQuestion.id,
// //           code,
// //           language,
// //           studentId: 'student123', // Replace with actual student ID
// //           testId
// //         })
// //       });

// //       const result = await response.json();

// //       if (result.success) {
// //         setSubmissionResults({ ...submissionResults, [currentQuestion.id]: result });
// //         toast({
// //           title: "Code Submitted",
// //           description: `Score: ${result.score}/${result.maxScore} (${result.testResults.percentage}%)`,
// //         });
// //         handleNext();
// //       } else {
// //         toast({
// //           title: "Submission Failed",
// //           description: result.error || "Failed to submit code",
// //           variant: "destructive",
// //         });
// //       }
// //     } catch (error) {
// //       console.error('Code submission error:', error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to submit code. Please try again.",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsRunning(false);
// //     }
// //   };

// //   const handleMark = () => {
// //     const newSet = new Set(markedForReview);
// //     if (newSet.has(currentQuestion.id)) {
// //       newSet.delete(currentQuestion.id);
// //     } else {
// //       newSet.add(currentQuestion.id);
// //     }
// //     setMarkedForReview(newSet);
// //     handleNext();
// //   };

// //   const handleNext = () => {
// //     if (currentQuestionIndex < allQuestions.length - 1) {
// //       setCurrentQuestionIndex((i) => i + 1);
// //     }
// //   };

// //   const handlePrev = () => {
// //     if (currentQuestionIndex > 0) {
// //       setCurrentQuestionIndex((i) => i - 1);
// //     }
// //   };

// //   const handleClear = () => {
// //     if (currentQuestion.type === 'MCQ') {
// //       const newAnswers = { ...answers };
// //       delete newAnswers[currentQuestion.id];
// //       setAnswers(newAnswers);
// //     } else {
// //       const newCodeAnswers = { ...codeAnswers };
// //       delete newCodeAnswers[currentQuestion.id];
// //       setCodeAnswers(newCodeAnswers);
// //     }
// //   };

// //   const getStatusColor = (qid: number, questionType: string) => {
// //     const hasAnswer = questionType === 'MCQ' ? answers[qid] : codeAnswers[qid]?.code;
// //     const isSubmitted = questionType === 'Coding' && submissionResults[qid];

// //     if (isSubmitted) return "bg-blue-500 text-white";
// //     if (hasAnswer) return "bg-green-500 text-white";
// //     if (markedForReview.has(qid)) return "bg-purple-500 text-white";
// //     if (qid === currentQuestion.id) return "bg-orange-500 text-white";
// //     return "bg-gray-200 text-gray-700";
// //   };

// //   return (
// //     <TestLayout>
// //       <div className="flex h-screen">
// //         {/* Main Area */}
// //         <div className="flex-1 flex flex-col">
// //           <div className="bg-white border-b p-4 flex justify-between items-center">
// //             <h1 className="text-lg font-semibold">{testData.name}</h1>
// //             <div className="flex items-center gap-4 text-orange-600">
// //               <Clock className="w-4 h-4" />
// //               <span>Time Left: {formatTime(timeLeft)}</span>
// //               {/* <Button
// //                 variant="outline"
// //                 size="sm"
// //                 onClick={() => setIsPaused(!isPaused)}
// //                 disabled={isTestEnded}
// //               >
// //                 {isPaused ? "Resume" : "Pause"}
// //               </Button> */}
// //               <Button
// //                 variant="destructive"
// //                 size="sm"
// //                 onClick={handleManualSubmit}
// //                 disabled={isTestEnded || (totalTestDuration - timeLeft) / totalTestDuration < 0.9}
// //               >
// //                 Submit Test
// //               </Button>
// //             </div>
// //           </div>

// //           <div className="p-4">
// //             <Card>
// //               <CardHeader>
// //                 <CardTitle>
// //                   Q{currentQuestion.questionNo}: {currentQuestion.questionText}
// //                 </CardTitle>
// //                 {currentQuestion.questionImage && (
// //                   <div className="mt-2">
// //                     <img
// //                       src={currentQuestion.questionImage}
// //                       alt="Question"
// //                       className="max-w-full h-auto rounded border"
// //                       onError={(e) => {
// //                         console.error('Question image failed to load:', currentQuestion.questionImage);
// //                         e.currentTarget.style.display = 'none';
// //                       }}
// //                     />
// //                   </div>
// //                 )}
// //               </CardHeader>
// //               <CardContent>
// //                 {currentQuestion.type === 'MCQ' ? (
// //                   <RadioGroup
// //                     value={answers[currentQuestion.id] || ""}
// //                     onValueChange={handleAnswer}
// //                     disabled={isTestEnded}
// //                   >
// //                     {["A", "B", "C", "D"].map((opt) => (
// //                       <div key={opt} className="flex items-start space-x-3 p-3 border rounded mb-2">
// //                         <RadioGroupItem value={opt} id={`opt-${opt}`} className="mt-1" />
// //                         <Label htmlFor={`opt-${opt}`} className="flex-1 cursor-pointer">
// //                           <div className="flex items-start gap-2">
// //                             <span className="font-medium">{opt})</span>
// //                             <div className="flex-1">
// //                               <div>{currentQuestion[`option${opt}`]}</div>
// //                               {currentQuestion[`option${opt}Image`] && (
// //                                 <img
// //                                   src={currentQuestion[`option${opt}Image`]}
// //                                   alt={`Option ${opt}`}
// //                                   className="mt-2 max-w-xs h-auto rounded border"
// //                                   onError={(e) => {
// //                                     console.error(`Option ${opt} image failed to load:`, currentQuestion[`option${opt}Image`]);
// //                                     e.currentTarget.style.display = 'none';
// //                                   }}
// //                                 />
// //                               )}
// //                             </div>
// //                           </div>
// //                         </Label>
// //                       </div>
// //                     ))}
// //                   </RadioGroup>
// //                 ) : (
// //                   <div className="space-y-4">
// //                     <div className="bg-gray-50 p-4 rounded-lg">
// //                       <h4 className="font-medium mb-2">Problem Statement:</h4>
// //                       <div className="whitespace-pre-wrap">{currentQuestion.problemStatement}</div>

// //                       {currentQuestion.constraints && (
// //                         <div className="mt-4">
// //                           <h5 className="font-medium mb-1">Constraints:</h5>
// //                           <div className="text-sm text-gray-600 whitespace-pre-wrap">{currentQuestion.constraints}</div>
// //                         </div>
// //                       )}

                      // {currentQuestion.sampleTestCases && currentQuestion.sampleTestCases.length > 0 && (
                      //   <div className="mt-4">
                      //     <h5 className="font-medium mb-2">Sample Test Cases:</h5>
                      //     <div className="space-y-2">
                      //       {currentQuestion.sampleTestCases.map((testCase: any, index: number) => (
                      //         <div key={index} className="bg-white p-3 rounded border">
                      //           <div className="grid grid-cols-2 gap-4 text-sm">
                      //             <div>
                      //               <strong>Input:</strong>
                      //               <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.input}</pre>
                      //             </div>
                      //             <div>
                      //               <strong>Output:</strong>
                      //               <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.output}</pre>
                      //             </div>
                      //           </div>
                      //         </div>
                      //       ))}
                      //     </div>
                      //   </div>
                      // )}
// //                     </div>

// //                     <div className="flex items-center gap-4">
// //                       <div className="flex-1">
// //                         <Label>Programming Language:</Label>
// //                         <Select
// //                           value={selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]}
// //                           onValueChange={(value) => handleLanguageChange(currentQuestion.id, value)}
// //                           disabled={isTestEnded}
// //                         >
// //                           <SelectTrigger className="mt-1">
// //                             <SelectValue />
// //                           </SelectTrigger>
// //                           <SelectContent>
// //                             {currentQuestion.allowedLanguages.map((lang: string) => (
// //                               <SelectItem key={lang} value={lang}>{lang}</SelectItem>
// //                             ))}
// //                           </SelectContent>
// //                         </Select>
// //                       </div>

// //                       <div className="flex gap-2">
// //                         <Button
// //                           variant="outline"
// //                           size="sm"
// //                           onClick={handleDryRun}
// //                           disabled={isTestEnded || isRunning}
// //                           className="gap-2"
// //                         >
// //                           <Play className="w-4 h-4" />
// //                           {isRunning ? 'Running...' : 'Dry Run'}
// //                         </Button>

// //                         <Button
// //                           size="sm"
// //                           onClick={handleSubmitCode}
// //                           disabled={isTestEnded || isRunning}
// //                           className="gap-2 bg-blue-600 hover:bg-blue-700"
// //                         >
// //                           <Send className="w-4 h-4" />
// //                           Submit Code
// //                         </Button>
// //                       </div>
// //                     </div>

// //                     <div>
// //                       <Label>Your Solution:</Label>
// //                       <Textarea
// //                         placeholder={`Write your ${selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]} code here...`}
// //                         value={codeAnswers[currentQuestion.id]?.code || ''}
// //                         onChange={(e) => handleCodeAnswer(e.target.value)}
// //                         className="mt-2 font-mono text-sm"
// //                         rows={15}
// //                         disabled={isTestEnded}
// //                       />
// //                     </div>

// //                     {/* Dry Run Results */}
// //                     {dryRunResults[currentQuestion.id] && (
// //                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
// //                         <h5 className="font-medium mb-2 text-blue-800">Dry Run Results:</h5>
// //                         <div className="text-sm">
// //                           <p className="mb-2">Passed: {dryRunResults[currentQuestion.id].summary.passed}/{dryRunResults[currentQuestion.id].summary.total} test cases</p>
// //                           <div className="space-y-2">
// //                             {dryRunResults[currentQuestion.id].results.map((result: any, index: number) => (
// //                               <div key={index} className={`p-2 rounded ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
// //                                 <div className="font-medium">{result.passed ? '✅' : '❌'} Test Case {index + 1}</div>
// //                                 {!result.passed && (
// //                                   <div className="text-xs mt-1">
// //                                     <div>Expected: {result.expectedOutput}</div>
// //                                     <div>Got: {result.actualOutput}</div>
// //                                     {result.error && <div className="text-red-600">Error: {result.error}</div>}
// //                                   </div>
// //                                 )}
// //                               </div>
// //                             ))}
// //                           </div>
// //                         </div>
// //                       </div>
// //                     )}

// //                     {/* Submission Results */}
// //                     {submissionResults[currentQuestion.id] && (
// //                       <div className="bg-green-50 p-4 rounded-lg border border-green-200">
// //                         <h5 className="font-medium mb-2 text-green-800">Submission Results:</h5>
// //                         <div className="text-sm">
// //                           <p>Status: <span className={`font-medium ${submissionResults[currentQuestion.id].status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
// //                             {submissionResults[currentQuestion.id].status.toUpperCase()}
// //                           </span></p>
// //                           <p>Score: {submissionResults[currentQuestion.id].score}/{submissionResults[currentQuestion.id].maxScore}</p>
// //                           <p>Test Cases: {submissionResults[currentQuestion.id].testResults.passed}/{submissionResults[currentQuestion.id].testResults.total} passed</p>
// //                         </div>
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}

// //                 <div className="flex justify-between mt-6 pt-4 border-t">
// //                   <div className="space-x-2">
// //                     <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0 || isTestEnded}>
// //                       Previous
// //                     </Button>
// //                     <Button variant="outline" onClick={handleMark} disabled={isTestEnded}>
// //                       {markedForReview.has(currentQuestion.id) ? "Unmark" : "Mark for Review"} & Next
// //                     </Button>
// //                   </div>
// //                   <div className="space-x-2">
// //                     <Button variant="outline" onClick={handleClear} disabled={isTestEnded}>
// //                       Clear
// //                     </Button>
// //                     <Button
// //                       onClick={handleNext}
// //                       disabled={currentQuestionIndex === allQuestions.length - 1 || isTestEnded}
// //                     >
// //                       Save & Next
// //                     </Button>
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         </div>

// //         {/* Sidebar */}
// //         <div className="w-80 border-l p-4 bg-white">
// //           <h3 className="text-md font-semibold mb-2">Question Palette</h3>
// //           <div className="grid grid-cols-4 gap-2">
// //             {allQuestions.map((q: any, idx: number) => (
// //               <button
// //                 key={q.id}
// //                 className={`w-8 h-8 rounded ${getStatusColor(q.id, q.type)}`}
// //                 onClick={() => setCurrentQuestionIndex(idx)}
// //                 disabled={isTestEnded}
// //               >
// //                 {q.questionNo}
// //               </button>
// //             ))}
// //           </div>

// //           <div className="mt-6 space-y-2">
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
// //               <span>Answered</span>
// //             </div>
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
// //               <span>Submitted</span>
// //             </div>
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-purple-500 mr-2"></div>
// //               <span>Marked</span>
// //             </div>
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-orange-500 mr-2"></div>
// //               <span>Current</span>
// //             </div>
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-gray-200 mr-2"></div>
// //               <span>Unanswered</span>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Supervisor Passcode Dialog */}
// //       <Dialog open={showPasscodeDialog} onOpenChange={handlePasscodeDialogClose}>
// //         <DialogContent className="sm:max-w-md">
// //           <DialogHeader>
// //             <DialogTitle>Supervisor Passcode Required</DialogTitle>
// //           </DialogHeader>
// //           <div className="space-y-4">
// //             <p className="text-sm text-gray-600">
// //               {timeLeft === 0
// //                 ? "Test time has ended. Please enter the supervisor passcode to submit your test."
// //                 : "To submit the test, please enter the supervisor passcode."}
// //             </p>
// //             <div>
// //               <Label htmlFor="passcode">Supervisor Passcode</Label>
// //               <Input
// //                 id="passcode"
// //                 type="password"
// //                 placeholder="Enter 6-digit passcode"
// //                 value={supervisorPasscode}
// //                 onChange={(e) => setSupervisorPasscode(e.target.value)}
// //                 maxLength={6}
// //                 className="mt-1"
// //                 onKeyPress={(e) => {
// //                   if (e.key === 'Enter') {
// //                     validateSupervisorPasscode();
// //                   }
// //                 }}
// //               />
// //             </div>
// //           </div>
// //           <DialogFooter>
// //             {timeLeft > 0 && (
// //               <Button variant="outline" onClick={handlePasscodeDialogClose}>
// //                 Cancel
// //               </Button>
// //             )}
// //             <Button
// //               onClick={validateSupervisorPasscode}
// //               disabled={isValidatingPasscode || !supervisorPasscode.trim()}
// //             >
// //               {isValidatingPasscode ? 'Validating...' : 'Submit Test'}
// //             </Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>
// //     </TestLayout>
// //   );
// // };

// // export default MCQTest;

// // // // import { useEffect, useState } from "react";
// // // // import { useParams, useNavigate } from "react-router-dom";
// // // // import { toast } from "@/components/ui/use-toast";
// // // // import { Button } from "@/components/ui/button";
// // // // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // // // import { Label } from "@/components/ui/label";
// // // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // // import { Badge } from "@/components/ui/badge";
// // // // import { Textarea } from "@/components/ui/textarea";
// // // // import {
// // // //   Select,
// // // //   SelectContent,
// // // //   SelectItem,
// // // //   SelectTrigger,
// // // //   SelectValue,
// // // // } from "@/components/ui/select";
// // // // import { Input } from "@/components/ui/input";
// // // // import {
// // // //   Dialog,
// // // //   DialogContent,
// // // //   DialogHeader,
// // // //   DialogTitle,
// // // //   DialogFooter,
// // // // } from "@/components/ui/dialog";
// // // // import {
// // // //   Clock,
// // // //   Play,
// // // //   Send,
// // // //   Code,
// // // //   Fullscreen,
// // // //   AlertTriangle,
// // // // } from "lucide-react";
// // // // import TestLayout from "@/components/TestLayout";
// // // // import { API_BASE_URL } from "@/config/api";

// // // // const MCQTest = () => {
// // // //   const { testId } = useParams();
// // // //   const navigate = useNavigate();
// // // //   const [testData, setTestData] = useState<any>(null);
// // // //   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
// // // //   const [answers, setAnswers] = useState<Record<number, string>>({});
// // // //   const [codeAnswers, setCodeAnswers] = useState<
// // // //     Record<number, { code: string; language: string }>
// // // //   >({});
// // // //   const [selectedLanguages, setSelectedLanguages] = useState<
// // // //     Record<number, string>
// // // //   >({});
// // // //   const [dryRunResults, setDryRunResults] = useState<Record<number, any>>({});
// // // //   const [isRunning, setIsRunning] = useState(false);
// // // //   const [submissionResults, setSubmissionResults] = useState<
// // // //     Record<number, any>
// // // //   >({});
// // // //   const [markedForReview, setMarkedForReview] = useState<Set<number>>(
// // // //     new Set()
// // // //   );
// // // //   const [timeLeft, setTimeLeft] = useState(1800); // default 30 mins
// // // //   const [isPaused, setIsPaused] = useState(false);
// // // //   const [isTestEnded, setIsTestEnded] = useState(false);
// // // //   const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
// // // //   const [supervisorPasscode, setSupervisorPasscode] = useState("");
// // // //   const [isValidatingPasscode, setIsValidatingPasscode] = useState(false);
// // // //   const [totalTestDuration, setTotalTestDuration] = useState(1800);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [error, setError] = useState<string | null>(null);

// // // //   // New states for fullscreen warning
// // // //   const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
// // // //   const [fullscreenCountdown, setFullscreenCountdown] = useState(30);
// // // //   const [fullscreenViolations, setFullscreenViolations] = useState(0);
// // // //   const [isInFullscreen, setIsInFullscreen] = useState(true);

// // // //   // Fetch test data
// // // //   useEffect(() => {
// // // //     const fetchTest = async () => {
// // // //       try {
// // // //         setLoading(true);
// // // //         setError(null);
// // // //         const res = await fetch(`http://localhost:5000/api/test/${testId}`);
// // // //         if (!res.ok) {
// // // //           throw new Error("Failed to fetch test data");
// // // //         }
// // // //         const json = await res.json();
// // // //         console.log("Fetched test data:", json);
// // // //         setTestData(json);
// // // //         const totalSeconds =
// // // //           json.Sections?.reduce(
// // // //             (acc: number, sec: any) => acc + (sec.duration || 0) * 60,
// // // //             0
// // // //           ) || 1800;
// // // //         setTimeLeft(totalSeconds);
// // // //         setTotalTestDuration(totalSeconds);
// // // //       } catch (error) {
// // // //         console.error("Error fetching test:", error);
// // // //         setError("Failed to load test. Please try again.");
// // // //         toast({
// // // //           title: "Error",
// // // //           description: "Failed to load test. Please try again.",
// // // //           variant: "destructive",
// // // //         });
// // // //       } finally {
// // // //         setLoading(false);
// // // //       }
// // // //     };
// // // //     fetchTest();
// // // //   }, [testId, navigate]);

// // // //   // Timer logic
// // // //   useEffect(() => {
// // // //     if (!isPaused && timeLeft > 0 && !isTestEnded) {
// // // //       const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
// // // //       return () => clearInterval(timer);
// // // //     } else if (timeLeft === 0 && !isTestEnded) {
// // // //       handleTimeUp();
// // // //     }
// // // //   }, [timeLeft, isPaused, isTestEnded]);

// // // //   // Fullscreen countdown timer
// // // //   useEffect(() => {
// // // //     let countdownTimer: NodeJS.Timeout;

// // // //     if (showFullscreenWarning && fullscreenCountdown > 0 && !isTestEnded) {
// // // //       countdownTimer = setInterval(() => {
// // // //         setFullscreenCountdown((prev) => {
// // // //           if (prev <= 1) {
// // // //             clearInterval(countdownTimer);
// // // //             handleFullscreenTimeout();
// // // //             return 0;
// // // //           }
// // // //           return prev - 1;
// // // //         });
// // // //       }, 1000);
// // // //     }

// // // //     return () => {
// // // //       if (countdownTimer) clearInterval(countdownTimer);
// // // //     };
// // // //   }, [showFullscreenWarning, fullscreenCountdown, isTestEnded]);

// // // //   // Fullscreen + event listeners on mount
// // // //   useEffect(() => {
// // // //     if (isTestEnded) return;

// // // //     const enterFullscreen = async () => {
// // // //       try {
// // // //         const elem = document.documentElement;
// // // //         if (elem.requestFullscreen) {
// // // //           await elem.requestFullscreen();
// // // //           setIsInFullscreen(true);
// // // //           setShowFullscreenWarning(false);
// // // //           setFullscreenViolations(0);
// // // //         }
// // // //       } catch (err) {
// // // //         console.error("Fullscreen error:", err);
// // // //       }
// // // //     };

// // // //     const handleVisibilityChange = () => {
// // // //       if (document.hidden && !isTestEnded) {
// // // //         endTest("You left the tab. Test ended.");
// // // //       }
// // // //     };

// // // //     const handleFullscreenChange = () => {
// // // //       const isFullscreen = !!document.fullscreenElement;
// // // //       setIsInFullscreen(isFullscreen);

// // // //       if (!isFullscreen && !isTestEnded) {
// // // //         setFullscreenViolations((prev) => prev + 1);

// // // //         if (fullscreenViolations >= 3) {
// // // //           endTest("Maximum fullscreen violations reached. Test ended.");
// // // //           return;
// // // //         }

// // // //         setShowFullscreenWarning(true);
// // // //         setFullscreenCountdown(30);

// // // //         toast({
// // // //           title: "Fullscreen Exit Detected",
// // // //           description: `Please return to fullscreen mode. You have ${30} seconds. Violation ${
// // // //             fullscreenViolations + 1
// // // //           }/3`,
// // // //           variant: "destructive",
// // // //         });
// // // //       } else if (isFullscreen) {
// // // //         setShowFullscreenWarning(false);
// // // //         setFullscreenCountdown(30);
// // // //       }
// // // //     };

// // // //     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
// // // //       if (!isTestEnded) {
// // // //         e.preventDefault();
// // // //         e.returnValue =
// // // //           "Are you sure you want to leave? Your test will be submitted.";
// // // //       }
// // // //     };

// // // //     enterFullscreen();

// // // //     document.addEventListener("visibilitychange", handleVisibilityChange);
// // // //     document.addEventListener("fullscreenchange", handleFullscreenChange);
// // // //     window.addEventListener("beforeunload", handleBeforeUnload);

// // // //     return () => {
// // // //       document.removeEventListener("visibilitychange", handleVisibilityChange);
// // // //       document.removeEventListener("fullscreenchange", handleFullscreenChange);
// // // //       window.removeEventListener("beforeunload", handleBeforeUnload);
// // // //     };
// // // //   }, [isTestEnded, fullscreenViolations]);

// // // //   const handleFullscreenTimeout = () => {
// // // //     endTest("You did not return to fullscreen mode in time. Test ended.");
// // // //   };

// // // //   const handleEnterFullscreen = async () => {
// // // //     try {
// // // //       const elem = document.documentElement;
// // // //       if (elem.requestFullscreen) {
// // // //         await elem.requestFullscreen();
// // // //         setIsInFullscreen(true);
// // // //         setShowFullscreenWarning(false);
// // // //         setFullscreenCountdown(30);
// // // //       }
// // // //     } catch (err) {
// // // //       console.error("Fullscreen error:", err);
// // // //       toast({
// // // //         title: "Fullscreen Error",
// // // //         description: "Could not enter fullscreen mode. Please try again.",
// // // //         variant: "destructive",
// // // //       });
// // // //     }
// // // //   };

// // // //   // Define allQuestions before using it in endTest
// // // //   const allQuestions = (testData?.Sections || []).flatMap((section: any) => {
// // // //     const mcqQuestions = (section?.MCQs || []).map((q: any, index: number) => ({
// // // //       ...q,
// // // //       type: "MCQ",
// // // //       sectionName: section?.name || "Unknown Section",
// // // //       questionNo: index + 1,
// // // //     }));

// // // //     const codingQuestions = (section?.codingQuestions || []).map(
// // // //       (q: any, index: number) => ({
// // // //         ...q,
// // // //         type: "Coding",
// // // //         sectionName: section?.name || "Unknown Section",
// // // //         questionNo: mcqQuestions.length + index + 1,
// // // //       })
// // // //     );

// // // //     return [...mcqQuestions, ...codingQuestions];
// // // //   });

// // // //   const endTest = async (reason: string) => {
// // // //     setIsTestEnded(true);
// // // //     setShowFullscreenWarning(false);

// // // //     if (document.fullscreenElement) {
// // // //       document
// // // //         .exitFullscreen()
// // // //         .catch((err) => console.error("Exit fullscreen error:", err));
// // // //     }

// // // //     // Calculate results
// // // //     const results = allQuestions.map((question) => {
// // // //       const userAnswer = answers[question.id];
// // // //       const isCorrect = userAnswer === question.correctOptionLetter;
// // // //       return {
// // // //         ...question,
// // // //         userAnswer,
// // // //         isCorrect,
// // // //         explanation: question.explanation,
// // // //       };
// // // //     });

// // // //     const correctAnswers = results.filter((r) => r.isCorrect).length;
// // // //     const totalScore = correctAnswers;
// // // //     const maxScore = allQuestions.length;

// // // //     const percentage = Math.round((correctAnswers / allQuestions.length) * 100);
// // // //     const testResult = {
// // // //       testId,
// // // //       testName: testData.name,
// // // //       totalScore: correctAnswers,
// // // //       maxScore: allQuestions.length,
// // // //       percentage,
// // // //       status: "completed",
// // // //       completedAt: new Date().toISOString(),
// // // //       startedAt: new Date().toISOString(),
// // // //       hasMCQQuestions: true,
// // // //       hasCodingQuestions: false,
// // // //       mcqResults: {
// // // //         totalQuestions: allQuestions.length,
// // // //         correctAnswers,
// // // //         wrongAnswers: allQuestions.length - correctAnswers,
// // // //         unansweredCount: 0,
// // // //         accuracyRate: percentage,
// // // //         questions: results,
// // // //       },
// // // //     };

// // // //     // Save test result to database and localStorage
// // // //     try {
// // // //       // const user = localStorage.getItem('user')
// // // //       // const userEmail = localStorage.getItem('userEmail') || 'test@example.com';
// // // //       // const userEmail = user.email;
// // // //       const storedUser = localStorage.getItem("user");
// // // //       const user = storedUser ? JSON.parse(storedUser) : null;
// // // //       const userEmail = user?.email || "test@example.com";
// // // //       const studentName = localStorage.getItem("userName") || "Test Student";
// // // //       const department = localStorage.getItem("userDepartment") || "General";
// // // //       const sinNumber =
// // // //         localStorage.getItem("userSIN") ||
// // // //         "SIN-" + Date.now().toString().slice(-6);

// // // //       const testResultData = {
// // // //         testId: testId,
// // // //         testName: testData.name,
// // // //         userEmail: userEmail,
// // // //         studentName: studentName,
// // // //         department: department,
// // // //         sinNumber: sinNumber,
// // // //         totalScore: totalScore,
// // // //         maxScore: maxScore,
// // // //         percentage: Math.round((totalScore / maxScore) * 100),
// // // //         completedAt: new Date().toISOString(),
// // // //         date: new Date().toLocaleDateString(),
// // // //         answers: JSON.stringify(answers),
// // // //         sessionId: `session_${testId}_${Date.now()}`,
// // // //       };

// // // //       // Enhance test result with detailed MCQ data for PDF reports
// // // //       const enhancedTestResult = {
// // // //         ...testResult,
// // // //         mcqAnswers: results.map((question, index) => ({
// // // //           questionId: question.id,
// // // //           question:
// // // //             question.questionText ||
// // // //             `Question ${index + 1}: Sample MCQ question`,
// // // //           selectedAnswer: question.userAnswer,
// // // //           correctAnswer: question.correctOptionLetter,
// // // //           options: {
// // // //             A: question.optionA || "Option A",
// // // //             B: question.optionB || "Option B",
// // // //             C: question.optionC || "Option C",
// // // //             D: question.optionD || "Option D",
// // // //           },
// // // //           explanation:
// // // //             question.explanation ||
// // // //             `The correct answer is ${question.correctOptionLetter}. ${
// // // //               question.isCorrect
// // // //                 ? "Well done!"
// // // //                 : "Review this topic for better understanding."
// // // //             }`,
// // // //         })),
// // // //       };

// // // //       // Save to localStorage as backup with multiple key formats
// // // //       localStorage.setItem(
// // // //         `test_result_${testId}`,
// // // //         JSON.stringify(enhancedTestResult)
// // // //       );
// // // //       localStorage.setItem(
// // // //         `testResult_${testId}_${userEmail}`,
// // // //         JSON.stringify(enhancedTestResult)
// // // //       );
// // // //       localStorage.setItem(
// // // //         `testResult_${testId}`,
// // // //         JSON.stringify(enhancedTestResult)
// // // //       );

// // // //       console.log("💾 Saved test result to localStorage with keys:", [
// // // //         `test_result_${testId}`,
// // // //         `testResult_${testId}_${userEmail}`,
// // // //         `testResult_${testId}`,
// // // //       ]);

// // // //       const response = await fetch(`${API_BASE_URL}/api/student/test-results`, {
// // // //         method: "POST",
// // // //         headers: {
// // // //           "Content-Type": "application/json",
// // // //         },
// // // //         body: JSON.stringify(testResultData),
// // // //       });

// // // //       if (response.ok) {
// // // //         console.log("✅ Test result saved to database successfully");
// // // //       } else {
// // // //         const errorText = await response.text();
// // // //         console.error(
// // // //           "❌ Failed to save test result to database:",
// // // //           response.status,
// // // //           errorText
// // // //         );
// // // //       }
// // // //     } catch (error) {
// // // //       console.error("❌ Error saving test result:", error);
// // // //       // Still save to localStorage even if API fails
// // // //       try {
// // // //         localStorage.setItem(
// // // //           `test_result_${testId}`,
// // // //           JSON.stringify(testResult)
// // // //         );
// // // //         console.log("💾 Fallback: Saved test result to localStorage");
// // // //       } catch (localError) {
// // // //         console.error("❌ Failed to save to localStorage:", localError);
// // // //       }
// // // //     }

// // // //     toast({
// // // //       title: "Test Completed",
// // // //       description: `You scored ${correctAnswers}/${allQuestions.length}`,
// // // //     });

// // // //     // Navigate to results page with a small delay to ensure data is saved
// // // //     setTimeout(() => {
// // // //       navigate(`/student/test/${testId}/result`);
// // // //     }, 1000);
// // // //   };

// // // //   const handleTimeUp = () => {
// // // //     toast({
// // // //       title: "Time's Up!",
// // // //       description:
// // // //         "Test time has ended. Please enter supervisor passcode to submit.",
// // // //       variant: "destructive",
// // // //     });
// // // //     setShowPasscodeDialog(true);
// // // //   };

// // // //   const handleManualSubmit = () => {
// // // //     const timeElapsed = (totalTestDuration - timeLeft) / totalTestDuration; // Calculate percentage of time elapsed
// // // //     if (timeElapsed >= 0.9) {
// // // //       // 90% of time completed
// // // //       setShowPasscodeDialog(true);
// // // //     } else {
// // // //       toast({
// // // //         title: "Cannot Submit Yet",
// // // //         description: `You can only submit after 90% of the test duration is completed. Currently ${Math.round(
// // // //           timeElapsed * 100
// // // //         )}% completed.`,
// // // //         variant: "destructive",
// // // //       });
// // // //     }
// // // //   };

// // // //   const validateSupervisorPasscode = async () => {
// // // //     if (!supervisorPasscode.trim()) {
// // // //       toast({
// // // //         title: "Error",
// // // //         description: "Please enter the supervisor passcode.",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     setIsValidatingPasscode(true);
// // // //     try {
// // // //       const response = await fetch(
// // // //         "http://localhost:5000/api/passcode/validate",
// // // //         {
// // // //           method: "POST",
// // // //           headers: {
// // // //             "Content-Type": "application/json",
// // // //           },
// // // //           body: JSON.stringify({
// // // //             code: supervisorPasscode,
// // // //             type: "supervisor",
// // // //           }),
// // // //         }
// // // //       );

// // // //       const data = await response.json();
// // // //       if (data.valid) {
// // // //         setShowPasscodeDialog(false);
// // // //         setSupervisorPasscode("");
// // // //         endTest("Test submitted successfully with supervisor approval.");
// // // //       } else {
// // // //         toast({
// // // //           title: "Invalid Passcode",
// // // //           description: data.message || "The supervisor passcode is incorrect.",
// // // //           variant: "destructive",
// // // //         });
// // // //       }
// // // //     } catch (error) {
// // // //       console.error("Passcode validation error:", error);
// // // //       toast({
// // // //         title: "Error",
// // // //         description: "Failed to validate passcode. Please try again.",
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsValidatingPasscode(false);
// // // //     }
// // // //   };

// // // //   const handlePasscodeDialogClose = () => {
// // // //     if (timeLeft > 0) {
// // // //       setShowPasscodeDialog(false);
// // // //       setSupervisorPasscode("");
// // // //     }
// // // //   };

// // // //   if (loading) {
// // // //     return (
// // // //       <TestLayout>
// // // //         <div className="flex items-center justify-center min-h-screen">
// // // //           <div className="text-center">
// // // //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
// // // //             <p className="text-gray-600">Loading test...</p>
// // // //           </div>
// // // //         </div>
// // // //       </TestLayout>
// // // //     );
// // // //   }

// // // //   if (error || !testData) {
// // // //     return (
// // // //       <TestLayout>
// // // //         <div className="flex items-center justify-center min-h-screen">
// // // //           <div className="text-center">
// // // //             <div className="text-red-500 text-xl mb-4">⚠️</div>
// // // //             <h2 className="text-xl font-bold mb-2">Test Loading Error</h2>
// // // //             <p className="text-gray-600 mb-4">
// // // //               {error || "Failed to load test data"}
// // // //             </p>
// // // //             <Button onClick={() => navigate("/student/assessment")}>
// // // //               Back to Tests
// // // //             </Button>
// // // //           </div>
// // // //         </div>
// // // //       </TestLayout>
// // // //     );
// // // //   }

// // // //   console.log("Test Data:", testData);
// // // //   console.log("All Questions:", allQuestions);

// // // //   if (!testData || allQuestions.length === 0) {
// // // //     return (
// // // //       <TestLayout>
// // // //         <div className="p-6 text-center">
// // // //           <h2 className="text-xl font-bold mb-4">No Questions Available</h2>
// // // //           <p className="text-gray-600 mb-4">
// // // //             {!testData
// // // //               ? "Test data could not be loaded."
// // // //               : "This test does not contain any questions."}
// // // //           </p>
// // // //           <Button onClick={() => navigate("/student/assessment")}>
// // // //             Back to Tests
// // // //           </Button>
// // // //         </div>
// // // //       </TestLayout>
// // // //     );
// // // //   }

// // // //   const currentQuestion = allQuestions[currentQuestionIndex];

// // // //   // Safety check for current question
// // // //   if (!currentQuestion) {
// // // //     return (
// // // //       <TestLayout>
// // // //         <div className="p-6 text-center">
// // // //           <h2 className="text-xl font-bold mb-4">Question Not Found</h2>
// // // //           <p className="text-gray-600 mb-4">
// // // //             Unable to load the current question.
// // // //           </p>
// // // //           <Button onClick={() => navigate("/student/assessment")}>
// // // //             Back to Tests
// // // //           </Button>
// // // //         </div>
// // // //       </TestLayout>
// // // //     );
// // // //   }

// // // //   const formatTime = (s: number) =>
// // // //     `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// // // //   const handleAnswer = (value: string) => {
// // // //     setAnswers({ ...answers, [currentQuestion.id]: value });
// // // //   };

// // // //   const handleCodeAnswer = (code: string) => {
// // // //     const language =
// // // //       selectedLanguages[currentQuestion.id] ||
// // // //       currentQuestion.allowedLanguages[0];
// // // //     setCodeAnswers({
// // // //       ...codeAnswers,
// // // //       [currentQuestion.id]: { code, language },
// // // //     });
// // // //   };

// // // //   const handleLanguageChange = (questionId: number, language: string) => {
// // // //     setSelectedLanguages({ ...selectedLanguages, [questionId]: language });
// // // //     const currentCode = codeAnswers[questionId]?.code || "";
// // // //     setCodeAnswers({
// // // //       ...codeAnswers,
// // // //       [questionId]: { code: currentCode, language },
// // // //     });
// // // //   };

// // // //   const handleDryRun = async () => {
// // // //     if (currentQuestion.type !== "Coding") return;

// // // //     const code = codeAnswers[currentQuestion.id]?.code;
// // // //     const language =
// // // //       selectedLanguages[currentQuestion.id] ||
// // // //       currentQuestion.allowedLanguages[0];

// // // //     if (!code || !code.trim()) {
// // // //       toast({
// // // //         title: "Error",
// // // //         description: "Please write some code before running",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     setIsRunning(true);

// // // //     try {
// // // //       const response = await fetch(`${API_BASE_URL}/api/coding/dry-run`, {
// // // //         method: "POST",
// // // //         headers: {
// // // //           "Content-Type": "application/json",
// // // //         },
// // // //         body: JSON.stringify({
// // // //           questionId: currentQuestion.id,
// // // //           code,
// // // //           language,
// // // //         }),
// // // //       });

// // // //       const result = await response.json();

// // // //       if (result.success) {
// // // //         setDryRunResults({ ...dryRunResults, [currentQuestion.id]: result });
// // // //         toast({
// // // //           title: "Dry Run Complete",
// // // //           description: `Passed ${result.summary.passed}/${result.summary.total} test cases`,
// // // //         });
// // // //       } else {
// // // //         toast({
// // // //           title: "Dry Run Failed",
// // // //           description: result.error || "Failed to execute code",
// // // //           variant: "destructive",
// // // //         });
// // // //       }
// // // //     } catch (error) {
// // // //       console.error("Dry run error:", error);
// // // //       toast({
// // // //         title: "Error",
// // // //         description: "Failed to run code. Please try again.",
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsRunning(false);
// // // //     }
// // // //   };

// // // //   const handleSubmitCode = async () => {
// // // //     if (currentQuestion.type !== "Coding") return;

// // // //     const code = codeAnswers[currentQuestion.id]?.code;
// // // //     const language =
// // // //       selectedLanguages[currentQuestion.id] ||
// // // //       currentQuestion.allowedLanguages[0];

// // // //     if (!code || !code.trim()) {
// // // //       toast({
// // // //         title: "Error",
// // // //         description: "Please write some code before submitting",
// // // //         variant: "destructive",
// // // //       });
// // // //       return;
// // // //     }

// // // //     setIsRunning(true);

// // // //     try {
// // // //       const response = await fetch(`${API_BASE_URL}/api/coding/submit`, {
// // // //         method: "POST",
// // // //         headers: {
// // // //           "Content-Type": "application/json",
// // // //         },
// // // //         body: JSON.stringify({
// // // //           questionId: currentQuestion.id,
// // // //           code,
// // // //           language,
// // // //           studentId: "student123", // Replace with actual student ID
// // // //           testId,
// // // //         }),
// // // //       });

// // // //       const result = await response.json();

// // // //       if (result.success) {
// // // //         setSubmissionResults({
// // // //           ...submissionResults,
// // // //           [currentQuestion.id]: result,
// // // //         });
// // // //         toast({
// // // //           title: "Code Submitted",
// // // //           description: `Score: ${result.score}/${result.maxScore} (${result.testResults.percentage}%)`,
// // // //         });
// // // //         handleNext();
// // // //       } else {
// // // //         toast({
// // // //           title: "Submission Failed",
// // // //           description: result.error || "Failed to submit code",
// // // //           variant: "destructive",
// // // //         });
// // // //       }
// // // //     } catch (error) {
// // // //       console.error("Code submission error:", error);
// // // //       toast({
// // // //         title: "Error",
// // // //         description: "Failed to submit code. Please try again.",
// // // //         variant: "destructive",
// // // //       });
// // // //     } finally {
// // // //       setIsRunning(false);
// // // //     }
// // // //   };

// // // //   const handleMark = () => {
// // // //     const newSet = new Set(markedForReview);
// // // //     if (newSet.has(currentQuestion.id)) {
// // // //       newSet.delete(currentQuestion.id);
// // // //     } else {
// // // //       newSet.add(currentQuestion.id);
// // // //     }
// // // //     setMarkedForReview(newSet);
// // // //     handleNext();
// // // //   };

// // // //   const handleNext = () => {
// // // //     if (currentQuestionIndex < allQuestions.length - 1) {
// // // //       setCurrentQuestionIndex((i) => i + 1);
// // // //     }
// // // //   };

// // // //   const handlePrev = () => {
// // // //     if (currentQuestionIndex > 0) {
// // // //       setCurrentQuestionIndex((i) => i - 1);
// // // //     }
// // // //   };

// // // //   const handleClear = () => {
// // // //     if (currentQuestion.type === "MCQ") {
// // // //       const newAnswers = { ...answers };
// // // //       delete newAnswers[currentQuestion.id];
// // // //       setAnswers(newAnswers);
// // // //     } else {
// // // //       const newCodeAnswers = { ...codeAnswers };
// // // //       delete newCodeAnswers[currentQuestion.id];
// // // //       setCodeAnswers(newCodeAnswers);
// // // //     }
// // // //   };

// // // //   const getStatusColor = (qid: number, questionType: string) => {
// // // //     const hasAnswer =
// // // //       questionType === "MCQ" ? answers[qid] : codeAnswers[qid]?.code;
// // // //     const isSubmitted = questionType === "Coding" && submissionResults[qid];

// // // //     if (isSubmitted) return "bg-blue-500 text-white";
// // // //     if (hasAnswer) return "bg-green-500 text-white";
// // // //     if (markedForReview.has(qid)) return "bg-purple-500 text-white";
// // // //     if (qid === currentQuestion.id) return "bg-orange-500 text-white";
// // // //     return "bg-gray-200 text-gray-700";
// // // //   };

// // // //   return (
// // // //     <TestLayout>
// // // //       <div className="flex h-screen">
// // // //         {/* Main Area */}
// // // //         <div className="flex-1 flex flex-col">
// // // //           <div className="bg-white border-b p-4 flex justify-between items-center">
// // // //             <h1 className="text-lg font-semibold">{testData.name}</h1>
// // // //             <div className="flex items-center gap-4 text-orange-600">
// // // //               <Clock className="w-4 h-4" />
// // // //               <span>Time Left: {formatTime(timeLeft)}</span>
// // // //               <Button
// // // //                 variant="destructive"
// // // //                 size="sm"
// // // //                 onClick={handleManualSubmit}
// // // //                 disabled={
// // // //                   isTestEnded ||
// // // //                   (totalTestDuration - timeLeft) / totalTestDuration < 0.9
// // // //                 }
// // // //               >
// // // //                 Submit Test
// // // //               </Button>
// // // //             </div>
// // // //           </div>

// // // //           <div className="p-4">
// // // //             <Card>
// // // //               <CardHeader>
// // // //                 <CardTitle>
// // // //                   Q{currentQuestion.questionNo}: {currentQuestion.questionText}
// // // //                 </CardTitle>
// // // //                 {currentQuestion.questionImage && (
// // // //                   <div className="mt-2">
// // // //                     <img
// // // //                       src={currentQuestion.questionImage}
// // // //                       alt="Question"
// // // //                       className="max-w-full h-auto rounded border"
// // // //                       onError={(e) => {
// // // //                         console.error(
// // // //                           "Question image failed to load:",
// // // //                           currentQuestion.questionImage
// // // //                         );
// // // //                         e.currentTarget.style.display = "none";
// // // //                       }}
// // // //                     />
// // // //                   </div>
// // // //                 )}
// // // //               </CardHeader>
// // // //               <CardContent>
// // // //                 {currentQuestion.type === "MCQ" ? (
// // // //                   <RadioGroup
// // // //                     value={answers[currentQuestion.id] || ""}
// // // //                     onValueChange={handleAnswer}
// // // //                     disabled={isTestEnded}
// // // //                   >
// // // //                     {["A", "B", "C", "D"].map((opt) => (
// // // //                       <div
// // // //                         key={opt}
// // // //                         className="flex items-start space-x-3 p-3 border rounded mb-2"
// // // //                       >
// // // //                         <RadioGroupItem
// // // //                           value={opt}
// // // //                           id={`opt-${opt}`}
// // // //                           className="mt-1"
// // // //                         />
// // // //                         <Label
// // // //                           htmlFor={`opt-${opt}`}
// // // //                           className="flex-1 cursor-pointer"
// // // //                         >
// // // //                           <div className="flex items-start gap-2">
// // // //                             <span className="font-medium">{opt})</span>
// // // //                             <div className="flex-1">
// // // //                               <div>{currentQuestion[`option${opt}`]}</div>
// // // //                               {currentQuestion[`option${opt}Image`] && (
// // // //                                 <img
// // // //                                   src={currentQuestion[`option${opt}Image`]}
// // // //                                   alt={`Option ${opt}`}
// // // //                                   className="mt-2 max-w-xs h-auto rounded border"
// // // //                                   onError={(e) => {
// // // //                                     console.error(
// // // //                                       `Option ${opt} image failed to load:`,
// // // //                                       currentQuestion[`option${opt}Image`]
// // // //                                     );
// // // //                                     e.currentTarget.style.display = "none";
// // // //                                   }}
// // // //                                 />
// // // //                               )}
// // // //                             </div>
// // // //                           </div>
// // // //                         </Label>
// // // //                       </div>
// // // //                     ))}
// // // //                   </RadioGroup>
// // // //                 ) : (
// // // //                   <div className="space-y-4">
// // // //                     <div className="bg-gray-50 p-4 rounded-lg">
// // // //                       <h4 className="font-medium mb-2">Problem Statement:</h4>
// // // //                       <div className="whitespace-pre-wrap">
// // // //                         {currentQuestion.problemStatement}
// // // //                       </div>

// // // //                       {currentQuestion.constraints && (
// // // //                         <div className="mt-4">
// // // //                           <h5 className="font-medium mb-1">Constraints:</h5>
// // // //                           <div className="text-sm text-gray-600 whitespace-pre-wrap">
// // // //                             {currentQuestion.constraints}
// // // //                           </div>
// // // //                         </div>
// // // //                       )}

// // // //                       {currentQuestion.sampleTestCases &&
// // // //                         currentQuestion.sampleTestCases.length > 0 && (
// // // //                           <div className="mt-4">
// // // //                             <h5 className="font-medium mb-2">
// // // //                               Sample Test Cases:
// // // //                             </h5>
// // // //                             <div className="space-y-2">
// // // //                               {currentQuestion.sampleTestCases.map(
// // // //                                 (testCase: any, index: number) => (
// // // //                                   <div
// // // //                                     key={index}
// // // //                                     className="bg-white p-3 rounded border"
// // // //                                   >
// // // //                                     <div className="grid grid-cols-2 gap-4 text-sm">
// // // //                                       <div>
// // // //                                         <strong>Input:</strong>
// // // //                                         <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">
// // // //                                           {testCase.input}
// // // //                                         </pre>
// // // //                                       </div>
// // // //                                       <div>
// // // //                                         <strong>Output:</strong>
// // // //                                         <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">
// // // //                                           {testCase.output}
// // // //                                         </pre>
// // // //                                       </div>
// // // //                                     </div>
// // // //                                   </div>
// // // //                                 )
// // // //                               )}
// // // //                             </div>
// // // //                           </div>
// // // //                         )}
// // // //                     </div>

// // // //                     <div className="flex items-center gap-4">
// // // //                       <div className="flex-1">
// // // //                         <Label>Programming Language:</Label>
// // // //                         <Select
// // // //                           value={
// // // //                             selectedLanguages[currentQuestion.id] ||
// // // //                             currentQuestion.allowedLanguages[0]
// // // //                           }
// // // //                           onValueChange={(value) =>
// // // //                             handleLanguageChange(currentQuestion.id, value)
// // // //                           }
// // // //                           disabled={isTestEnded}
// // // //                         >
// // // //                           <SelectTrigger className="mt-1">
// // // //                             <SelectValue />
// // // //                           </SelectTrigger>
// // // //                           <SelectContent>
// // // //                             {currentQuestion.allowedLanguages.map(
// // // //                               (lang: string) => (
// // // //                                 <SelectItem key={lang} value={lang}>
// // // //                                   {lang}
// // // //                                 </SelectItem>
// // // //                               )
// // // //                             )}
// // // //                           </SelectContent>
// // // //                         </Select>
// // // //                       </div>

// // // //                       <div className="flex gap-2">
// // // //                         <Button
// // // //                           variant="outline"
// // // //                           size="sm"
// // // //                           onClick={handleDryRun}
// // // //                           disabled={isTestEnded || isRunning}
// // // //                           className="gap-2"
// // // //                         >
// // // //                           <Play className="w-4 h-4" />
// // // //                           {isRunning ? "Running..." : "Dry Run"}
// // // //                         </Button>

// // // //                         <Button
// // // //                           size="sm"
// // // //                           onClick={handleSubmitCode}
// // // //                           disabled={isTestEnded || isRunning}
// // // //                           className="gap-2 bg-blue-600 hover:bg-blue-700"
// // // //                         >
// // // //                           <Send className="w-4 h-4" />
// // // //                           Submit Code
// // // //                         </Button>
// // // //                       </div>
// // // //                     </div>

// // // //                     <div>
// // // //                       <Label>Your Solution:</Label>
// // // //                       <Textarea
// // // //                         placeholder={`Write your ${
// // // //                           selectedLanguages[currentQuestion.id] ||
// // // //                           currentQuestion.allowedLanguages[0]
// // // //                         } code here...`}
// // // //                         value={codeAnswers[currentQuestion.id]?.code || ""}
// // // //                         onChange={(e) => handleCodeAnswer(e.target.value)}
// // // //                         className="mt-2 font-mono text-sm"
// // // //                         rows={15}
// // // //                         disabled={isTestEnded}
// // // //                       />
// // // //                     </div>

// // // //                     {/* Dry Run Results */}
// // // //                     {dryRunResults[currentQuestion.id] && (
// // // //                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
// // // //                         <h5 className="font-medium mb-2 text-blue-800">
// // // //                           Dry Run Results:
// // // //                         </h5>
// // // //                         <div className="text-sm">
// // // //                           <p className="mb-2">
// // // //                             Passed:{" "}
// // // //                             {dryRunResults[currentQuestion.id].summary.passed}/
// // // //                             {dryRunResults[currentQuestion.id].summary.total}{" "}
// // // //                             test cases
// // // //                           </p>
// // // //                           <div className="space-y-2">
// // // //                             {dryRunResults[currentQuestion.id].results.map(
// // // //                               (result: any, index: number) => (
// // // //                                 <div
// // // //                                   key={index}
// // // //                                   className={`p-2 rounded ${
// // // //                                     result.passed
// // // //                                       ? "bg-green-100"
// // // //                                       : "bg-red-100"
// // // //                                   }`}
// // // //                                 >
// // // //                                   <div className="font-medium">
// // // //                                     {result.passed ? "✅" : "❌"} Test Case{" "}
// // // //                                     {index + 1}
// // // //                                   </div>
// // // //                                   {!result.passed && (
// // // //                                     <div className="text-xs mt-1">
// // // //                                       <div>
// // // //                                         Expected: {result.expectedOutput}
// // // //                                       </div>
// // // //                                       <div>Got: {result.actualOutput}</div>
// // // //                                       {result.error && (
// // // //                                         <div className="text-red-600">
// // // //                                           Error: {result.error}
// // // //                                         </div>
// // // //                                       )}
// // // //                                     </div>
// // // //                                   )}
// // // //                                 </div>
// // // //                               )
// // // //                             )}
// // // //                           </div>
// // // //                         </div>
// // // //                       </div>
// // // //                     )}

// // // //                     {/* Submission Results */}
// // // //                     {submissionResults[currentQuestion.id] && (
// // // //                       <div className="bg-green-50 p-4 rounded-lg border border-green-200">
// // // //                         <h5 className="font-medium mb-2 text-green-800">
// // // //                           Submission Results:
// // // //                         </h5>
// // // //                         <div className="text-sm">
// // // //                           <p>
// // // //                             Status:{" "}
// // // //                             <span
// // // //                               className={`font-medium ${
// // // //                                 submissionResults[currentQuestion.id].status ===
// // // //                                 "passed"
// // // //                                   ? "text-green-600"
// // // //                                   : "text-red-600"
// // // //                               }`}
// // // //                             >
// // // //                               {submissionResults[
// // // //                                 currentQuestion.id
// // // //                               ].status.toUpperCase()}
// // // //                             </span>
// // // //                           </p>
// // // //                           <p>
// // // //                             Score: {submissionResults[currentQuestion.id].score}
// // // //                             /{submissionResults[currentQuestion.id].maxScore}
// // // //                           </p>
// // // //                           <p>
// // // //                             Test Cases:{" "}
// // // //                             {
// // // //                               submissionResults[currentQuestion.id].testResults
// // // //                                 .passed
// // // //                             }
// // // //                             /
// // // //                             {
// // // //                               submissionResults[currentQuestion.id].testResults
// // // //                                 .total
// // // //                             }{" "}
// // // //                             passed
// // // //                           </p>
// // // //                         </div>
// // // //                       </div>
// // // //                     )}
// // // //                   </div>
// // // //                 )}

// // // //                 <div className="flex justify-between mt-6 pt-4 border-t">
// // // //                   <div className="space-x-2">
// // // //                     <Button
// // // //                       variant="outline"
// // // //                       onClick={handlePrev}
// // // //                       disabled={currentQuestionIndex === 0 || isTestEnded}
// // // //                     >
// // // //                       Previous
// // // //                     </Button>
// // // //                     <Button
// // // //                       variant="outline"
// // // //                       onClick={handleMark}
// // // //                       disabled={isTestEnded}
// // // //                     >
// // // //                       {markedForReview.has(currentQuestion.id)
// // // //                         ? "Unmark"
// // // //                         : "Mark for Review"}{" "}
// // // //                       & Next
// // // //                     </Button>
// // // //                   </div>
// // // //                   <div className="space-x-2">
// // // //                     <Button
// // // //                       variant="outline"
// // // //                       onClick={handleClear}
// // // //                       disabled={isTestEnded}
// // // //                     >
// // // //                       Clear
// // // //                     </Button>
// // // //                     <Button
// // // //                       onClick={handleNext}
// // // //                       disabled={
// // // //                         currentQuestionIndex === allQuestions.length - 1 ||
// // // //                         isTestEnded
// // // //                       }
// // // //                     >
// // // //                       Save & Next
// // // //                     </Button>
// // // //                   </div>
// // // //                 </div>
// // // //               </CardContent>
// // // //             </Card>
// // // //           </div>
// // // //         </div>

// // // //         {/* Sidebar */}
// // // //         <div className="w-80 border-l p-4 bg-white">
// // // //           <h3 className="text-md font-semibold mb-2">Question Palette</h3>
// // // //           <div className="grid grid-cols-4 gap-2">
// // // //             {allQuestions.map((q: any, idx: number) => (
// // // //               <button
// // // //                 key={q.id}
// // // //                 className={`w-8 h-8 rounded ${getStatusColor(q.id, q.type)}`}
// // // //                 onClick={() => setCurrentQuestionIndex(idx)}
// // // //                 disabled={isTestEnded}
// // // //               >
// // // //                 {q.questionNo}
// // // //               </button>
// // // //             ))}
// // // //           </div>

// // // //           <div className="mt-6 space-y-2">
// // // //             <div className="flex items-center">
// // // //               <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
// // // //               <span>Answered</span>
// // // //             </div>
// // // //             <div className="flex items-center">
// // // //               <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
// // // //               <span>Submitted</span>
// // // //             </div>
// // // //             <div className="flex items-center">
// // // //               <div className="w-4 h-4 rounded bg-purple-500 mr-2"></div>
// // // //               <span>Marked</span>
// // // //             </div>
// // // //             <div className="flex items-center">
// // // //               <div className="w-4 h-4 rounded bg-orange-500 mr-2"></div>
// // // //               <span>Current</span>
// // // //             </div>
// // // //             <div className="flex items-center">
// // // //               <div className="w-4 h-4 rounded bg-gray-200 mr-2"></div>
// // // //               <span>Unanswered</span>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       {/* Supervisor Passcode Dialog */}
// // // //       <Dialog
// // // //         open={showPasscodeDialog}
// // // //         onOpenChange={handlePasscodeDialogClose}
// // // //       >
// // // //         <DialogContent className="sm:max-w-md">
// // // //           <DialogHeader>
// // // //             <DialogTitle>Supervisor Passcode Required</DialogTitle>
// // // //           </DialogHeader>
// // // //           <div className="space-y-4">
// // // //             <p className="text-sm text-gray-600">
// // // //               {timeLeft === 0
// // // //                 ? "Test time has ended. Please enter the supervisor passcode to submit your test."
// // // //                 : "To submit the test, please enter the supervisor passcode."}
// // // //             </p>
// // // //             <div>
// // // //               <Label htmlFor="passcode">Supervisor Passcode</Label>
// // // //               <Input
// // // //                 id="passcode"
// // // //                 type="password"
// // // //                 placeholder="Enter 6-digit passcode"
// // // //                 value={supervisorPasscode}
// // // //                 onChange={(e) => setSupervisorPasscode(e.target.value)}
// // // //                 maxLength={6}
// // // //                 className="mt-1"
// // // //                 onKeyPress={(e) => {
// // // //                   if (e.key === "Enter") {
// // // //                     validateSupervisorPasscode();
// // // //                   }
// // // //                 }}
// // // //               />
// // // //             </div>
// // // //           </div>
// // // //           <DialogFooter>
// // // //             {timeLeft > 0 && (
// // // //               <Button variant="outline" onClick={handlePasscodeDialogClose}>
// // // //                 Cancel
// // // //               </Button>
// // // //             )}
// // // //             <Button
// // // //               onClick={validateSupervisorPasscode}
// // // //               disabled={isValidatingPasscode || !supervisorPasscode.trim()}
// // // //             >
// // // //               {isValidatingPasscode ? "Validating..." : "Submit Test"}
// // // //             </Button>
// // // //           </DialogFooter>
// // // //         </DialogContent>
// // // //       </Dialog>

// // // //       {/* Fullscreen Warning Dialog */}
// // // //       <Dialog open={showFullscreenWarning} onOpenChange={() => {}}>
// // // //         <DialogContent className="sm:max-w-md">
// // // //           <DialogHeader>
// // // //             <DialogTitle className="flex items-center gap-2 text-red-600">
// // // //               <AlertTriangle className="w-5 h-5" />
// // // //               Fullscreen Exit Detected
// // // //             </DialogTitle>
// // // //           </DialogHeader>
// // // //           <div className="space-y-4">
// // // //             <div className="bg-red-50 p-4 rounded-lg border border-red-200">
// // // //               <div className="text-center">
// // // //                 <div className="text-3xl font-bold text-red-600 mb-2">
// // // //                   {fullscreenCountdown}
// // // //                 </div>
// // // //                 <p className="text-sm text-red-700 font-medium">
// // // //                   seconds to return to fullscreen
// // // //                 </p>
// // // //               </div>
// // // //             </div>

// // // //             <div className="space-y-3">
// // // //               <p className="text-sm text-gray-600">
// // // //                 <strong>Violation {fullscreenViolations}/3:</strong> You have
// // // //                 exited fullscreen mode. Please return to fullscreen immediately
// // // //                 to continue your test.
// // // //               </p>

// // // //               <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
// // // //                 <p className="text-sm text-yellow-800">
// // // //                   <strong>Warning:</strong> If you don't return to fullscreen
// // // //                   within {fullscreenCountdown} seconds, your test will be
// // // //                   automatically ended.
// // // //                 </p>
// // // //               </div>
// // // //             </div>
// // // //           </div>
// // // //           <DialogFooter>
// // // //             <Button
// // // //               onClick={handleEnterFullscreen}
// // // //               className="gap-2 bg-green-600 hover:bg-green-700"
// // // //               size="lg"
// // // //             >
// // // //               <Fullscreen className="w-4 h-4" />
// // // //               Enter Fullscreen Mode
// // // //             </Button>
// // // //           </DialogFooter>
// // // //         </DialogContent>
// // // //       </Dialog>
// // // //     </TestLayout>
// // // //   );
// // // // };

// // // // export default MCQTest;


// // // import { useEffect, useState, useRef } from "react";
// // // import { useParams, useNavigate } from "react-router-dom";
// // // import { toast } from "@/components/ui/use-toast";
// // // import { Button } from "@/components/ui/button";
// // // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // // import { Label } from "@/components/ui/label";
// // // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // // import { Badge } from "@/components/ui/badge";
// // // import { Textarea } from "@/components/ui/textarea";
// // // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // // import { Input } from "@/components/ui/input";
// // // import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// // // import { Clock, Play, Send, Code, Fullscreen, AlertTriangle } from "lucide-react";
// // // import TestLayout from "@/components/TestLayout";
// // // import { API_BASE_URL } from "@/config/api";

// // // const MCQTest = () => {
// // //   const { testId } = useParams();
// // //   const navigate = useNavigate();
// // //   const [testData, setTestData] = useState<any>(null);
// // //   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
// // //   const [answers, setAnswers] = useState<Record<number, string>>({});
// // //   const [codeAnswers, setCodeAnswers] = useState<Record<number, { code: string; language: string }>>({});
// // //   const [selectedLanguages, setSelectedLanguages] = useState<Record<number, string>>({});
// // //   const [dryRunResults, setDryRunResults] = useState<Record<number, any>>({});
// // //   const [isRunning, setIsRunning] = useState(false);
// // //   const [submissionResults, setSubmissionResults] = useState<Record<number, any>>({});
// // //   const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
// // //   const [timeLeft, setTimeLeft] = useState(1800); // default 30 mins
// // //   const [isPaused, setIsPaused] = useState(false);
// // //   const [isTestEnded, setIsTestEnded] = useState(false);
// // //   const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
// // //   const [supervisorPasscode, setSupervisorPasscode] = useState("");
// // //   const [isValidatingPasscode, setIsValidatingPasscode] = useState(false);
// // //   const [totalTestDuration, setTotalTestDuration] = useState(1800);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState<string | null>(null);
  
// // //   // New states for fullscreen warning
// // //   const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
// // //   const [fullscreenCountdown, setFullscreenCountdown] = useState(30);
// // //   const [fullscreenViolations, setFullscreenViolations] = useState(0);
// // //   const [isInFullscreen, setIsInFullscreen] = useState(true);

// // //   // Use ref to track the latest violations count
// // //   const fullscreenViolationsRef = useRef(fullscreenViolations);

// // //   // Keep ref in sync with state
// // //   useEffect(() => {
// // //     fullscreenViolationsRef.current = fullscreenViolations;
// // //   }, [fullscreenViolations]);

// // //   // Fetch test data
// // //   useEffect(() => {
// // //     const fetchTest = async () => {
// // //       try {
// // //         setLoading(true);
// // //         setError(null);
// // //         const res = await fetch(`http://localhost:5000/api/test/${testId}`);
// // //         if (!res.ok) {
// // //           throw new Error('Failed to fetch test data');
// // //         }
// // //         const json = await res.json();
// // //         console.log('Fetched test data:', json);
// // //         setTestData(json);
// // //         const totalSeconds = json.Sections?.reduce((acc: number, sec: any) => acc + (sec.duration || 0) * 60, 0) || 1800;
// // //         setTimeLeft(totalSeconds);
// // //         setTotalTestDuration(totalSeconds);
// // //       } catch (error) {
// // //         console.error('Error fetching test:', error);
// // //         setError('Failed to load test. Please try again.');
// // //         toast({
// // //           title: "Error",
// // //           description: "Failed to load test. Please try again.",
// // //           variant: "destructive",
// // //         });
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };
// // //     fetchTest();
// // //   }, [testId, navigate]);

// // //   // Timer logic
// // //   useEffect(() => {
// // //     if (!isPaused && timeLeft > 0 && !isTestEnded) {
// // //       const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
// // //       return () => clearInterval(timer);
// // //     } else if (timeLeft === 0 && !isTestEnded) {
// // //       handleTimeUp();
// // //     }
// // //   }, [timeLeft, isPaused, isTestEnded]);

// // //   // Fullscreen countdown timer
// // //   useEffect(() => {
// // //     let countdownTimer: NodeJS.Timeout;
    
// // //     if (showFullscreenWarning && fullscreenCountdown > 0 && !isTestEnded) {
// // //       countdownTimer = setInterval(() => {
// // //         setFullscreenCountdown((prev) => {
// // //           if (prev <= 1) {
// // //             clearInterval(countdownTimer);
// // //             handleFullscreenTimeout();
// // //             return 0;
// // //           }
// // //           return prev - 1;
// // //         });
// // //       }, 1000);
// // //     }
    
// // //     return () => {
// // //       if (countdownTimer) clearInterval(countdownTimer);
// // //     };
// // //   }, [showFullscreenWarning, fullscreenCountdown, isTestEnded]);

// // //   // Handle fullscreen timeout
// // //   const handleFullscreenTimeout = () => {
// // //     endTest("You did not return to fullscreen mode in time. Test ended.");
// // //   };

// // //   // Handle fullscreen change with proper violation tracking
// // //   const handleFullscreenChange = () => {
// // //     const isFullscreen = !!document.fullscreenElement;
// // //     setIsInFullscreen(isFullscreen);
    
// // //     if (!isFullscreen && !isTestEnded) {
// // //       // Use the ref to get the current value
// // //       const currentViolations = fullscreenViolationsRef.current + 1;
      
// // //       // Update state immediately
// // //       setFullscreenViolations(currentViolations);
// // //       fullscreenViolationsRef.current = currentViolations;
      
// // //       console.log(`Fullscreen violation detected. Current: ${currentViolations}/3`);
      
// // //       if (currentViolations >= 3) {
// // //         endTest("Maximum fullscreen violations reached. Test ended.");
// // //         return;
// // //       }
      
// // //       setShowFullscreenWarning(true);
// // //       setFullscreenCountdown(30);
      
// // //       toast({
// // //         title: "Fullscreen Exit Detected",
// // //         description: `Please return to fullscreen mode. You have 30 seconds. Violation ${currentViolations}/3`,
// // //         variant: "destructive",
// // //       });
// // //     } else if (isFullscreen) {
// // //       setShowFullscreenWarning(false);
// // //       setFullscreenCountdown(30);
// // //     }
// // //   };

// // //   // Fullscreen + event listeners on mount
// // //   useEffect(() => {
// // //     if (isTestEnded) return;

// // //     const enterFullscreen = async () => {
// // //       try {
// // //         const elem = document.documentElement;
// // //         if (elem.requestFullscreen) {
// // //           await elem.requestFullscreen();
// // //           setIsInFullscreen(true);
// // //           setShowFullscreenWarning(false);
// // //           setFullscreenViolations(0);
// // //           fullscreenViolationsRef.current = 0;
// // //         }
// // //       } catch (err) {
// // //         console.error("Fullscreen error:", err);
// // //       }
// // //     };

// // //     const handleVisibilityChange = () => {
// // //       if (document.hidden && !isTestEnded) {
// // //         endTest("You left the tab. Test ended.");
// // //       }
// // //     };

// // //     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
// // //       if (!isTestEnded) {
// // //         e.preventDefault();
// // //         e.returnValue = "Are you sure you want to leave? Your test will be submitted.";
// // //       }
// // //     };

// // //     enterFullscreen();

// // //     document.addEventListener("visibilitychange", handleVisibilityChange);
// // //     document.addEventListener("fullscreenchange", handleFullscreenChange);
// // //     window.addEventListener("beforeunload", handleBeforeUnload);

// // //     return () => {
// // //       document.removeEventListener("visibilitychange", handleVisibilityChange);
// // //       document.removeEventListener("fullscreenchange", handleFullscreenChange);
// // //       window.removeEventListener("beforeunload", handleBeforeUnload);
// // //     };
// // //   }, [isTestEnded]); // Remove fullscreenViolations from dependencies

// // //   const handleEnterFullscreen = async () => {
// // //     try {
// // //       const elem = document.documentElement;
// // //       if (elem.requestFullscreen) {
// // //         await elem.requestFullscreen();
// // //         setIsInFullscreen(true);
// // //         setShowFullscreenWarning(false);
// // //         setFullscreenCountdown(30);
// // //       }
// // //     } catch (err) {
// // //       console.error("Fullscreen error:", err);
// // //       toast({
// // //         title: "Fullscreen Error",
// // //         description: "Could not enter fullscreen mode. Please try again.",
// // //         variant: "destructive",
// // //       });
// // //     }
// // //   };

// // //   // Define allQuestions before using it in endTest
// // //   const allQuestions = (testData?.Sections || []).flatMap((section: any) => {
// // //     const mcqQuestions = (section?.MCQs || []).map((q: any, index: number) => ({
// // //       ...q,
// // //       type: 'MCQ',
// // //       sectionName: section?.name || 'Unknown Section',
// // //       questionNo: index + 1
// // //     }));
    
// // //     const codingQuestions = (section?.codingQuestions || []).map((q: any, index: number) => ({
// // //       ...q,
// // //       type: 'Coding',
// // //       sectionName: section?.name || 'Unknown Section',
// // //       questionNo: mcqQuestions.length + index + 1
// // //     }));
    
// // //     return [...mcqQuestions, ...codingQuestions];
// // //   });

// // //   const endTest = async (reason: string) => {
// // //     setIsTestEnded(true);
// // //     setShowFullscreenWarning(false);
    
// // //     if (document.fullscreenElement) {
// // //       document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
// // //     }

// // //     // Calculate results
// // //     const results = allQuestions.map(question => {
// // //       const userAnswer = answers[question.id];
// // //       const isCorrect = userAnswer === question.correctOptionLetter;
// // //       return {
// // //         ...question,
// // //         userAnswer,
// // //         isCorrect,
// // //         explanation: question.explanation
// // //       };
// // //     });

// // //     const correctAnswers = results.filter(r => r.isCorrect).length;
// // //     const totalScore = correctAnswers;
// // //     const maxScore = allQuestions.length;
    
// // //     const percentage = Math.round((correctAnswers / allQuestions.length) * 100);
// // //     const testResult = {
// // //       testId,
// // //       testName: testData.name,
// // //       totalScore: correctAnswers,
// // //       maxScore: allQuestions.length,
// // //       percentage,
// // //       status: 'completed',
// // //       completedAt: new Date().toISOString(),
// // //       startedAt: new Date().toISOString(),
// // //       hasMCQQuestions: true,
// // //       hasCodingQuestions: false,
// // //       mcqResults: {
// // //         totalQuestions: allQuestions.length,
// // //         correctAnswers,
// // //         wrongAnswers: allQuestions.length - correctAnswers,
// // //         unansweredCount: 0,
// // //         accuracyRate: percentage,
// // //         questions: results
// // //       }
// // //     };

// // //     // Save test result to database and localStorage
// // //     try {
// // //       // const userEmail = localStorage.getItem('userEmail') || 'test@example.com';
// // //       const storedUser = localStorage.getItem("user");
// // //       const user = storedUser ? JSON.parse(storedUser) : null;
// // //       const userEmail = user?.email || "test@example.com";
// // //       // const studentName = localStorage.getItem('userName') || 'Test Student';
// // //       const studentName = user.name || "test";
// // //       // const department = localStorage.getItem('userDepartment') || 'General';
// // //       const department = user.department || "General";
// // //       // const sinNumber = localStorage.getItem('userSIN') || 'SIN-' + Date.now().toString().slice(-6);
// // //       const sinNumber = user.userSIN || 'SIN-' + Date.now().toString().slice(-6);
      
// // //       const testResultData = {
// // //         testId: testId,
// // //         testName: testData.name,
// // //         userEmail: userEmail,
// // //         studentName: studentName,
// // //         department: department,
// // //         sinNumber: sinNumber,
// // //         totalScore: totalScore,
// // //         maxScore: maxScore,
// // //         percentage: Math.round((totalScore / maxScore) * 100),
// // //         completedAt: new Date().toISOString(),
// // //         date: new Date().toLocaleDateString(),
// // //         answers: JSON.stringify(answers),
// // //         sessionId: `session_${testId}_${Date.now()}`
// // //       };
      
// // //       // Enhance test result with detailed MCQ data for PDF reports
// // //       const enhancedTestResult = {
// // //         ...testResult,
// // //         mcqAnswers: results.map((question, index) => ({
// // //           questionId: question.id,
// // //           question: question.questionText || `Question ${index + 1}: Sample MCQ question`,
// // //           selectedAnswer: question.userAnswer,
// // //           correctAnswer: question.correctOptionLetter,
// // //           options: {
// // //             A: question.optionA || 'Option A',
// // //             B: question.optionB || 'Option B',
// // //             C: question.optionC || 'Option C',
// // //             D: question.optionD || 'Option D'
// // //           },
// // //           explanation: question.explanation || `The correct answer is ${question.correctOptionLetter}. ${question.isCorrect ? 'Well done!' : 'Review this topic for better understanding.'}`
// // //         }))
// // //       };
      
// // //       // Save to localStorage as backup with multiple key formats
// // //       localStorage.setItem(`test_result_${testId}`, JSON.stringify(enhancedTestResult));
// // //       localStorage.setItem(`testResult_${testId}_${userEmail}`, JSON.stringify(enhancedTestResult));
// // //       localStorage.setItem(`testResult_${testId}`, JSON.stringify(enhancedTestResult));
      
// // //       console.log('💾 Saved test result to localStorage with keys:', [
// // //         `test_result_${testId}`,
// // //         `testResult_${testId}_${userEmail}`,
// // //         `testResult_${testId}`
// // //       ]);
      
// // //       const response = await fetch(`${API_BASE_URL}/api/student/test-results`, {
// // //         method: 'POST',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //         },
// // //         body: JSON.stringify(testResultData)
// // //       });
      
// // //       if (response.ok) {
// // //         console.log('✅ Test result saved to database successfully');
// // //       } else {
// // //         const errorText = await response.text();
// // //         console.error('❌ Failed to save test result to database:', response.status, errorText);
// // //       }
// // //     } catch (error) {
// // //       console.error('❌ Error saving test result:', error);
// // //       // Still save to localStorage even if API fails
// // //       try {
// // //         localStorage.setItem(`test_result_${testId}`, JSON.stringify(testResult));
// // //         console.log('💾 Fallback: Saved test result to localStorage');
// // //       } catch (localError) {
// // //         console.error('❌ Failed to save to localStorage:', localError);
// // //       }
// // //     }

// // //     toast({
// // //       title: "Test Completed",
// // //       description: `You scored ${correctAnswers}/${allQuestions.length}`,
// // //     });

// // //     // Navigate to results page with a small delay to ensure data is saved
// // //     setTimeout(() => {
// // //       navigate(`/student/test/${testId}/result`);
// // //     }, 1000);
// // //   };

// // //   const handleTimeUp = () => {
// // //     toast({
// // //       title: "Time's Up!",
// // //       description: "Test time has ended. Please enter supervisor passcode to submit.",
// // //       variant: "destructive",
// // //     });
// // //     setShowPasscodeDialog(true);
// // //   };

// // //   const handleManualSubmit = () => {
// // //     const timeElapsed = (totalTestDuration - timeLeft) / totalTestDuration; // Calculate percentage of time elapsed
// // //     if (timeElapsed >= 0.9) { // 90% of time completed
// // //       setShowPasscodeDialog(true);
// // //     } else {
// // //       toast({
// // //         title: "Cannot Submit Yet",
// // //         description: `You can only submit after 90% of the test duration is completed. Currently ${Math.round(timeElapsed * 100)}% completed.`,
// // //         variant: "destructive",
// // //       });
// // //     }
// // //   };

// // //   const validateSupervisorPasscode = async () => {
// // //     if (!supervisorPasscode.trim()) {
// // //       toast({
// // //         title: "Error",
// // //         description: "Please enter the supervisor passcode.",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }

// // //     setIsValidatingPasscode(true);
// // //     try {
// // //       const response = await fetch('http://localhost:5000/api/passcode/validate', {
// // //         method: 'POST',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //         },
// // //         body: JSON.stringify({ 
// // //           code: supervisorPasscode,
// // //           type: 'supervisor'
// // //         }),
// // //       });

// // //       const data = await response.json();
// // //       if (data.valid) {
// // //         setShowPasscodeDialog(false);
// // //         setSupervisorPasscode("");
// // //         endTest("Test submitted successfully with supervisor approval.");
// // //       } else {
// // //         toast({
// // //           title: "Invalid Passcode",
// // //           description: data.message || "The supervisor passcode is incorrect.",
// // //           variant: "destructive",
// // //         });
// // //       }
// // //     } catch (error) {
// // //       console.error('Passcode validation error:', error);
// // //       toast({
// // //         title: "Error",
// // //         description: "Failed to validate passcode. Please try again.",
// // //         variant: "destructive",
// // //       });
// // //     } finally {
// // //       setIsValidatingPasscode(false);
// // //     }
// // //   };

// // //   const handlePasscodeDialogClose = () => {
// // //     if (timeLeft > 0) {
// // //       setShowPasscodeDialog(false);
// // //       setSupervisorPasscode("");
// // //     }
// // //   };

// // //   if (loading) {
// // //     return (
// // //       <TestLayout>
// // //         <div className="flex items-center justify-center min-h-screen">
// // //           <div className="text-center">
// // //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
// // //             <p className="text-gray-600">Loading test...</p>
// // //           </div>
// // //         </div>
// // //       </TestLayout>
// // //     );
// // //   }

// // //   if (error || !testData) {
// // //     return (
// // //       <TestLayout>
// // //         <div className="flex items-center justify-center min-h-screen">
// // //           <div className="text-center">
// // //             <div className="text-red-500 text-xl mb-4">⚠️</div>
// // //             <h2 className="text-xl font-bold mb-2">Test Loading Error</h2>
// // //             <p className="text-gray-600 mb-4">{error || 'Failed to load test data'}</p>
// // //             <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// // //           </div>
// // //         </div>
// // //       </TestLayout>
// // //     );
// // //   }

// // //   console.log('Test Data:', testData);
// // //   console.log('All Questions:', allQuestions);

// // //   if (!testData || allQuestions.length === 0) {
// // //     return (
// // //       <TestLayout>
// // //         <div className="p-6 text-center">
// // //           <h2 className="text-xl font-bold mb-4">No Questions Available</h2>
// // //           <p className="text-gray-600 mb-4">
// // //             {!testData ? 'Test data could not be loaded.' : 'This test does not contain any questions.'}
// // //           </p>
// // //           <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// // //         </div>
// // //       </TestLayout>
// // //     );
// // //   }

// // //   const currentQuestion = allQuestions[currentQuestionIndex];
  
// // //   // Safety check for current question
// // //   if (!currentQuestion) {
// // //     return (
// // //       <TestLayout>
// // //         <div className="p-6 text-center">
// // //           <h2 className="text-xl font-bold mb-4">Question Not Found</h2>
// // //           <p className="text-gray-600 mb-4">Unable to load the current question.</p>
// // //           <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// // //         </div>
// // //       </TestLayout>
// // //     );
// // //   }

// // //   const formatTime = (s: number) =>
// // //     `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// // //   const handleAnswer = (value: string) => {
// // //     setAnswers({ ...answers, [currentQuestion.id]: value });
// // //   };

// // //   const handleCodeAnswer = (code: string) => {
// // //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
// // //     setCodeAnswers({ ...codeAnswers, [currentQuestion.id]: { code, language } });
// // //   };

// // //   const handleLanguageChange = (questionId: number, language: string) => {
// // //     setSelectedLanguages({ ...selectedLanguages, [questionId]: language });
// // //     const currentCode = codeAnswers[questionId]?.code || '';
// // //     setCodeAnswers({ ...codeAnswers, [questionId]: { code: currentCode, language } });
// // //   };

// // //   const handleDryRun = async () => {
// // //     if (currentQuestion.type !== 'Coding') return;
    
// // //     const code = codeAnswers[currentQuestion.id]?.code;
// // //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    
// // //     if (!code || !code.trim()) {
// // //       toast({
// // //         title: "Error",
// // //         description: "Please write some code before running",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }
    
// // //     setIsRunning(true);
    
// // //     try {
// // //       const response = await fetch(`${API_BASE_URL}/api/coding/dry-run`, {
// // //         method: 'POST',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //         },
// // //         body: JSON.stringify({
// // //           questionId: currentQuestion.id,
// // //           code,
// // //           language
// // //         })
// // //       });
      
// // //       const result = await response.json();
      
// // //       if (result.success) {
// // //         setDryRunResults({ ...dryRunResults, [currentQuestion.id]: result });
// // //         toast({
// // //           title: "Dry Run Complete",
// // //           description: `Passed ${result.summary.passed}/${result.summary.total} test cases`,
// // //         });
// // //       } else {
// // //         toast({
// // //           title: "Dry Run Failed",
// // //           description: result.error || "Failed to execute code",
// // //           variant: "destructive",
// // //         });
// // //       }
// // //     } catch (error) {
// // //       console.error('Dry run error:', error);
// // //       toast({
// // //         title: "Error",
// // //         description: "Failed to run code. Please try again.",
// // //         variant: "destructive",
// // //       });
// // //     } finally {
// // //       setIsRunning(false);
// // //     }
// // //   };

// // //   const handleSubmitCode = async () => {
// // //     if (currentQuestion.type !== 'Coding') return;
    
// // //     const code = codeAnswers[currentQuestion.id]?.code;
// // //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    
// // //     if (!code || !code.trim()) {
// // //       toast({
// // //         title: "Error",
// // //         description: "Please write some code before submitting",
// // //         variant: "destructive",
// // //       });
// // //       return;
// // //     }
    
// // //     setIsRunning(true);
    
// // //     try {
// // //       const response = await fetch(`${API_BASE_URL}/api/coding/submit`, {
// // //         method: 'POST',
// // //         headers: {
// // //           'Content-Type': 'application/json',
// // //         },
// // //         body: JSON.stringify({
// // //           questionId: currentQuestion.id,
// // //           code,
// // //           language,
// // //           studentId: 'student123', // Replace with actual student ID
// // //           testId
// // //         })
// // //       });
      
// // //       const result = await response.json();
      
// // //       if (result.success) {
// // //         setSubmissionResults({ ...submissionResults, [currentQuestion.id]: result });
// // //         toast({
// // //           title: "Code Submitted",
// // //           description: `Score: ${result.score}/${result.maxScore} (${result.testResults.percentage}%)`,
// // //         });
// // //         handleNext();
// // //       } else {
// // //         toast({
// // //           title: "Submission Failed",
// // //           description: result.error || "Failed to submit code",
// // //           variant: "destructive",
// // //         });
// // //       }
// // //     } catch (error) {
// // //       console.error('Code submission error:', error);
// // //       toast({
// // //         title: "Error",
// // //         description: "Failed to submit code. Please try again.",
// // //         variant: "destructive",
// // //       });
// // //     } finally {
// // //       setIsRunning(false);
// // //     }
// // //   };

// // //   const handleMark = () => {
// // //     const newSet = new Set(markedForReview);
// // //     if (newSet.has(currentQuestion.id)) {
// // //       newSet.delete(currentQuestion.id);
// // //     } else {
// // //       newSet.add(currentQuestion.id);
// // //     }
// // //     setMarkedForReview(newSet);
// // //     handleNext();
// // //   };

// // //   const handleNext = () => {
// // //     if (currentQuestionIndex < allQuestions.length - 1) {
// // //       setCurrentQuestionIndex((i) => i + 1);
// // //     }
// // //   };

// // //   const handlePrev = () => {
// // //     if (currentQuestionIndex > 0) {
// // //       setCurrentQuestionIndex((i) => i - 1);
// // //     }
// // //   };

// // //   const handleClear = () => {
// // //     if (currentQuestion.type === 'MCQ') {
// // //       const newAnswers = { ...answers };
// // //       delete newAnswers[currentQuestion.id];
// // //       setAnswers(newAnswers);
// // //     } else {
// // //       const newCodeAnswers = { ...codeAnswers };
// // //       delete newCodeAnswers[currentQuestion.id];
// // //       setCodeAnswers(newCodeAnswers);
// // //     }
// // //   };

// // //   const getStatusColor = (qid: number, questionType: string) => {
// // //     const hasAnswer = questionType === 'MCQ' ? answers[qid] : codeAnswers[qid]?.code;
// // //     const isSubmitted = questionType === 'Coding' && submissionResults[qid];
    
// // //     if (isSubmitted) return "bg-blue-500 text-white";
// // //     if (hasAnswer) return "bg-green-500 text-white";
// // //     if (markedForReview.has(qid)) return "bg-purple-500 text-white";
// // //     if (qid === currentQuestion.id) return "bg-orange-500 text-white";
// // //     return "bg-gray-200 text-gray-700";
// // //   };

// // //   return (
// // //     <TestLayout>
// // //       <div className="flex h-screen">
// // //         {/* Main Area */}
// // //         <div className="flex-1 flex flex-col">
// // //           <div className="bg-white border-b p-4 flex justify-between items-center">
// // //             <h1 className="text-lg font-semibold">{testData.name}</h1>
// // //             <div className="flex items-center gap-4 text-orange-600">
// // //               <Clock className="w-4 h-4" />
// // //               <span>Time Left: {formatTime(timeLeft)}</span>
// // //               <div className="flex items-center gap-2 text-sm">
// // //                 <span>Violations: {fullscreenViolations}/3</span>
// // //               </div>
// // //               <Button 
// // //                 variant="destructive" 
// // //                 size="sm" 
// // //                 onClick={handleManualSubmit}
// // //                 disabled={isTestEnded || (totalTestDuration - timeLeft) / totalTestDuration < 0.9}
// // //               >
// // //                 Submit Test
// // //               </Button>
// // //             </div>
// // //           </div>

// // //           <div className="p-4">
// // //             <Card>
// // //               <CardHeader>
// // //                 <CardTitle>
// // //                   Q{currentQuestion.questionNo}: {currentQuestion.questionText}
// // //                 </CardTitle>
// // //                 {currentQuestion.questionImage && (
// // //                   <div className="mt-2">
// // //                     <img 
// // //                       src={currentQuestion.questionImage} 
// // //                       alt="Question" 
// // //                       className="max-w-full h-auto rounded border"
// // //                       onError={(e) => {
// // //                         console.error('Question image failed to load:', currentQuestion.questionImage);
// // //                         e.currentTarget.style.display = 'none';
// // //                       }}
// // //                     />
// // //                   </div>
// // //                 )}
// // //               </CardHeader>
// // //               <CardContent>
// // //                 {currentQuestion.type === 'MCQ' ? (
// // //                   <RadioGroup
// // //                     value={answers[currentQuestion.id] || ""}
// // //                     onValueChange={handleAnswer}
// // //                     disabled={isTestEnded}
// // //                   >
// // //                     {["A", "B", "C", "D"].map((opt) => (
// // //                       <div key={opt} className="flex items-start space-x-3 p-3 border rounded mb-2">
// // //                         <RadioGroupItem value={opt} id={`opt-${opt}`} className="mt-1" />
// // //                         <Label htmlFor={`opt-${opt}`} className="flex-1 cursor-pointer">
// // //                           <div className="flex items-start gap-2">
// // //                             <span className="font-medium">{opt})</span>
// // //                             <div className="flex-1">
// // //                               <div>{currentQuestion[`option${opt}`]}</div>
// // //                               {currentQuestion[`option${opt}Image`] && (
// // //                                 <img 
// // //                                   src={currentQuestion[`option${opt}Image`]} 
// // //                                   alt={`Option ${opt}`} 
// // //                                   className="mt-2 max-w-xs h-auto rounded border"
// // //                                   onError={(e) => {
// // //                                     console.error(`Option ${opt} image failed to load:`, currentQuestion[`option${opt}Image`]);
// // //                                     e.currentTarget.style.display = 'none';
// // //                                   }}
// // //                                 />
// // //                               )}
// // //                             </div>
// // //                           </div>
// // //                         </Label>
// // //                       </div>
// // //                     ))}
// // //                   </RadioGroup>
// // //                 ) : (
// // //                   <div className="space-y-4">
// // //                     <div className="bg-gray-50 p-4 rounded-lg">
// // //                       <h4 className="font-medium mb-2">Problem Statement:</h4>
// // //                       <div className="whitespace-pre-wrap">{currentQuestion.problemStatement}</div>
                      
// // //                       {currentQuestion.constraints && (
// // //                         <div className="mt-4">
// // //                           <h5 className="font-medium mb-1">Constraints:</h5>
// // //                           <div className="text-sm text-gray-600 whitespace-pre-wrap">{currentQuestion.constraints}</div>
// // //                         </div>
// // //                       )}
                      
// // //                       {currentQuestion.sampleTestCases && currentQuestion.sampleTestCases.length > 0 && (
// // //                         <div className="mt-4">
// // //                           <h5 className="font-medium mb-2">Sample Test Cases:</h5>
// // //                           <div className="space-y-2">
// // //                             {currentQuestion.sampleTestCases.map((testCase: any, index: number) => (
// // //                               <div key={index} className="bg-white p-3 rounded border">
// // //                                 <div className="grid grid-cols-2 gap-4 text-sm">
// // //                                   <div>
// // //                                     <strong>Input:</strong>
// // //                                     <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.input}</pre>
// // //                                   </div>
// // //                                   <div>
// // //                                     <strong>Output:</strong>
// // //                                     <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.output}</pre>
// // //                                   </div>
// // //                                 </div>
// // //                               </div>
// // //                             ))}
// // //                           </div>
// // //                         </div>
// // //                       )}
// // //                     </div>

// // //                     <div className="flex items-center gap-4">
// // //                       <div className="flex-1">
// // //                         <Label>Programming Language:</Label>
// // //                         <Select
// // //                           value={selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]}
// // //                           onValueChange={(value) => handleLanguageChange(currentQuestion.id, value)}
// // //                           disabled={isTestEnded}
// // //                         >
// // //                           <SelectTrigger className="mt-1">
// // //                             <SelectValue />
// // //                           </SelectTrigger>
// // //                           <SelectContent>
// // //                             {currentQuestion.allowedLanguages.map((lang: string) => (
// // //                               <SelectItem key={lang} value={lang}>{lang}</SelectItem>
// // //                             ))}
// // //                           </SelectContent>
// // //                         </Select>
// // //                       </div>
                      
// // //                       <div className="flex gap-2">
// // //                         <Button
// // //                           variant="outline"
// // //                           size="sm"
// // //                           onClick={handleDryRun}
// // //                           disabled={isTestEnded || isRunning}
// // //                           className="gap-2"
// // //                         >
// // //                           <Play className="w-4 h-4" />
// // //                           {isRunning ? 'Running...' : 'Dry Run'}
// // //                         </Button>
                        
// // //                         <Button
// // //                           size="sm"
// // //                           onClick={handleSubmitCode}
// // //                           disabled={isTestEnded || isRunning}
// // //                           className="gap-2 bg-blue-600 hover:bg-blue-700"
// // //                         >
// // //                           <Send className="w-4 h-4" />
// // //                           Submit Code
// // //                         </Button>
// // //                       </div>
// // //                     </div>

// // //                     <div>
// // //                       <Label>Your Solution:</Label>
// // //                       <Textarea
// // //                         placeholder={`Write your ${selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]} code here...`}
// // //                         value={codeAnswers[currentQuestion.id]?.code || ''}
// // //                         onChange={(e) => handleCodeAnswer(e.target.value)}
// // //                         className="mt-2 font-mono text-sm"
// // //                         rows={15}
// // //                         disabled={isTestEnded}
// // //                       />
// // //                     </div>
                    
// // //                     {/* Dry Run Results */}
// // //                     {dryRunResults[currentQuestion.id] && (
// // //                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
// // //                         <h5 className="font-medium mb-2 text-blue-800">Dry Run Results:</h5>
// // //                         <div className="text-sm">
// // //                           <p className="mb-2">Passed: {dryRunResults[currentQuestion.id].summary.passed}/{dryRunResults[currentQuestion.id].summary.total} test cases</p>
// // //                           <div className="space-y-2">
// // //                             {dryRunResults[currentQuestion.id].results.map((result: any, index: number) => (
// // //                               <div key={index} className={`p-2 rounded ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
// // //                                 <div className="font-medium">{result.passed ? '✅' : '❌'} Test Case {index + 1}</div>
// // //                                 {!result.passed && (
// // //                                   <div className="text-xs mt-1">
// // //                                     <div>Expected: {result.expectedOutput}</div>
// // //                                     <div>Got: {result.actualOutput}</div>
// // //                                     {result.error && <div className="text-red-600">Error: {result.error}</div>}
// // //                                   </div>
// // //                                 )}
// // //                               </div>
// // //                             ))}
// // //                           </div>
// // //                         </div>
// // //                       </div>
// // //                     )}
                    
// // //                     {/* Submission Results */}
// // //                     {submissionResults[currentQuestion.id] && (
// // //                       <div className="bg-green-50 p-4 rounded-lg border border-green-200">
// // //                         <h5 className="font-medium mb-2 text-green-800">Submission Results:</h5>
// // //                         <div className="text-sm">
// // //                           <p>Status: <span className={`font-medium ${submissionResults[currentQuestion.id].status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
// // //                             {submissionResults[currentQuestion.id].status.toUpperCase()}
// // //                           </span></p>
// // //                           <p>Score: {submissionResults[currentQuestion.id].score}/{submissionResults[currentQuestion.id].maxScore}</p>
// // //                           <p>Test Cases: {submissionResults[currentQuestion.id].testResults.passed}/{submissionResults[currentQuestion.id].testResults.total} passed</p>
// // //                         </div>
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 )}

// // //                 <div className="flex justify-between mt-6 pt-4 border-t">
// // //                   <div className="space-x-2">
// // //                     <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0 || isTestEnded}>
// // //                       Previous
// // //                     </Button>
// // //                     <Button variant="outline" onClick={handleMark} disabled={isTestEnded}>
// // //                       {markedForReview.has(currentQuestion.id) ? "Unmark" : "Mark for Review"} & Next
// // //                     </Button>
// // //                   </div>
// // //                   <div className="space-x-2">
// // //                     <Button variant="outline" onClick={handleClear} disabled={isTestEnded}>
// // //                       Clear
// // //                     </Button>
// // //                     <Button 
// // //                       onClick={handleNext} 
// // //                       disabled={currentQuestionIndex === allQuestions.length - 1 || isTestEnded}
// // //                     >
// // //                       Save & Next
// // //                     </Button>
// // //                   </div>
// // //                 </div>
// // //               </CardContent>
// // //             </Card>
// // //           </div>
// // //         </div>

// // //         {/* Sidebar */}
// // //         <div className="w-80 border-l p-4 bg-white">
// // //           <h3 className="text-md font-semibold mb-2">Question Palette</h3>
// // //           <div className="grid grid-cols-4 gap-2">
// // //             {allQuestions.map((q: any, idx: number) => (
// // //               <button
// // //                 key={q.id}
// // //                 className={`w-8 h-8 rounded ${getStatusColor(q.id, q.type)}`}
// // //                 onClick={() => setCurrentQuestionIndex(idx)}
// // //                 disabled={isTestEnded}
// // //               >
// // //                 {q.questionNo}
// // //               </button>
// // //             ))}
// // //           </div>

// // //           <div className="mt-6 space-y-2">
// // //             <div className="flex items-center">
// // //               <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
// // //               <span>Answered</span>
// // //             </div>
// // //             <div className="flex items-center">
// // //               <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
// // //               <span>Submitted</span>
// // //             </div>
// // //             <div className="flex items-center">
// // //               <div className="w-4 h-4 rounded bg-purple-500 mr-2"></div>
// // //               <span>Marked</span>
// // //             </div>
// // //             <div className="flex items-center">
// // //               <div className="w-4 h-4 rounded bg-orange-500 mr-2"></div>
// // //               <span>Current</span>
// // //             </div>
// // //             <div className="flex items-center">
// // //               <div className="w-4 h-4 rounded bg-gray-200 mr-2"></div>
// // //               <span>Unanswered</span>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Supervisor Passcode Dialog */}
// // //       <Dialog open={showPasscodeDialog} onOpenChange={handlePasscodeDialogClose}>
// // //         <DialogContent className="sm:max-w-md">
// // //           <DialogHeader>
// // //             <DialogTitle>Supervisor Passcode Required</DialogTitle>
// // //           </DialogHeader>
// // //           <div className="space-y-4">
// // //             <p className="text-sm text-gray-600">
// // //               {timeLeft === 0 
// // //                 ? "Test time has ended. Please enter the supervisor passcode to submit your test."
// // //                 : "To submit the test, please enter the supervisor passcode."}
// // //             </p>
// // //             <div>
// // //               <Label htmlFor="passcode">Supervisor Passcode</Label>
// // //               <Input
// // //                 id="passcode"
// // //                 type="password"
// // //                 placeholder="Enter 6-digit passcode"
// // //                 value={supervisorPasscode}
// // //                 onChange={(e) => setSupervisorPasscode(e.target.value)}
// // //                 maxLength={6}
// // //                 className="mt-1"
// // //                 onKeyPress={(e) => {
// // //                   if (e.key === 'Enter') {
// // //                     validateSupervisorPasscode();
// // //                   }
// // //                 }}
// // //               />
// // //             </div>
// // //           </div>
// // //           <DialogFooter>
// // //             {timeLeft > 0 && (
// // //               <Button variant="outline" onClick={handlePasscodeDialogClose}>
// // //                 Cancel
// // //               </Button>
// // //             )}
// // //             <Button 
// // //               onClick={validateSupervisorPasscode}
// // //               disabled={isValidatingPasscode || !supervisorPasscode.trim()}
// // //             >
// // //               {isValidatingPasscode ? 'Validating...' : 'Submit Test'}
// // //             </Button>
// // //           </DialogFooter>
// // //         </DialogContent>
// // //       </Dialog>

// // //       {/* Fullscreen Warning Dialog */}
// // //       <Dialog open={showFullscreenWarning} onOpenChange={() => {}}>
// // //         <DialogContent className="sm:max-w-md">
// // //           <DialogHeader>
// // //             <DialogTitle className="flex items-center gap-2 text-red-600">
// // //               <AlertTriangle className="w-5 h-5" />
// // //               Fullscreen Exit Detected
// // //             </DialogTitle>
// // //           </DialogHeader>
// // //           <div className="space-y-4">
// // //             <div className="bg-red-50 p-4 rounded-lg border border-red-200">
// // //               <div className="text-center">
// // //                 <div className="text-3xl font-bold text-red-600 mb-2">
// // //                   {fullscreenCountdown}
// // //                 </div>
// // //                 <p className="text-sm text-red-700 font-medium">
// // //                   seconds to return to fullscreen
// // //                 </p>
// // //               </div>
// // //             </div>
            
// // //             <div className="space-y-3">
// // //               <p className="text-sm text-gray-600">
// // //                 <strong>Violation {fullscreenViolations}/3:</strong> You have exited fullscreen mode. 
// // //                 Please return to fullscreen immediately to continue your test.
// // //               </p>
              
// // //               <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
// // //                 <p className="text-sm text-yellow-800">
// // //                   <strong>Warning:</strong> If you don't return to fullscreen within {fullscreenCountdown} seconds, 
// // //                   your test will be automatically ended.
// // //                 </p>
// // //               </div>
// // //             </div>
// // //           </div>
// // //           <DialogFooter>
// // //             <Button 
// // //               onClick={handleEnterFullscreen}
// // //               className="gap-2 bg-green-600 hover:bg-green-700"
// // //               size="lg"
// // //             >
// // //               <Fullscreen className="w-4 h-4" />
// // //               Enter Fullscreen Mode
// // //             </Button>
// // //           </DialogFooter>
// // //         </DialogContent>
// // //       </Dialog>
// // //     </TestLayout>
// // //   );
// // // };

// // // export default MCQTest;


// // import { useEffect, useState, useRef } from "react";
// // import { useParams, useNavigate } from "react-router-dom";
// // import { toast } from "@/components/ui/use-toast";
// // import { Button } from "@/components/ui/button";
// // import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// // import { Label } from "@/components/ui/label";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Badge } from "@/components/ui/badge";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // import { Input } from "@/components/ui/input";
// // import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// // import { Clock, Play, Send, Code, Fullscreen, AlertTriangle } from "lucide-react";
// // import TestLayout from "@/components/TestLayout";
// // import { API_BASE_URL } from "@/config/api";

// // const MCQTest = () => {
// //   const { testId } = useParams();
// //   const navigate = useNavigate();
// //   const [testData, setTestData] = useState<any>(null);
// //   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
// //   const [answers, setAnswers] = useState<Record<number, string>>({});
// //   const [codeAnswers, setCodeAnswers] = useState<Record<number, { code: string; language: string }>>({});
// //   const [selectedLanguages, setSelectedLanguages] = useState<Record<number, string>>({});
// //   const [dryRunResults, setDryRunResults] = useState<Record<number, any>>({});
// //   const [isRunning, setIsRunning] = useState(false);
// //   const [submissionResults, setSubmissionResults] = useState<Record<number, any>>({});
// //   const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
// //   const [timeLeft, setTimeLeft] = useState(1800); // default 30 mins
// //   const [isPaused, setIsPaused] = useState(false);
// //   const [isTestEnded, setIsTestEnded] = useState(false);
// //   const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
// //   const [supervisorPasscode, setSupervisorPasscode] = useState("");
// //   const [isValidatingPasscode, setIsValidatingPasscode] = useState(false);
// //   const [totalTestDuration, setTotalTestDuration] = useState(1800);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
  
// //   // New states for fullscreen warning
// //   const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
// //   const [fullscreenCountdown, setFullscreenCountdown] = useState(30);

// //   // Use refs to persist data across re-renders
// //   const fullscreenViolationsRef = useRef(0);
// //   const isInFullscreenRef = useRef(true);
// //   const eventListenersRef = useRef<(() => void)[]>([]);

// //   // Fetch test data
// //   useEffect(() => {
// //     const fetchTest = async () => {
// //       try {
// //         setLoading(true);
// //         setError(null);
// //         const res = await fetch(`http://localhost:5000/api/test/${testId}`);
// //         if (!res.ok) {
// //           throw new Error('Failed to fetch test data');
// //         }
// //         const json = await res.json();
// //         console.log('Fetched test data:', json);
// //         setTestData(json);
// //         const totalSeconds = json.Sections?.reduce((acc: number, sec: any) => acc + (sec.duration || 0) * 60, 0) || 1800;
// //         setTimeLeft(totalSeconds);
// //         setTotalTestDuration(totalSeconds);
// //       } catch (error) {
// //         console.error('Error fetching test:', error);
// //         setError('Failed to load test. Please try again.');
// //         toast({
// //           title: "Error",
// //           description: "Failed to load test. Please try again.",
// //           variant: "destructive",
// //         });
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchTest();
// //   }, [testId, navigate]);

// //   // Timer logic
// //   useEffect(() => {
// //     if (!isPaused && timeLeft > 0 && !isTestEnded) {
// //       const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
// //       return () => clearInterval(timer);
// //     } else if (timeLeft === 0 && !isTestEnded) {
// //       handleTimeUp();
// //     }
// //   }, [timeLeft, isPaused, isTestEnded]);

// //   // Fullscreen countdown timer
// //   useEffect(() => {
// //     let countdownTimer: NodeJS.Timeout;
    
// //     if (showFullscreenWarning && fullscreenCountdown > 0 && !isTestEnded) {
// //       countdownTimer = setInterval(() => {
// //         setFullscreenCountdown((prev) => {
// //           if (prev <= 1) {
// //             clearInterval(countdownTimer);
// //             handleFullscreenTimeout();
// //             return 0;
// //           }
// //           return prev - 1;
// //         });
// //       }, 1000);
// //     }
    
// //     return () => {
// //       if (countdownTimer) clearInterval(countdownTimer);
// //     };
// //   }, [showFullscreenWarning, fullscreenCountdown, isTestEnded]);

// //   // Handle fullscreen timeout
// //   const handleFullscreenTimeout = () => {
// //     endTest("You did not return to fullscreen mode in time. Test ended.");
// //   };

// //   // Handle fullscreen change
// //   const handleFullscreenChange = () => {
// //     const isFullscreen = !!document.fullscreenElement;
// //     isInFullscreenRef.current = isFullscreen;
    
// //     if (!isFullscreen && !isTestEnded) {
// //       const currentViolations = fullscreenViolationsRef.current + 1;
// //       fullscreenViolationsRef.current = currentViolations;
      
// //       console.log(`Fullscreen violation detected. Current: ${currentViolations}/3`);
      
// //       if (currentViolations >= 3) {
// //         endTest("Maximum fullscreen violations reached. Test ended.");
// //         return;
// //       }
      
// //       setShowFullscreenWarning(true);
// //       setFullscreenCountdown(30);
      
// //       toast({
// //         title: "Fullscreen Exit Detected",
// //         description: `Please return to fullscreen mode. You have 30 seconds. Violation ${currentViolations}/3`,
// //         variant: "destructive",
// //       });
// //     } else if (isFullscreen) {
// //       setShowFullscreenWarning(false);
// //       setFullscreenCountdown(30);
// //     }
// //   };

// //   // Handle visibility change (Alt+Tab, switching tabs)
// //   const handleVisibilityChange = () => {
// //     if (document.hidden && !isTestEnded) {
// //       const currentViolations = fullscreenViolationsRef.current + 1;
// //       fullscreenViolationsRef.current = currentViolations;
      
// //       console.log(`Tab switch violation detected. Current: ${currentViolations}/3`);
      
// //       if (currentViolations >= 3) {
// //         endTest("Maximum tab switch violations reached. Test ended.");
// //         return;
// //       }
      
// //       setShowFullscreenWarning(true);
// //       setFullscreenCountdown(30);
      
// //       toast({
// //         title: "Tab Switch Detected",
// //         description: `Please return to the test tab. You have 30 seconds. Violation ${currentViolations}/3`,
// //         variant: "destructive",
// //       });
// //     }
// //   };

// //   // Prevent keyboard shortcuts (Alt+Tab, Ctrl+Tab, etc.)
// //   const handleKeyDown = (e: KeyboardEvent) => {
// //     if (isTestEnded) return;

// //     // Block Alt+Tab, Ctrl+Tab, F11, etc.
// //     if (
// //       (e.altKey && e.key === 'Tab') ||
// //       (e.ctrlKey && e.key === 'Tab') ||
// //       e.key === 'F11' ||
// //       (e.altKey && e.key === 'F4') ||
// //       (e.key >= 'F1' && e.key <= 'F12') ||
// //       (e.ctrlKey && e.shiftKey && e.key === 'I') || // Ctrl+Shift+I
// //       (e.ctrlKey && e.shiftKey && e.key === 'J') || // Ctrl+Shift+J
// //       (e.ctrlKey && e.shiftKey && e.key === 'C') || // Ctrl+Shift+C
// //       (e.ctrlKey && e.key === 'u') // Ctrl+U
// //     ) {
// //       e.preventDefault();
// //       e.stopPropagation();
      
// //       const currentViolations = fullscreenViolationsRef.current + 1;
// //       fullscreenViolationsRef.current = currentViolations;
      
// //       console.log(`Keyboard shortcut violation detected. Current: ${currentViolations}/3`);
      
// //       if (currentViolations >= 3) {
// //         endTest("Maximum keyboard shortcut violations reached. Test ended.");
// //         return;
// //       }
      
// //       toast({
// //         title: "Restricted Action",
// //         description: `This action is not allowed during the test. Violation ${currentViolations}/3`,
// //         variant: "destructive",
// //       });
      
// //       return false;
// //     }
// //   };

// //   // Prevent right-click context menu
// //   const handleContextMenu = (e: MouseEvent) => {
// //     if (!isTestEnded) {
// //       e.preventDefault();
      
// //       const currentViolations = fullscreenViolationsRef.current + 1;
// //       fullscreenViolationsRef.current = currentViolations;
      
// //       console.log(`Right-click violation detected. Current: ${currentViolations}/3`);
      
// //       if (currentViolations >= 3) {
// //         endTest("Maximum right-click violations reached. Test ended.");
// //         return;
// //       }
      
// //       toast({
// //         title: "Restricted Action",
// //         description: `Right-click is disabled during the test. Violation ${currentViolations}/3`,
// //         variant: "destructive",
// //       });
      
// //       return false;
// //     }
// //   };

// //   // Fullscreen + event listeners on mount
// //   useEffect(() => {
// //     if (isTestEnded) return;

// //     const enterFullscreen = async () => {
// //       try {
// //         const elem = document.documentElement;
// //         if (elem.requestFullscreen) {
// //           await elem.requestFullscreen();
// //           isInFullscreenRef.current = true;
// //           setShowFullscreenWarning(false);
// //           fullscreenViolationsRef.current = 0;
// //         }
// //       } catch (err) {
// //         console.error("Fullscreen error:", err);
// //       }
// //     };

// //     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
// //       if (!isTestEnded) {
// //         e.preventDefault();
// //         e.returnValue = "Are you sure you want to leave? Your test will be submitted.";
// //       }
// //     };

// //     // Enter fullscreen
// //     enterFullscreen();

// //     // Add event listeners
// //     const fullscreenChangeHandler = () => handleFullscreenChange();
// //     const visibilityChangeHandler = () => handleVisibilityChange();
// //     const keyDownHandler = (e: KeyboardEvent) => handleKeyDown(e);
// //     const contextMenuHandler = (e: MouseEvent) => handleContextMenu(e);
// //     const beforeUnloadHandler = (e: BeforeUnloadEvent) => handleBeforeUnload(e);

// //     document.addEventListener("fullscreenchange", fullscreenChangeHandler);
// //     document.addEventListener("visibilitychange", visibilityChangeHandler);
// //     document.addEventListener("keydown", keyDownHandler, true); // Use capture phase
// //     document.addEventListener("contextmenu", contextMenuHandler, true); // Use capture phase
// //     window.addEventListener("beforeunload", beforeUnloadHandler);

// //     // Store cleanup functions
// //     eventListenersRef.current = [
// //       () => document.removeEventListener("fullscreenchange", fullscreenChangeHandler),
// //       () => document.removeEventListener("visibilitychange", visibilityChangeHandler),
// //       () => document.removeEventListener("keydown", keyDownHandler, true),
// //       () => document.removeEventListener("contextmenu", contextMenuHandler, true),
// //       () => window.removeEventListener("beforeunload", beforeUnloadHandler)
// //     ];

// //     return () => {
// //       // Cleanup all event listeners
// //       eventListenersRef.current.forEach(cleanup => cleanup());
// //     };
// //   }, [isTestEnded]); // Only depend on isTestEnded

// //   const handleEnterFullscreen = async () => {
// //     try {
// //       const elem = document.documentElement;
// //       if (elem.requestFullscreen) {
// //         await elem.requestFullscreen();
// //         isInFullscreenRef.current = true;
// //         setShowFullscreenWarning(false);
// //         setFullscreenCountdown(30);
// //       }
// //     } catch (err) {
// //       console.error("Fullscreen error:", err);
// //       toast({
// //         title: "Fullscreen Error",
// //         description: "Could not enter fullscreen mode. Please try again.",
// //         variant: "destructive",
// //       });
// //     }
// //   };

// //   // Define allQuestions before using it in endTest
// //   const allQuestions = (testData?.Sections || []).flatMap((section: any) => {
// //     const mcqQuestions = (section?.MCQs || []).map((q: any, index: number) => ({
// //       ...q,
// //       type: 'MCQ',
// //       sectionName: section?.name || 'Unknown Section',
// //       questionNo: index + 1
// //     }));
    
// //     const codingQuestions = (section?.codingQuestions || []).map((q: any, index: number) => ({
// //       ...q,
// //       type: 'Coding',
// //       sectionName: section?.name || 'Unknown Section',
// //       questionNo: mcqQuestions.length + index + 1
// //     }));
    
// //     return [...mcqQuestions, ...codingQuestions];
// //   });

// //   // const endTest = async (reason: string) => {
// //   //   setIsTestEnded(true);
// //   //   setShowFullscreenWarning(false);
    
// //   //   if (document.fullscreenElement) {
// //   //     document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
// //   //   }

// //   //   // Cleanup event listeners
// //   //   eventListenersRef.current.forEach(cleanup => cleanup());
// //   //   eventListenersRef.current = [];
    
// //   //   // Exit fullscreen
// //   //   if (document.fullscreenElement) {
// //   //     await document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
// //   //   }

// //   //   // Calculate results
// //   //   const results = allQuestions.map(question => {
// //   //     const userAnswer = answers[question.id];
// //   //     const isCorrect = userAnswer === question.correctOptionLetter;
// //   //     return {
// //   //       ...question,
// //   //       userAnswer,
// //   //       isCorrect,
// //   //       explanation: question.explanation
// //   //     };
// //   //   });

// //   //   const correctAnswers = results.filter(r => r.isCorrect).length;
// //   //   const totalScore = correctAnswers;
// //   //   const maxScore = allQuestions.length;
    
// //   //   const percentage = Math.round((correctAnswers / allQuestions.length) * 100);
// //   //   const testResult = {
// //   //     testId,
// //   //     testName: testData.name,
// //   //     totalScore: correctAnswers,
// //   //     maxScore: allQuestions.length,
// //   //     percentage,
// //   //     status: 'completed',
// //   //     completedAt: new Date().toISOString(),
// //   //     startedAt: new Date().toISOString(),
// //   //     hasMCQQuestions: true,
// //   //     hasCodingQuestions: false,
// //   //     mcqResults: {
// //   //       totalQuestions: allQuestions.length,
// //   //       correctAnswers,
// //   //       wrongAnswers: allQuestions.length - correctAnswers,
// //   //       unansweredCount: 0,
// //   //       accuracyRate: percentage,
// //   //       questions: results
// //   //     }
// //   //   };

// //   //   // Save test result to database and localStorage
// //   //   try {
// //   //     const storedUser = localStorage.getItem("user");
// //   //     const user = storedUser ? JSON.parse(storedUser) : null;
// //   //     const userEmail = user?.email || "test@example.com";
// //   //     const studentName = user.name || "test";
// //   //     const department = user.department || "General";
// //   //     const sinNumber = user.userSIN || 'SIN-' + Date.now().toString().slice(-6);
      
// //   //     const testResultData = {
// //   //       testId: testId,
// //   //       testName: testData.name,
// //   //       userEmail: userEmail,
// //   //       studentName: studentName,
// //   //       department: department,
// //   //       sinNumber: sinNumber,
// //   //       totalScore: totalScore,
// //   //       maxScore: maxScore,
// //   //       percentage: Math.round((totalScore / maxScore) * 100),
// //   //       completedAt: new Date().toISOString(),
// //   //       date: new Date().toLocaleDateString(),
// //   //       answers: JSON.stringify(answers),
// //   //       sessionId: `session_${testId}_${Date.now()}`
// //   //     };
      
// //   //     // Enhance test result with detailed MCQ data for PDF reports
// //   //     const enhancedTestResult = {
// //   //       ...testResult,
// //   //       mcqAnswers: results.map((question, index) => ({
// //   //         questionId: question.id,
// //   //         question: question.questionText || `Question ${index + 1}: Sample MCQ question`,
// //   //         selectedAnswer: question.userAnswer,
// //   //         correctAnswer: question.correctOptionLetter,
// //   //         options: {
// //   //           A: question.optionA || 'Option A',
// //   //           B: question.optionB || 'Option B',
// //   //           C: question.optionC || 'Option C',
// //   //           D: question.optionD || 'Option D'
// //   //         },
// //   //         explanation: question.explanation || `The correct answer is ${question.correctOptionLetter}. ${question.isCorrect ? 'Well done!' : 'Review this topic for better understanding.'}`
// //   //       }))
// //   //     };
      
// //   //     // Save to localStorage as backup with multiple key formats
// //   //     localStorage.setItem(`test_result_${testId}`, JSON.stringify(enhancedTestResult));
// //   //     localStorage.setItem(`testResult_${testId}_${userEmail}`, JSON.stringify(enhancedTestResult));
// //   //     localStorage.setItem(`testResult_${testId}`, JSON.stringify(enhancedTestResult));
      
// //   //     console.log('💾 Saved test result to localStorage with keys:', [
// //   //       `test_result_${testId}`,
// //   //       `testResult_${testId}_${userEmail}`,
// //   //       `testResult_${testId}`
// //   //     ]);
      
// //   //     const response = await fetch(`${API_BASE_URL}/api/student/test-results`, {
// //   //       method: 'POST',
// //   //       headers: {
// //   //         'Content-Type': 'application/json',
// //   //       },
// //   //       body: JSON.stringify(testResultData)
// //   //     });
      
// //   //     if (response.ok) {
// //   //       console.log('✅ Test result saved to database successfully');
// //   //     } else {
// //   //       const errorText = await response.text();
// //   //       console.error('❌ Failed to save test result to database:', response.status, errorText);
// //   //     }
// //   //   } catch (error) {
// //   //     console.error('❌ Error saving test result:', error);
// //   //     // Still save to localStorage even if API fails
// //   //     try {
// //   //       localStorage.setItem(`test_result_${testId}`, JSON.stringify(testResult));
// //   //       console.log('💾 Fallback: Saved test result to localStorage');
// //   //     } catch (localError) {
// //   //       console.error('❌ Failed to save to localStorage:', localError);
// //   //     }
// //   //   }

// //   //   toast({
// //   //     title: "Test Completed",
// //   //     description: `You scored ${correctAnswers}/${allQuestions.length}`,
// //   //   });

// //   //   // Navigate to results page with a small delay to ensure data is saved
// //   //   setTimeout(() => {
// //   //     navigate(`/student/test/${testId}/result`);
// //   //   }, 1000);
// //   // };

// //   const endTest = async (reason: string) => {
// //     setIsTestEnded(true);
// //     if (document.fullscreenElement) {
// //       document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
// //     }

// //     // Calculate results
// //     const results = allQuestions.map(question => {
// //       const userAnswer = answers[question.id];
// //       const isCorrect = userAnswer === question.correctOptionLetter;
// //       return {
// //         ...question,
// //         userAnswer,
// //         isCorrect,
// //         explanation: question.explanation
// //       };
// //     });

// //     const correctAnswers = results.filter(r => r.isCorrect).length;
// //     const totalScore = correctAnswers;
// //     const maxScore = allQuestions.length;

// //     const percentage = Math.round((correctAnswers / allQuestions.length) * 100);
// //     const testResult = {
// //       testId,
// //       testName: testData.name,
// //       totalScore: correctAnswers,
// //       maxScore: allQuestions.length,
// //       percentage,
// //       status: 'completed',
// //       completedAt: new Date().toISOString(),
// //       startedAt: new Date().toISOString(),
// //       hasMCQQuestions: true,
// //       hasCodingQuestions: false,
// //       mcqResults: {
// //         totalQuestions: allQuestions.length,
// //         correctAnswers,
// //         wrongAnswers: allQuestions.length - correctAnswers,
// //         unansweredCount: 0,
// //         accuracyRate: percentage,
// //         questions: results
// //       }
// //     };

// //     // Save test result to database and localStorage
// //     try {
// //       const userEmail = localStorage.getItem('userEmail') || 'test@example.com';
// //       const studentName = localStorage.getItem('userName') || 'Test Student';
// //       const department = localStorage.getItem('userDepartment') || 'General';
// //       const sinNumber = localStorage.getItem('userSIN') || 'SIN-' + Date.now().toString().slice(-6);

// //       const testResultData = {
// //         testId: testId,
// //         testName: testData.name,
// //         userEmail: userEmail,
// //         studentName: studentName,
// //         department: department,
// //         sinNumber: sinNumber,
// //         totalScore: totalScore,
// //         maxScore: maxScore,
// //         percentage: Math.round((totalScore / maxScore) * 100),
// //         completedAt: new Date().toISOString(),
// //         date: new Date().toLocaleDateString(),
// //         answers: JSON.stringify(answers),
// //         sessionId: `session_${testId}_${Date.now()}`
// //       };

// //       // Enhance test result with detailed MCQ data for PDF reports
// //       const enhancedTestResult = {
// //         ...testResult,
// //         mcqAnswers: results.map((question, index) => ({
// //           questionId: question.id,
// //           question: question.questionText || `Question ${index + 1}: Sample MCQ question`,
// //           selectedAnswer: question.userAnswer,
// //           correctAnswer: question.correctOptionLetter,
// //           options: {
// //             A: question.optionA || 'Option A',
// //             B: question.optionB || 'Option B',
// //             C: question.optionC || 'Option C',
// //             D: question.optionD || 'Option D'
// //           },
// //           explanation: question.explanation || `The correct answer is ${question.correctOptionLetter}. ${question.isCorrect ? 'Well done!' : 'Review this topic for better understanding.'}`
// //         }))
// //       };

// //       // Save to localStorage as backup with multiple key formats
// //       localStorage.setItem(`test_result_${testId}`, JSON.stringify(enhancedTestResult));
// //       localStorage.setItem(`testResult_${testId}_${userEmail}`, JSON.stringify(enhancedTestResult));
// //       localStorage.setItem(`testResult_${testId}`, JSON.stringify(enhancedTestResult));

// //       console.log('💾 Saved test result to localStorage with keys:', [
// //         `test_result_${testId}`,
// //         `testResult_${testId}_${userEmail}`,
// //         `testResult_${testId}`
// //       ]);

// //       const response = await fetch(`${API_BASE_URL}/api/student/test-results`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify(testResultData)
// //       });

// //       if (response.ok) {
// //         console.log('✅ Test result saved to database successfully');
// //       } else {
// //         const errorText = await response.text();
// //         console.error('❌ Failed to save test result to database:', response.status, errorText);
// //       }
// //     } catch (error) {
// //       console.error('❌ Error saving test result:', error);
// //       // Still save to localStorage even if API fails
// //       try {
// //         localStorage.setItem(`test_result_${testId}`, JSON.stringify(testResult));
// //         console.log('💾 Fallback: Saved test result to localStorage');
// //       } catch (localError) {
// //         console.error('❌ Failed to save to localStorage:', localError);
// //       }
// //     }

// //     toast({
// //       title: "Test Completed",
// //       description: `You scored ${correctAnswers}/${allQuestions.length}`,
// //     });

// //     // Navigate to results page with a small delay to ensure data is saved
// //     setTimeout(() => {
// //       navigate(`/student/test/${testId}/result`);
// //     }, 1000);
// //   };

// //   const handleTimeUp = () => {
// //     toast({
// //       title: "Time's Up!",
// //       description: "Test time has ended. Please enter supervisor passcode to submit.",
// //       variant: "destructive",
// //     });
// //     setShowPasscodeDialog(true);
// //   };

// //   const handleManualSubmit = () => {
// //     const timeElapsed = (totalTestDuration - timeLeft) / totalTestDuration; // Calculate percentage of time elapsed
// //     if (timeElapsed >= 0.9) { // 90% of time completed
// //       setShowPasscodeDialog(true);
// //     } else {
// //       toast({
// //         title: "Cannot Submit Yet",
// //         description: `You can only submit after 90% of the test duration is completed. Currently ${Math.round(timeElapsed * 100)}% completed.`,
// //         variant: "destructive",
// //       });
// //     }
// //   };

// //   const validateSupervisorPasscode = async () => {
// //     if (!supervisorPasscode.trim()) {
// //       toast({
// //         title: "Error",
// //         description: "Please enter the supervisor passcode.",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     setIsValidatingPasscode(true);
// //     try {
// //       const response = await fetch('http://localhost:5000/api/passcode/validate', {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({ 
// //           code: supervisorPasscode,
// //           type: 'supervisor'
// //         }),
// //       });

// //       const data = await response.json();
// //       if (data.valid) {
// //         setShowPasscodeDialog(false);
// //         setSupervisorPasscode("");
// //         endTest("Test submitted successfully with supervisor approval.");
// //       } else {
// //         toast({
// //           title: "Invalid Passcode",
// //           description: data.message || "The supervisor passcode is incorrect.",
// //           variant: "destructive",
// //         });
// //       }
// //     } catch (error) {
// //       console.error('Passcode validation error:', error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to validate passcode. Please try again.",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsValidatingPasscode(false);
// //     }
// //   };

// //   const handlePasscodeDialogClose = () => {
// //     if (timeLeft > 0) {
// //       setShowPasscodeDialog(false);
// //       setSupervisorPasscode("");
// //     }
// //   };

// //   // Add this function to get current violation count for display
// //   const getCurrentViolations = () => {
// //     return fullscreenViolationsRef.current;
// //   };

// //   const formatTime = (s: number) =>
// //     `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// //   const handleAnswer = (value: string) => {
// //     setAnswers({ ...answers, [currentQuestion.id]: value });
// //   };

// //   const handleCodeAnswer = (code: string) => {
// //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
// //     setCodeAnswers({ ...codeAnswers, [currentQuestion.id]: { code, language } });
// //   };

// //   const handleLanguageChange = (questionId: number, language: string) => {
// //     setSelectedLanguages({ ...selectedLanguages, [questionId]: language });
// //     const currentCode = codeAnswers[questionId]?.code || '';
// //     setCodeAnswers({ ...codeAnswers, [questionId]: { code: currentCode, language } });
// //   };

// //   const handleDryRun = async () => {
// //     if (currentQuestion.type !== 'Coding') return;
    
// //     const code = codeAnswers[currentQuestion.id]?.code;
// //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    
// //     if (!code || !code.trim()) {
// //       toast({
// //         title: "Error",
// //         description: "Please write some code before running",
// //         variant: "destructive",
// //       });
// //       return;
// //     }
    
// //     setIsRunning(true);
    
// //     try {
// //       const response = await fetch(`${API_BASE_URL}/api/coding/dry-run`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           questionId: currentQuestion.id,
// //           code,
// //           language
// //         })
// //       });
      
// //       const result = await response.json();
      
// //       if (result.success) {
// //         setDryRunResults({ ...dryRunResults, [currentQuestion.id]: result });
// //         toast({
// //           title: "Dry Run Complete",
// //           description: `Passed ${result.summary.passed}/${result.summary.total} test cases`,
// //         });
// //       } else {
// //         toast({
// //           title: "Dry Run Failed",
// //           description: result.error || "Failed to execute code",
// //           variant: "destructive",
// //         });
// //       }
// //     } catch (error) {
// //       console.error('Dry run error:', error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to run code. Please try again.",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsRunning(false);
// //     }
// //   };

// //   const handleSubmitCode = async () => {
// //     if (currentQuestion.type !== 'Coding') return;
    
// //     const code = codeAnswers[currentQuestion.id]?.code;
// //     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    
// //     if (!code || !code.trim()) {
// //       toast({
// //         title: "Error",
// //         description: "Please write some code before submitting",
// //         variant: "destructive",
// //       });
// //       return;
// //     }
    
// //     setIsRunning(true);
    
// //     try {
// //       const response = await fetch(`${API_BASE_URL}/api/coding/submit`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           questionId: currentQuestion.id,
// //           code,
// //           language,
// //           studentId: 'student123', // Replace with actual student ID
// //           testId
// //         })
// //       });
      
// //       const result = await response.json();
      
// //       if (result.success) {
// //         setSubmissionResults({ ...submissionResults, [currentQuestion.id]: result });
// //         toast({
// //           title: "Code Submitted",
// //           description: `Score: ${result.score}/${result.maxScore} (${result.testResults.percentage}%)`,
// //         });
// //         handleNext();
// //       } else {
// //         toast({
// //           title: "Submission Failed",
// //           description: result.error || "Failed to submit code",
// //           variant: "destructive",
// //         });
// //       }
// //     } catch (error) {
// //       console.error('Code submission error:', error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to submit code. Please try again.",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsRunning(false);
// //     }
// //   };

// //   const handleMark = () => {
// //     const newSet = new Set(markedForReview);
// //     if (newSet.has(currentQuestion.id)) {
// //       newSet.delete(currentQuestion.id);
// //     } else {
// //       newSet.add(currentQuestion.id);
// //     }
// //     setMarkedForReview(newSet);
// //     handleNext();
// //   };

// //   const handleNext = () => {
// //     if (currentQuestionIndex < allQuestions.length - 1) {
// //       setCurrentQuestionIndex((i) => i + 1);
// //     }
// //   };

// //   const handlePrev = () => {
// //     if (currentQuestionIndex > 0) {
// //       setCurrentQuestionIndex((i) => i - 1);
// //     }
// //   };

// //   const handleClear = () => {
// //     if (currentQuestion.type === 'MCQ') {
// //       const newAnswers = { ...answers };
// //       delete newAnswers[currentQuestion.id];
// //       setAnswers(newAnswers);
// //     } else {
// //       const newCodeAnswers = { ...codeAnswers };
// //       delete newCodeAnswers[currentQuestion.id];
// //       setCodeAnswers(newCodeAnswers);
// //     }
// //   };

// //   const getStatusColor = (qid: number, questionType: string) => {
// //     const hasAnswer = questionType === 'MCQ' ? answers[qid] : codeAnswers[qid]?.code;
// //     const isSubmitted = questionType === 'Coding' && submissionResults[qid];
    
// //     if (isSubmitted) return "bg-blue-500 text-white";
// //     if (hasAnswer) return "bg-green-500 text-white";
// //     if (markedForReview.has(qid)) return "bg-purple-500 text-white";
// //     if (qid === currentQuestion.id) return "bg-orange-500 text-white";
// //     return "bg-gray-200 text-gray-700";
// //   };

// //   if (loading) {
// //     return (
// //       <TestLayout>
// //         <div className="flex items-center justify-center min-h-screen">
// //           <div className="text-center">
// //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
// //             <p className="text-gray-600">Loading test...</p>
// //           </div>
// //         </div>
// //       </TestLayout>
// //     );
// //   }

// //   if (error || !testData) {
// //     return (
// //       <TestLayout>
// //         <div className="flex items-center justify-center min-h-screen">
// //           <div className="text-center">
// //             <div className="text-red-500 text-xl mb-4">⚠️</div>
// //             <h2 className="text-xl font-bold mb-2">Test Loading Error</h2>
// //             <p className="text-gray-600 mb-4">{error || 'Failed to load test data'}</p>
// //             <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// //           </div>
// //         </div>
// //       </TestLayout>
// //     );
// //   }

// //   console.log('Test Data:', testData);
// //   console.log('All Questions:', allQuestions);

// //   if (!testData || allQuestions.length === 0) {
// //     return (
// //       <TestLayout>
// //         <div className="p-6 text-center">
// //           <h2 className="text-xl font-bold mb-4">No Questions Available</h2>
// //           <p className="text-gray-600 mb-4">
// //             {!testData ? 'Test data could not be loaded.' : 'This test does not contain any questions.'}
// //           </p>
// //           <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// //         </div>
// //       </TestLayout>
// //     );
// //   }

// //   const currentQuestion = allQuestions[currentQuestionIndex];
  
// //   // Safety check for current question
// //   if (!currentQuestion) {
// //     return (
// //       <TestLayout>
// //         <div className="p-6 text-center">
// //           <h2 className="text-xl font-bold mb-4">Question Not Found</h2>
// //           <p className="text-gray-600 mb-4">Unable to load the current question.</p>
// //           <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
// //         </div>
// //       </TestLayout>
// //     );
// //   }

// //   return (
// //     <TestLayout>
// //       <div className="flex h-screen">
// //         {/* Main Area */}
// //         <div className="flex-1 flex flex-col">
// //           <div className="bg-white border-b p-4 flex justify-between items-center">
// //             <h1 className="text-lg font-semibold">{testData.name}</h1>
// //             <div className="flex items-center gap-4 text-orange-600">
// //               <Clock className="w-4 h-4" />
// //               <span>Time Left: {formatTime(timeLeft)}</span>
// //               <div className="flex items-center gap-2 text-sm">
// //                 <span>Violations: {getCurrentViolations()}/3</span>
// //               </div>
// //               <Button 
// //                 variant="destructive" 
// //                 size="sm" 
// //                 onClick={handleManualSubmit}
// //                 disabled={isTestEnded || (totalTestDuration - timeLeft) / totalTestDuration < 0.9}
// //               >
// //                 Submit Test
// //               </Button>
// //             </div>
// //           </div>

// //           <div className="p-4">
// //             <Card>
// //               <CardHeader>
// //                 <CardTitle>
// //                   Q{currentQuestion.questionNo}: {currentQuestion.questionText}
// //                 </CardTitle>
// //                 {currentQuestion.questionImage && (
// //                   <div className="mt-2">
// //                     <img 
// //                       src={currentQuestion.questionImage} 
// //                       alt="Question" 
// //                       className="max-w-full h-auto rounded border"
// //                       onError={(e) => {
// //                         console.error('Question image failed to load:', currentQuestion.questionImage);
// //                         e.currentTarget.style.display = 'none';
// //                       }}
// //                     />
// //                   </div>
// //                 )}
// //               </CardHeader>
// //               <CardContent>
// //                 {currentQuestion.type === 'MCQ' ? (
// //                   <RadioGroup
// //                     value={answers[currentQuestion.id] || ""}
// //                     onValueChange={handleAnswer}
// //                     disabled={isTestEnded}
// //                   >
// //                     {["A", "B", "C", "D"].map((opt) => (
// //                       <div key={opt} className="flex items-start space-x-3 p-3 border rounded mb-2">
// //                         <RadioGroupItem value={opt} id={`opt-${opt}`} className="mt-1" />
// //                         <Label htmlFor={`opt-${opt}`} className="flex-1 cursor-pointer">
// //                           <div className="flex items-start gap-2">
// //                             <span className="font-medium">{opt})</span>
// //                             <div className="flex-1">
// //                               <div>{currentQuestion[`option${opt}`]}</div>
// //                               {currentQuestion[`option${opt}Image`] && (
// //                                 <img 
// //                                   src={currentQuestion[`option${opt}Image`]} 
// //                                   alt={`Option ${opt}`} 
// //                                   className="mt-2 max-w-xs h-auto rounded border"
// //                                   onError={(e) => {
// //                                     console.error(`Option ${opt} image failed to load:`, currentQuestion[`option${opt}Image`]);
// //                                     e.currentTarget.style.display = 'none';
// //                                   }}
// //                                 />
// //                               )}
// //                             </div>
// //                           </div>
// //                         </Label>
// //                       </div>
// //                     ))}
// //                   </RadioGroup>
// //                 ) : (
// //                   <div className="space-y-4">
// //                     <div className="bg-gray-50 p-4 rounded-lg">
// //                       <h4 className="font-medium mb-2">Problem Statement:</h4>
// //                       <div className="whitespace-pre-wrap">{currentQuestion.problemStatement}</div>
                      
// //                       {currentQuestion.constraints && (
// //                         <div className="mt-4">
// //                           <h5 className="font-medium mb-1">Constraints:</h5>
// //                           <div className="text-sm text-gray-600 whitespace-pre-wrap">{currentQuestion.constraints}</div>
// //                         </div>
// //                       )}
                      
// //                       {currentQuestion.sampleTestCases && currentQuestion.sampleTestCases.length > 0 && (
// //                         <div className="mt-4">
// //                           <h5 className="font-medium mb-2">Sample Test Cases:</h5>
// //                           <div className="space-y-2">
// //                             {currentQuestion.sampleTestCases.map((testCase: any, index: number) => (
// //                               <div key={index} className="bg-white p-3 rounded border">
// //                                 <div className="grid grid-cols-2 gap-4 text-sm">
// //                                   <div>
// //                                     <strong>Input:</strong>
// //                                     <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.input}</pre>
// //                                   </div>
// //                                   <div>
// //                                     <strong>Output:</strong>
// //                                     <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.output}</pre>
// //                                   </div>
// //                                 </div>
// //                               </div>
// //                             ))}
// //                           </div>
// //                         </div>
// //                       )}
// //                     </div>

// //                     <div className="flex items-center gap-4">
// //                       <div className="flex-1">
// //                         <Label>Programming Language:</Label>
// //                         <Select
// //                           value={selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]}
// //                           onValueChange={(value) => handleLanguageChange(currentQuestion.id, value)}
// //                           disabled={isTestEnded}
// //                         >
// //                           <SelectTrigger className="mt-1">
// //                             <SelectValue />
// //                           </SelectTrigger>
// //                           <SelectContent>
// //                             {currentQuestion.allowedLanguages.map((lang: string) => (
// //                               <SelectItem key={lang} value={lang}>{lang}</SelectItem>
// //                             ))}
// //                           </SelectContent>
// //                         </Select>
// //                       </div>
                      
// //                       <div className="flex gap-2">
// //                         <Button
// //                           variant="outline"
// //                           size="sm"
// //                           onClick={handleDryRun}
// //                           disabled={isTestEnded || isRunning}
// //                           className="gap-2"
// //                         >
// //                           <Play className="w-4 h-4" />
// //                           {isRunning ? 'Running...' : 'Dry Run'}
// //                         </Button>
                        
// //                         <Button
// //                           size="sm"
// //                           onClick={handleSubmitCode}
// //                           disabled={isTestEnded || isRunning}
// //                           className="gap-2 bg-blue-600 hover:bg-blue-700"
// //                         >
// //                           <Send className="w-4 h-4" />
// //                           Submit Code
// //                         </Button>
// //                       </div>
// //                     </div>

// //                     <div>
// //                       <Label>Your Solution:</Label>
// //                       <Textarea
// //                         placeholder={`Write your ${selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]} code here...`}
// //                         value={codeAnswers[currentQuestion.id]?.code || ''}
// //                         onChange={(e) => handleCodeAnswer(e.target.value)}
// //                         className="mt-2 font-mono text-sm"
// //                         rows={15}
// //                         disabled={isTestEnded}
// //                       />
// //                     </div>
                    
// //                     {/* Dry Run Results */}
// //                     {dryRunResults[currentQuestion.id] && (
// //                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
// //                         <h5 className="font-medium mb-2 text-blue-800">Dry Run Results:</h5>
// //                         <div className="text-sm">
// //                           <p className="mb-2">Passed: {dryRunResults[currentQuestion.id].summary.passed}/{dryRunResults[currentQuestion.id].summary.total} test cases</p>
// //                           <div className="space-y-2">
// //                             {dryRunResults[currentQuestion.id].results.map((result: any, index: number) => (
// //                               <div key={index} className={`p-2 rounded ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
// //                                 <div className="font-medium">{result.passed ? '✅' : '❌'} Test Case {index + 1}</div>
// //                                 {!result.passed && (
// //                                   <div className="text-xs mt-1">
// //                                     <div>Expected: {result.expectedOutput}</div>
// //                                     <div>Got: {result.actualOutput}</div>
// //                                     {result.error && <div className="text-red-600">Error: {result.error}</div>}
// //                                   </div>
// //                                 )}
// //                               </div>
// //                             ))}
// //                           </div>
// //                         </div>
// //                       </div>
// //                     )}
                    
// //                     {/* Submission Results */}
// //                     {submissionResults[currentQuestion.id] && (
// //                       <div className="bg-green-50 p-4 rounded-lg border border-green-200">
// //                         <h5 className="font-medium mb-2 text-green-800">Submission Results:</h5>
// //                         <div className="text-sm">
// //                           <p>Status: <span className={`font-medium ${submissionResults[currentQuestion.id].status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
// //                             {submissionResults[currentQuestion.id].status.toUpperCase()}
// //                           </span></p>
// //                           <p>Score: {submissionResults[currentQuestion.id].score}/{submissionResults[currentQuestion.id].maxScore}</p>
// //                           <p>Test Cases: {submissionResults[currentQuestion.id].testResults.passed}/{submissionResults[currentQuestion.id].testResults.total} passed</p>
// //                         </div>
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}

// //                 <div className="flex justify-between mt-6 pt-4 border-t">
// //                   <div className="space-x-2">
// //                     <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0 || isTestEnded}>
// //                       Previous
// //                     </Button>
// //                     <Button variant="outline" onClick={handleMark} disabled={isTestEnded}>
// //                       {markedForReview.has(currentQuestion.id) ? "Unmark" : "Mark for Review"} & Next
// //                     </Button>
// //                   </div>
// //                   <div className="space-x-2">
// //                     <Button variant="outline" onClick={handleClear} disabled={isTestEnded}>
// //                       Clear
// //                     </Button>
// //                     <Button 
// //                       onClick={handleNext} 
// //                       disabled={currentQuestionIndex === allQuestions.length - 1 || isTestEnded}
// //                     >
// //                       Save & Next
// //                     </Button>
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         </div>

// //         {/* Sidebar */}
// //         <div className="w-80 border-l p-4 bg-white">
// //           <h3 className="text-md font-semibold mb-2">Question Palette</h3>
// //           <div className="grid grid-cols-4 gap-2">
// //             {allQuestions.map((q: any, idx: number) => (
// //               <button
// //                 key={q.id}
// //                 className={`w-8 h-8 rounded ${getStatusColor(q.id, q.type)}`}
// //                 onClick={() => setCurrentQuestionIndex(idx)}
// //                 disabled={isTestEnded}
// //               >
// //                 {q.questionNo}
// //               </button>
// //             ))}
// //           </div>

// //           <div className="mt-6 space-y-2">
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
// //               <span>Answered</span>
// //             </div>
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
// //               <span>Submitted</span>
// //             </div>
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-purple-500 mr-2"></div>
// //               <span>Marked</span>
// //             </div>
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-orange-500 mr-2"></div>
// //               <span>Current</span>
// //             </div>
// //             <div className="flex items-center">
// //               <div className="w-4 h-4 rounded bg-gray-200 mr-2"></div>
// //               <span>Unanswered</span>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Supervisor Passcode Dialog */}
// //       <Dialog open={showPasscodeDialog} onOpenChange={handlePasscodeDialogClose}>
// //         <DialogContent className="sm:max-w-md">
// //           <DialogHeader>
// //             <DialogTitle>Supervisor Passcode Required</DialogTitle>
// //           </DialogHeader>
// //           <div className="space-y-4">
// //             <p className="text-sm text-gray-600">
// //               {timeLeft === 0 
// //                 ? "Test time has ended. Please enter the supervisor passcode to submit your test."
// //                 : "To submit the test, please enter the supervisor passcode."}
// //             </p>
// //             <div>
// //               <Label htmlFor="passcode">Supervisor Passcode</Label>
// //               <Input
// //                 id="passcode"
// //                 type="password"
// //                 placeholder="Enter 6-digit passcode"
// //                 value={supervisorPasscode}
// //                 onChange={(e) => setSupervisorPasscode(e.target.value)}
// //                 maxLength={6}
// //                 className="mt-1"
// //                 onKeyPress={(e) => {
// //                   if (e.key === 'Enter') {
// //                     validateSupervisorPasscode();
// //                   }
// //                 }}
// //               />
// //             </div>
// //           </div>
// //           <DialogFooter>
// //             {timeLeft > 0 && (
// //               <Button variant="outline" onClick={handlePasscodeDialogClose}>
// //                 Cancel
// //               </Button>
// //             )}
// //             <Button 
// //               onClick={validateSupervisorPasscode}
// //               disabled={isValidatingPasscode || !supervisorPasscode.trim()}
// //             >
// //               {isValidatingPasscode ? 'Validating...' : 'Submit Test'}
// //             </Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>

// //       {/* Fullscreen Warning Dialog */}
// //       <Dialog open={showFullscreenWarning} onOpenChange={() => {}}>
// //         <DialogContent className="sm:max-w-md">
// //           <DialogHeader>
// //             <DialogTitle className="flex items-center gap-2 text-red-600">
// //               <AlertTriangle className="w-5 h-5" />
// //               Fullscreen Exit Detected
// //             </DialogTitle>
// //           </DialogHeader>
// //           <div className="space-y-4">
// //             <div className="bg-red-50 p-4 rounded-lg border border-red-200">
// //               <div className="text-center">
// //                 <div className="text-3xl font-bold text-red-600 mb-2">
// //                   {fullscreenCountdown}
// //                 </div>
// //                 <p className="text-sm text-red-700 font-medium">
// //                   seconds to return to fullscreen
// //                 </p>
// //               </div>
// //             </div>
            
// //             <div className="space-y-3">
// //               <p className="text-sm text-gray-600">
// //                 <strong>Violation {getCurrentViolations()}/3:</strong> You have exited fullscreen mode. 
// //                 Please return to fullscreen immediately to continue your test.
// //               </p>
              
// //               <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
// //                 <p className="text-sm text-yellow-800">
// //                   <strong>Warning:</strong> If you don't return to fullscreen within {fullscreenCountdown} seconds, 
// //                   your test will be automatically ended.
// //                 </p>
// //               </div>
// //             </div>
// //           </div>
// //           <DialogFooter>
// //             <Button 
// //               onClick={handleEnterFullscreen}
// //               className="gap-2 bg-green-600 hover:bg-green-700"
// //               size="lg"
// //             >
// //               <Fullscreen className="w-4 h-4" />
// //               Enter Fullscreen Mode
// //             </Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>
// //     </TestLayout>
// //   );
// // };

// // export default MCQTest;


// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { toast } from "@/components/ui/use-toast";
// import { Button } from "@/components/ui/button";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Clock, Play, Send, Code, Fullscreen, AlertTriangle } from "lucide-react";
// import TestLayout from "@/components/TestLayout";
// import { API_BASE_URL } from "@/config/api";

// const MCQTest = () => {
//   const { testId } = useParams();
//   const navigate = useNavigate();
//   const [testData, setTestData] = useState<any>(null);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [answers, setAnswers] = useState<Record<number, string>>({});
//   const [codeAnswers, setCodeAnswers] = useState<Record<number, { code: string; language: string }>>({});
//   const [selectedLanguages, setSelectedLanguages] = useState<Record<number, string>>({});
//   const [dryRunResults, setDryRunResults] = useState<Record<number, any>>({});
//   const [isRunning, setIsRunning] = useState(false);
//   const [submissionResults, setSubmissionResults] = useState<Record<number, any>>({});
//   const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
//   const [timeLeft, setTimeLeft] = useState(1800); // default 30 mins
//   const [isPaused, setIsPaused] = useState(false);
//   const [isTestEnded, setIsTestEnded] = useState(false);
//   const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
//   const [supervisorPasscode, setSupervisorPasscode] = useState("");
//   const [isValidatingPasscode, setIsValidatingPasscode] = useState(false);
//   const [totalTestDuration, setTotalTestDuration] = useState(1800);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // New states for fullscreen warning
//   const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
//   const [fullscreenCountdown, setFullscreenCountdown] = useState(30);

//   // Use refs to persist data across re-renders
//   const fullscreenViolationsRef = useRef(0);
//   const isInFullscreenRef = useRef(true);
//   const eventListenersRef = useRef<(() => void)[]>([]);

//   // Fetch test data
//   useEffect(() => {
//     const fetchTest = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const res = await fetch(`http://localhost:5000/api/test/${testId}`);
//         if (!res.ok) {
//           throw new Error('Failed to fetch test data');
//         }
//         const json = await res.json();
//         console.log('Fetched test data:', json);
//         setTestData(json);
//         const totalSeconds = json.Sections?.reduce((acc: number, sec: any) => acc + (sec.duration || 0) * 60, 0) || 1800;
//         setTimeLeft(totalSeconds);
//         setTotalTestDuration(totalSeconds);
//       } catch (error) {
//         console.error('Error fetching test:', error);
//         setError('Failed to load test. Please try again.');
//         toast({
//           title: "Error",
//           description: "Failed to load test. Please try again.",
//           variant: "destructive",
//         });
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTest();
//   }, [testId, navigate]);

//   // Timer logic
//   useEffect(() => {
//     if (!isPaused && timeLeft > 0 && !isTestEnded) {
//       const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
//       return () => clearInterval(timer);
//     } else if (timeLeft === 0 && !isTestEnded) {
//       handleTimeUp();
//     }
//   }, [timeLeft, isPaused, isTestEnded]);

//   // Fullscreen countdown timer
//   useEffect(() => {
//     let countdownTimer: NodeJS.Timeout;
    
//     if (showFullscreenWarning && fullscreenCountdown > 0 && !isTestEnded) {
//       countdownTimer = setInterval(() => {
//         setFullscreenCountdown((prev) => {
//           if (prev <= 1) {
//             clearInterval(countdownTimer);
//             handleFullscreenTimeout();
//             return 0;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     }
    
//     return () => {
//       if (countdownTimer) clearInterval(countdownTimer);
//     };
//   }, [showFullscreenWarning, fullscreenCountdown, isTestEnded]);

//   // Define allQuestions before using it
//   const allQuestions = (testData?.Sections || []).flatMap((section: any) => {
//     const mcqQuestions = (section?.MCQs || []).map((q: any, index: number) => ({
//       ...q,
//       type: 'MCQ',
//       sectionName: section?.name || 'Unknown Section',
//       questionNo: index + 1
//     }));
    
//     const codingQuestions = (section?.codingQuestions || []).map((q: any, index: number) => ({
//       ...q,
//       type: 'Coding',
//       sectionName: section?.name || 'Unknown Section',
//       questionNo: mcqQuestions.length + index + 1
//     }));
    
//     return [...mcqQuestions, ...codingQuestions];
//   });

//   // Handle fullscreen timeout
//   const handleFullscreenTimeout = async () => {
//     await endTest("You did not return to fullscreen mode in time. Test ended.");
//   };

//   // const endTest = async (reason: string) => {
//   //   setIsTestEnded(true);
//   //   // setShowFullscreenWarning(false);
//   //   if (document.fullscreenElement) {
//   //     document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
//   //   }
    
//   //   // Cleanup event listeners FIRST
//   //   eventListenersRef.current.forEach(cleanup => cleanup());
//   //   eventListenersRef.current = [];
    
//   //   // Exit fullscreen
//   //   if (document.fullscreenElement) {
//   //     await document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
//   //   }

//   //   // Check if test data is loaded
//   //   if (!testData || allQuestions.length === 0) {
//   //     console.error('Test data not loaded, redirecting to assessment page');
//   //     toast({
//   //       title: "Test Ended",
//   //       description: reason,
//   //       variant: "destructive",
//   //     });
//   //     await new Promise(resolve => setTimeout(resolve, 500));
//   //     navigate('/student/assessment', { replace: true });
//   //     return;
//   //   }

//   //   // Calculate results
//   //   const results = allQuestions.map(question => {
//   //     const userAnswer = answers[question.id];
//   //     const isCorrect = userAnswer === question.correctOptionLetter;
//   //     return {
//   //       ...question,
//   //       userAnswer,
//   //       isCorrect,
//   //       explanation: question.explanation
//   //     };
//   //   });

//   //   const correctAnswers = results.filter(r => r.isCorrect).length;
//   //   const totalScore = correctAnswers;
//   //   const maxScore = allQuestions.length;
    
//   //   const percentage = Math.round((correctAnswers / allQuestions.length) * 100);
//   //   const testResult = {
//   //     testId,
//   //     testName: testData.name,
//   //     totalScore: correctAnswers,
//   //     maxScore: allQuestions.length,
//   //     percentage,
//   //     status: 'completed',
//   //     completedAt: new Date().toISOString(),
//   //     startedAt: new Date().toISOString(),
//   //     hasMCQQuestions: true,
//   //     hasCodingQuestions: false,
//   //     mcqResults: {
//   //       totalQuestions: allQuestions.length,
//   //       correctAnswers,
//   //       wrongAnswers: allQuestions.length - correctAnswers,
//   //       unansweredCount: 0,
//   //       accuracyRate: percentage,
//   //       questions: results
//   //     }
//   //   };

//   //   // Save test result to database and localStorage
//   //   try {
//   //     const storedUser = localStorage.getItem("user");
//   //     const user = storedUser ? JSON.parse(storedUser) : null;
//   //     const userEmail = user?.email || "test@example.com";
//   //     const studentName = user?.name || "test";
//   //     const department = user?.department || "General";
//   //     const sinNumber = user?.userSIN || 'SIN-' + Date.now().toString().slice(-6);
      
//   //     const testResultData = {
//   //       testId: testId,
//   //       testName: testData.name,
//   //       userEmail: userEmail,
//   //       studentName: studentName,
//   //       department: department,
//   //       sinNumber: sinNumber,
//   //       totalScore: totalScore,
//   //       maxScore: maxScore,
//   //       percentage: Math.round((totalScore / maxScore) * 100),
//   //       completedAt: new Date().toISOString(),
//   //       date: new Date().toLocaleDateString(),
//   //       answers: JSON.stringify(answers),
//   //       sessionId: `session_${testId}_${Date.now()}`
//   //     };
      
//   //     // Enhance test result with detailed MCQ data for PDF reports
//   //     const enhancedTestResult = {
//   //       ...testResult,
//   //       mcqAnswers: results.map((question, index) => ({
//   //         questionId: question.id,
//   //         question: question.questionText || `Question ${index + 1}: Sample MCQ question`,
//   //         selectedAnswer: question.userAnswer,
//   //         correctAnswer: question.correctOptionLetter,
//   //         options: {
//   //           A: question.optionA || 'Option A',
//   //           B: question.optionB || 'Option B',
//   //           C: question.optionC || 'Option C',
//   //           D: question.optionD || 'Option D'
//   //         },
//   //         explanation: question.explanation || `The correct answer is ${question.correctOptionLetter}. ${question.isCorrect ? 'Well done!' : 'Review this topic for better understanding.'}`
//   //       }))
//   //     };
      
//   //     // Save to localStorage as backup with multiple key formats
//   //     localStorage.setItem(`test_result_${testId}`, JSON.stringify(enhancedTestResult));
//   //     localStorage.setItem(`testResult_${testId}_${userEmail}`, JSON.stringify(enhancedTestResult));
//   //     localStorage.setItem(`testResult_${testId}`, JSON.stringify(enhancedTestResult));
      
//   //     console.log('💾 Saved test result to localStorage with keys:', [
//   //       `test_result_${testId}`,
//   //       `testResult_${testId}_${userEmail}`,
//   //       `testResult_${testId}`
//   //     ]);
      
//   //     const response = await fetch(`${API_BASE_URL}/api/student/test-results`, {
//   //       method: 'POST',
//   //       headers: {
//   //         'Content-Type': 'application/json',
//   //       },
//   //       body: JSON.stringify(testResultData)
//   //     });
      
//   //     if (response.ok) {
//   //       console.log('✅ Test result saved to database successfully');
//   //     } else {
//   //       const errorText = await response.text();
//   //       console.error('❌ Failed to save test result to database:', response.status, errorText);
//   //     }
//   //   } catch (error) {
//   //     console.error('❌ Error saving test result:', error);
//   //     // Still save to localStorage even if API fails
//   //     try {
//   //       localStorage.setItem(`test_result_${testId}`, JSON.stringify(testResult));
//   //       console.log('💾 Fallback: Saved test result to localStorage');
//   //     } catch (localError) {
//   //       console.error('❌ Failed to save to localStorage:', localError);
//   //     }
//   //   }

//   //   toast({
//   //     title: "Test Completed",
//   //     description: reason || `You scored ${correctAnswers}/${allQuestions.length}`,
//   //   });

//   //   // Wait a bit to ensure everything is cleaned up before navigation
//   //   await new Promise(resolve => setTimeout(resolve, 500));
    
//   //   // Navigate to results page
//   //   navigate(`/student/test/${testId}/result`, { replace: true });
//   // };

//   // Handle fullscreen change
  
//   const endTest = async (reason: string) => {
//     setIsTestEnded(true);
//     if (document.fullscreenElement) {
//       document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
//     }

//     // Calculate results
//     const results = allQuestions.map(question => {
//       const userAnswer = answers[question.id];
//       const isCorrect = userAnswer === question.correctOptionLetter;
//       return {
//         ...question,
//         userAnswer,
//         isCorrect,
//         explanation: question.explanation
//       };
//     });

//     const correctAnswers = results.filter(r => r.isCorrect).length;
//     const totalScore = correctAnswers;
//     const maxScore = allQuestions.length;

//     const percentage = Math.round((correctAnswers / allQuestions.length) * 100);
//     const testResult = {
//       testId,
//       testName: testData.name,
//       totalScore: correctAnswers,
//       maxScore: allQuestions.length,
//       percentage,
//       status: 'completed',
//       completedAt: new Date().toISOString(),
//       startedAt: new Date().toISOString(),
//       hasMCQQuestions: true,
//       hasCodingQuestions: false,
//       mcqResults: {
//         totalQuestions: allQuestions.length,
//         correctAnswers,
//         wrongAnswers: allQuestions.length - correctAnswers,
//         unansweredCount: 0,
//         accuracyRate: percentage,
//         questions: results
//       }
//     };

//     // Save test result to database and localStorage
//     try {
//       // const userEmail = localStorage.getItem('userEmail') || 'test@example.com';
//       // const studentName = localStorage.getItem('userName') || 'Test Student';
//       // const department = localStorage.getItem('userDepartment') || 'General';
//       // const sinNumber = localStorage.getItem('userSIN') || 'SIN-' + Date.now().toString().slice(-6);
//       const storedUser = localStorage.getItem("user");
//       const user = storedUser ? JSON.parse(storedUser) : null;
//       const userEmail = user?.email || "test@example.com";
//       const studentName = user?.name || "Test Student";
//       const department = user?.dept || "General";
//       const sinNumber =
//         user?.userSIN ||
//         "SIN-" + Date.now().toString().slice(-6);

//       const testResultData = {
//         testId: testId,
//         testName: testData.name,
//         userEmail: userEmail,
//         studentName: studentName,
//         department: department,
//         sinNumber: sinNumber,
//         totalScore: totalScore,
//         maxScore: maxScore,
//         percentage: Math.round((totalScore / maxScore) * 100),
//         completedAt: new Date().toISOString(),
//         date: new Date().toLocaleDateString(),
//         answers: JSON.stringify(answers),
//         sessionId: `session_${testId}_${Date.now()}`
//       };

//       // Enhance test result with detailed MCQ data for PDF reports
//       const enhancedTestResult = {
//         ...testResult,
//         mcqAnswers: results.map((question, index) => ({
//           questionId: question.id,
//           question: question.questionText || `Question ${index + 1}: Sample MCQ question`,
//           selectedAnswer: question.userAnswer,
//           correctAnswer: question.correctOptionLetter,
//           options: {
//             A: question.optionA || 'Option A',
//             B: question.optionB || 'Option B',
//             C: question.optionC || 'Option C',
//             D: question.optionD || 'Option D'
//           },
//           explanation: question.explanation || `The correct answer is ${question.correctOptionLetter}. ${question.isCorrect ? 'Well done!' : 'Review this topic for better understanding.'}`
//         }))
//       };

//       // Save to localStorage as backup with multiple key formats
//       localStorage.setItem(`test_result_${testId}`, JSON.stringify(enhancedTestResult));
//       localStorage.setItem(`testResult_${testId}_${userEmail}`, JSON.stringify(enhancedTestResult));
//       localStorage.setItem(`testResult_${testId}`, JSON.stringify(enhancedTestResult));

//       console.log('💾 Saved test result to localStorage with keys:', [
//         `test_result_${testId}`,
//         `testResult_${testId}_${userEmail}`,
//         `testResult_${testId}`
//       ]);

//       const response = await fetch(`${API_BASE_URL}/api/student/test-results`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(testResultData)
//       });

//       if (response.ok) {
//         console.log('✅ Test result saved to database successfully');
//       } else {
//         const errorText = await response.text();
//         console.error('❌ Failed to save test result to database:', response.status, errorText);
//       }
//     } catch (error) {
//       console.error('❌ Error saving test result:', error);
//       // Still save to localStorage even if API fails
//       try {
//         localStorage.setItem(`test_result_${testId}`, JSON.stringify(testResult));
//         console.log('💾 Fallback: Saved test result to localStorage');
//       } catch (localError) {
//         console.error('❌ Failed to save to localStorage:', localError);
//       }
//     }

//     toast({
//       title: "Test Completed",
//       description: `You scored ${correctAnswers}/${allQuestions.length}`,
//     });

//     // Navigate to results page with a small delay to ensure data is saved
//     setTimeout(() => {
//       navigate(`/student/test/${testId}/result`);
//     }, 1000);
//   };
  
//   const handleFullscreenChange = async () => {
//     const isFullscreen = !!document.fullscreenElement;
//     isInFullscreenRef.current = isFullscreen;
    
//     // Don't track violations if test data hasn't loaded yet
//     if (!testData || loading) {
//       return;
//     }
    
//     if (!isFullscreen && !isTestEnded) {
//       const currentViolations = fullscreenViolationsRef.current + 1;
//       fullscreenViolationsRef.current = currentViolations;
      
//       console.log(`Fullscreen violation detected. Current: ${currentViolations}/3`);
      
//       if (currentViolations >= 3) {
//         endTest("Maximum fullscreen violations reached. Test ended.");
//         return;
//       }
      
//       setShowFullscreenWarning(true);
//       setFullscreenCountdown(30);
      
//       toast({
//         title: "Fullscreen Exit Detected",
//         description: `Please return to fullscreen mode. You have 30 seconds. Violation ${currentViolations}/3`,
//         variant: "destructive",
//       });
//     } else if (isFullscreen) {
//       setShowFullscreenWarning(false);
//       setFullscreenCountdown(30);
//     }
//   };

//   // // Handle visibility change (Alt+Tab, switching tabs)
//   // const handleVisibilityChange = async () => {
//   //   // Don't track violations if test data hasn't loaded yet
//   //   if (!testData || loading) {
//   //     return;
//   //   }
    
//   //   if (document.hidden && !isTestEnded) {
//   //     const currentViolations = fullscreenViolationsRef.current + 1;
//   //     fullscreenViolationsRef.current = currentViolations;
      
//   //     console.log(`Tab switch violation detected. Current: ${currentViolations}/3`);
      
//   //     if (currentViolations >= 3) {
//   //       await endTest("Maximum tab switch violations reached. Test ended.");
//   //       return;
//   //     }
      
//   //     setShowFullscreenWarning(true);
//   //     setFullscreenCountdown(30);
      
//   //     toast({
//   //       title: "Tab Switch Detected",
//   //       description: `Please return to the test tab. You have 30 seconds. Violation ${currentViolations}/3`,
//   //       variant: "destructive",
//   //     });
//   //   }
//   // };

//   // // Prevent keyboard shortcuts (Alt+Tab, Ctrl+Tab, etc.)
//   // const handleKeyDown = async (e: KeyboardEvent) => {
//   //   if (isTestEnded) return;

//   //   // Don't track violations if test data hasn't loaded yet
//   //   if (!testData || loading) {
//   //     return;
//   //   }

//   //   // Block Alt+Tab, Ctrl+Tab, F11, etc.
//   //   if (
//   //     (e.altKey && e.key === 'Tab') ||
//   //     (e.ctrlKey && e.key === 'Tab') ||
//   //     e.key === 'F11' ||
//   //     (e.altKey && e.key === 'F4') ||
//   //     (e.key >= 'F1' && e.key <= 'F12') ||
//   //     (e.ctrlKey && e.shiftKey && e.key === 'I') || // Ctrl+Shift+I
//   //     (e.ctrlKey && e.shiftKey && e.key === 'J') || // Ctrl+Shift+J
//   //     (e.ctrlKey && e.shiftKey && e.key === 'C') || // Ctrl+Shift+C
//   //     (e.ctrlKey && e.key === 'u') // Ctrl+U
//   //   ) {
//   //     e.preventDefault();
//   //     e.stopPropagation();
      
//   //     const currentViolations = fullscreenViolationsRef.current + 1;
//   //     fullscreenViolationsRef.current = currentViolations;
      
//   //     console.log(`Keyboard shortcut violation detected. Current: ${currentViolations}/3`);
      
//   //     if (currentViolations >= 3) {
//   //       await endTest("Maximum keyboard shortcut violations reached. Test ended.");
//   //       return;
//   //     }
      
//   //     toast({
//   //       title: "Restricted Action",
//   //       description: `This action is not allowed during the test. Violation ${currentViolations}/3`,
//   //       variant: "destructive",
//   //     });
      
//   //     return false;
//   //   }
//   // };

//   // Add these enhanced security handlers to your MCQTest component

// // 1. Enhanced keyboard event handler with better Alt+Tab detection
// const handleKeyDown = async (e: KeyboardEvent) => {
//   if (isTestEnded) return;

//   // Don't track violations if test data hasn't loaded yet
//   if (!testData || loading) {
//     return;
//   }

//   // Comprehensive list of blocked keys and combinations
//   const blockedActions = [
//     // Alt combinations
//     e.altKey && e.key === 'Tab',
//     e.altKey && e.key === 'F4',
//     e.altKey,  // Block all Alt key usage
    
//     // Ctrl combinations
//     e.ctrlKey && e.key === 'Tab',
//     e.ctrlKey && e.shiftKey && e.key === 'I', // DevTools
//     e.ctrlKey && e.shiftKey && e.key === 'J', // DevTools
//     e.ctrlKey && e.shiftKey && e.key === 'C', // DevTools
//     e.ctrlKey && e.key === 'u', // View Source
//     e.ctrlKey && e.key === 'U', // View Source
//     e.ctrlKey && e.key === 's', // Save
//     e.ctrlKey && e.key === 'S', // Save
//     e.ctrlKey && e.key === 'p', // Print
//     e.ctrlKey && e.key === 'P', // Print
//     e.ctrlKey && e.key === 'c', // Copy
//     e.ctrlKey && e.key === 'C', // Copy
//     e.ctrlKey && e.key === 'x', // Cut
//     e.ctrlKey && e.key === 'X', // Cut
//     e.ctrlKey && e.key === 'v', // Paste (in non-code areas)
//     e.ctrlKey && e.key === 'V', // Paste
//     e.ctrlKey && e.key === 'a', // Select All (in non-code areas)
//     e.ctrlKey && e.key === 'A', // Select All
    
//     // Function keys
//     e.key === 'F11', // Fullscreen toggle
//     e.key === 'F12', // DevTools
//     e.key === 'F1',
//     e.key === 'F2',
//     e.key === 'F3',
//     e.key === 'F4',
//     e.key === 'F5', // Refresh
//     e.key === 'F6',
//     e.key === 'F7',
//     e.key === 'F8',
//     e.key === 'F9',
//     e.key === 'F10',
    
//     // Windows key
//     e.metaKey, // Windows/Command key
    
//     // Other combinations
//     e.key === 'Escape' && document.fullscreenElement, // Escape from fullscreen
//   ];

//   if (blockedActions.some(condition => condition)) {
//     e.preventDefault();
//     e.stopPropagation();
//     e.stopImmediatePropagation();
    
//     const currentViolations = fullscreenViolationsRef.current + 1;
//     fullscreenViolationsRef.current = currentViolations;
    
//     console.log(`Restricted key action detected. Current: ${currentViolations}/3`);
    
//     if (currentViolations >= 3) {
//       await endTest("Maximum security violations reached. Test ended.");
//       return;
//     }
    
//     toast({
//       title: "Restricted Action",
//       description: `This action is not allowed during the test. Violation ${currentViolations}/3`,
//       variant: "destructive",
//     });
    
//     return false;
//   }
// };

// // 2. Enhanced copy/paste/cut prevention
// const handleCopy = async (e: ClipboardEvent) => {
//   // Allow copy only in code editor textarea
//   const target = e.target as HTMLElement;
//   const isCodeEditor = target.classList.contains('code-editor') || 
//                        target.closest('.code-editor-container');
  
//   if (!isCodeEditor && !isTestEnded) {
//     e.preventDefault();
//     e.stopPropagation();
    
//     if (!testData || loading) {
//       return false;
//     }
    
//     const currentViolations = fullscreenViolationsRef.current + 1;
//     fullscreenViolationsRef.current = currentViolations;
    
//     console.log(`Copy attempt detected. Current: ${currentViolations}/3`);
    
//     if (currentViolations >= 3) {
//       await endTest("Maximum copy violations reached. Test ended.");
//       return;
//     }
    
//     toast({
//       title: "Copy Disabled",
//       description: `Copying is not allowed during the test. Violation ${currentViolations}/3`,
//       variant: "destructive",
//     });
    
//     return false;
//   }
// };

// const handleCut = async (e: ClipboardEvent) => {
//   const target = e.target as HTMLElement;
//   const isCodeEditor = target.classList.contains('code-editor') || 
//                        target.closest('.code-editor-container');
  
//   if (!isCodeEditor && !isTestEnded) {
//     e.preventDefault();
//     e.stopPropagation();
    
//     if (!testData || loading) {
//       return false;
//     }
    
//     const currentViolations = fullscreenViolationsRef.current + 1;
//     fullscreenViolationsRef.current = currentViolations;
    
//     if (currentViolations >= 3) {
//       await endTest("Maximum security violations reached. Test ended.");
//       return;
//     }
    
//     toast({
//       title: "Cut Disabled",
//       description: `Cutting is not allowed during the test. Violation ${currentViolations}/3`,
//       variant: "destructive",
//     });
    
//     return false;
//   }
// };

// const handlePaste = async (e: ClipboardEvent) => {
//   const target = e.target as HTMLElement;
//   const isCodeEditor = target.classList.contains('code-editor') || 
//                        target.closest('.code-editor-container');
  
//   if (!isCodeEditor && !isTestEnded) {
//     e.preventDefault();
//     e.stopPropagation();
    
//     if (!testData || loading) {
//       return false;
//     }
    
//     toast({
//       title: "Paste Disabled",
//       description: "Pasting is only allowed in code editor",
//       variant: "destructive",
//     });
    
//     return false;
//   }
// };

// // 3. Text selection prevention for non-code areas
// const handleSelectStart = (e: Event) => {
//   const target = e.target as HTMLElement;
//   const isCodeEditor = target.classList.contains('code-editor') || 
//                        target.closest('.code-editor-container');
  
//   if (!isCodeEditor && !isTestEnded) {
//     e.preventDefault();
//     return false;
//   }
// };

// // 4. Drag prevention
// const handleDragStart = (e: DragEvent) => {
//   if (!isTestEnded) {
//     e.preventDefault();
//     return false;
//   }
// };

// // 5. Enhanced visibility change handler for better Alt+Tab detection
// const handleVisibilityChange = async () => {
//   if (!testData || loading) {
//     return;
//   }
  
//   if (document.hidden && !isTestEnded) {
//     const currentViolations = fullscreenViolationsRef.current + 1;
//     fullscreenViolationsRef.current = currentViolations;
    
//     console.log(`Tab switch/Alt+Tab detected. Current: ${currentViolations}/3`);
    
//     if (currentViolations >= 3) {
//       await endTest("Maximum tab switch violations reached. Test ended.");
//       return;
//     }
    
//     setShowFullscreenWarning(true);
//     setFullscreenCountdown(30);
    
//     toast({
//       title: "Tab Switch Detected",
//       description: `Please return to the test tab immediately. Violation ${currentViolations}/3`,
//       variant: "destructive",
//     });
//   }
// };

// // 6. Blur event handler for additional Alt+Tab detection
// const handleWindowBlur = async () => {
//   if (!testData || loading || isTestEnded) {
//     return;
//   }
  
//   const currentViolations = fullscreenViolationsRef.current + 1;
//   fullscreenViolationsRef.current = currentViolations;
  
//   console.log(`Window blur detected (Alt+Tab or window switch). Current: ${currentViolations}/3`);
  
//   if (currentViolations >= 3) {
//     await endTest("Maximum window switch violations reached. Test ended.");
//     return;
//   }
  
//   setShowFullscreenWarning(true);
//   setFullscreenCountdown(30);
  
//   toast({
//     title: "Window Switch Detected",
//     description: `Please return to the test window. Violation ${currentViolations}/3`,
//     variant: "destructive",
//   });
// };

// // 7. Extension detection and blocking
// const detectExtensions = () => {
//   // Check for common extension indicators
//   const extensionIndicators = [
//     'chrome-extension://',
//     'moz-extension://',
//     '__extension__',
//     'webextension'
//   ];
  
//   // Check for modified DOM elements that extensions often add
//   const suspiciousElements = document.querySelectorAll('[data-extension], [class*="extension"], [id*="extension"]');
  
//   if (suspiciousElements.length > 0) {
//     console.warn('Potential browser extensions detected');
//     toast({
//       title: "Extensions Detected",
//       description: "Please disable all browser extensions before taking the test.",
//       variant: "destructive",
//     });
//     return true;
//   }
  
//   return false;
// };

// // 8. Updated useEffect for event listeners with all security features
// useEffect(() => {
//   if (isTestEnded || loading || !testData) return;

//   const enterFullscreen = async () => {
//     try {
//       const elem = document.documentElement;
//       if (elem.requestFullscreen) {
//         await elem.requestFullscreen();
//         isInFullscreenRef.current = true;
//         setShowFullscreenWarning(false);
//         fullscreenViolationsRef.current = 0;
//       }
//     } catch (err) {
//       console.error("Fullscreen error:", err);
//     }
//   };

//   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//     if (!isTestEnded) {
//       e.preventDefault();
//       e.returnValue = "Are you sure you want to leave? Your test will be submitted.";
//     }
//   };

//   // Detect extensions on mount
//   detectExtensions();

//   // Enter fullscreen
//   enterFullscreen();

//   // Add all event listeners
//   const fullscreenChangeHandler = () => handleFullscreenChange();
//   const visibilityChangeHandler = () => handleVisibilityChange();
//   const keyDownHandler = (e: KeyboardEvent) => handleKeyDown(e);
//   const contextMenuHandler = (e: MouseEvent) => handleContextMenu(e);
//   const beforeUnloadHandler = (e: BeforeUnloadEvent) => handleBeforeUnload(e);
//   const copyHandler = (e: ClipboardEvent) => handleCopy(e);
//   const cutHandler = (e: ClipboardEvent) => handleCut(e);
//   const pasteHandler = (e: ClipboardEvent) => handlePaste(e);
//   const selectStartHandler = (e: Event) => handleSelectStart(e);
//   const dragStartHandler = (e: DragEvent) => handleDragStart(e);
//   const blurHandler = () => handleWindowBlur();

//   document.addEventListener("fullscreenchange", fullscreenChangeHandler);
//   document.addEventListener("visibilitychange", visibilityChangeHandler);
//   document.addEventListener("keydown", keyDownHandler, true);
//   document.addEventListener("contextmenu", contextMenuHandler, true);
//   window.addEventListener("beforeunload", beforeUnloadHandler);
//   document.addEventListener("copy", copyHandler, true);
//   document.addEventListener("cut", cutHandler, true);
//   document.addEventListener("paste", pasteHandler, true);
//   document.addEventListener("selectstart", selectStartHandler);
//   document.addEventListener("dragstart", dragStartHandler);
//   window.addEventListener("blur", blurHandler);

//   // Store cleanup functions
//   eventListenersRef.current = [
//     () => document.removeEventListener("fullscreenchange", fullscreenChangeHandler),
//     () => document.removeEventListener("visibilitychange", visibilityChangeHandler),
//     () => document.removeEventListener("keydown", keyDownHandler, true),
//     () => document.removeEventListener("contextmenu", contextMenuHandler, true),
//     () => window.removeEventListener("beforeunload", beforeUnloadHandler),
//     () => document.removeEventListener("copy", copyHandler, true),
//     () => document.removeEventListener("cut", cutHandler, true),
//     () => document.removeEventListener("paste", pasteHandler, true),
//     () => document.removeEventListener("selectstart", selectStartHandler),
//     () => document.removeEventListener("dragstart", dragStartHandler),
//     () => window.removeEventListener("blur", blurHandler)
//   ];

//   return () => {
//     eventListenersRef.current.forEach(cleanup => cleanup());
//   };
// }, [isTestEnded, loading, testData]);

// // 9. Update the Textarea for code editor with special class
// // In your JSX, update the code editor Textarea:
// {/* <Textarea
//   placeholder={`Write your ${selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]} code here...`}
//   value={codeAnswers[currentQuestion.id]?.code || ''}
//   onChange={(e) => handleCodeAnswer(e.target.value)}
//   className="mt-2 font-mono text-sm code-editor" // Add code-editor class
//   rows={15}
//   disabled={isTestEnded}
// /> */}

// // 10. Add CSS to prevent text selection (add to your global CSS or styled component)
// const testContainerStyle = `
//   .test-content {
//     user-select: none;
//     -webkit-user-select: none;
//     -moz-user-select: none;
//     -ms-user-select: none;
//   }
  
//   .code-editor, .code-editor-container {
//     user-select: text !important;
//     -webkit-user-select: text !important;
//     -moz-user-select: text !important;
//     -ms-user-select: text !important;
//   }
// `;

//   // Prevent right-click context menu
//   const handleContextMenu = async (e: MouseEvent) => {
//     if (!isTestEnded) {
//       e.preventDefault();
      
//       // Don't track violations if test data hasn't loaded yet
//       if (!testData || loading) {
//         return false;
//       }
      
//       const currentViolations = fullscreenViolationsRef.current + 1;
//       fullscreenViolationsRef.current = currentViolations;
      
//       console.log(`Right-click violation detected. Current: ${currentViolations}/3`);
      
//       if (currentViolations >= 3) {
//         await endTest("Maximum right-click violations reached. Test ended.");
//         return;
//       }
      
//       toast({
//         title: "Restricted Action",
//         description: `Right-click is disabled during the test. Violation ${currentViolations}/3`,
//         variant: "destructive",
//       });
      
//       return false;
//     }
//   };

//   // // Fullscreen + event listeners on mount
//   // useEffect(() => {
//   //   if (isTestEnded || loading || !testData) return;

//   //   const enterFullscreen = async () => {
//   //     try {
//   //       const elem = document.documentElement;
//   //       if (elem.requestFullscreen) {
//   //         await elem.requestFullscreen();
//   //         isInFullscreenRef.current = true;
//   //         setShowFullscreenWarning(false);
//   //         fullscreenViolationsRef.current = 0;
//   //       }
//   //     } catch (err) {
//   //       console.error("Fullscreen error:", err);
//   //     }
//   //   };

//   //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//   //     if (!isTestEnded) {
//   //       e.preventDefault();
//   //       e.returnValue = "Are you sure you want to leave? Your test will be submitted.";
//   //     }
//   //   };

//   //   // Enter fullscreen
//   //   enterFullscreen();

//   //   // Add event listeners
//   //   const fullscreenChangeHandler = () => handleFullscreenChange();
//   //   const visibilityChangeHandler = () => handleVisibilityChange();
//   //   const keyDownHandler = (e: KeyboardEvent) => handleKeyDown(e);
//   //   const contextMenuHandler = (e: MouseEvent) => handleContextMenu(e);
//   //   const beforeUnloadHandler = (e: BeforeUnloadEvent) => handleBeforeUnload(e);

//   //   document.addEventListener("fullscreenchange", fullscreenChangeHandler);
//   //   document.addEventListener("visibilitychange", visibilityChangeHandler);
//   //   document.addEventListener("keydown", keyDownHandler, true); // Use capture phase
//   //   document.addEventListener("contextmenu", contextMenuHandler, true); // Use capture phase
//   //   window.addEventListener("beforeunload", beforeUnloadHandler);

//   //   // Store cleanup functions
//   //   eventListenersRef.current = [
//   //     () => document.removeEventListener("fullscreenchange", fullscreenChangeHandler),
//   //     () => document.removeEventListener("visibilitychange", visibilityChangeHandler),
//   //     () => document.removeEventListener("keydown", keyDownHandler, true),
//   //     () => document.removeEventListener("contextmenu", contextMenuHandler, true),
//   //     () => window.removeEventListener("beforeunload", beforeUnloadHandler)
//   //   ];

//   //   return () => {
//   //     // Cleanup all event listeners
//   //     eventListenersRef.current.forEach(cleanup => cleanup());
//   //   };
//   // }, [isTestEnded, loading, testData]); // Depend on loading and testData

//   const handleEnterFullscreen = async () => {
//     try {
//       const elem = document.documentElement;
//       if (elem.requestFullscreen) {
//         await elem.requestFullscreen();
//         isInFullscreenRef.current = true;
//         setShowFullscreenWarning(false);
//         setFullscreenCountdown(30);
//       }
//     } catch (err) {
//       console.error("Fullscreen error:", err);
//       toast({
//         title: "Fullscreen Error",
//         description: "Could not enter fullscreen mode. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleTimeUp = () => {
//     toast({
//       title: "Time's Up!",
//       description: "Test time has ended. Please enter supervisor passcode to submit.",
//       variant: "destructive",
//     });
//     setShowPasscodeDialog(true);
//   };

//   const handleManualSubmit = () => {
//     const timeElapsed = (totalTestDuration - timeLeft) / totalTestDuration; // Calculate percentage of time elapsed
//     if (timeElapsed >= 0.9) { // 90% of time completed
//       setShowPasscodeDialog(true);
//     } else {
//       toast({
//         title: "Cannot Submit Yet",
//         description: `You can only submit after 90% of the test duration is completed. Currently ${Math.round(timeElapsed * 100)}% completed.`,
//         variant: "destructive",
//       });
//     }
//   };

//   const validateSupervisorPasscode = async () => {
//     if (!supervisorPasscode.trim()) {
//       toast({
//         title: "Error",
//         description: "Please enter the supervisor passcode.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsValidatingPasscode(true);
//     try {
//       const response = await fetch('http://localhost:5000/api/passcode/validate', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ 
//           code: supervisorPasscode,
//           type: 'supervisor'
//         }),
//       });

//       const data = await response.json();
//       if (data.valid) {
//         setShowPasscodeDialog(false);
//         setSupervisorPasscode("");
//         endTest("Test submitted successfully with supervisor approval.");
//       } else {
//         toast({
//           title: "Invalid Passcode",
//           description: data.message || "The supervisor passcode is incorrect.",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error('Passcode validation error:', error);
//       toast({
//         title: "Error",
//         description: "Failed to validate passcode. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsValidatingPasscode(false);
//     }
//   };

//   const handlePasscodeDialogClose = () => {
//     if (timeLeft > 0) {
//       setShowPasscodeDialog(false);
//       setSupervisorPasscode("");
//     }
//   };

//   // Add this function to get current violation count for display
//   const getCurrentViolations = () => {
//     return fullscreenViolationsRef.current;
//   };

//   const formatTime = (s: number) =>
//     `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

//   const handleAnswer = (value: string) => {
//     setAnswers({ ...answers, [currentQuestion.id]: value });
//   };

//   const handleCodeAnswer = (code: string) => {
//     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
//     setCodeAnswers({ ...codeAnswers, [currentQuestion.id]: { code, language } });
//   };

//   const handleLanguageChange = (questionId: number, language: string) => {
//     setSelectedLanguages({ ...selectedLanguages, [questionId]: language });
//     const currentCode = codeAnswers[questionId]?.code || '';
//     setCodeAnswers({ ...codeAnswers, [questionId]: { code: currentCode, language } });
//   };

//   const handleDryRun = async () => {
//     if (currentQuestion.type !== 'Coding') return;
    
//     const code = codeAnswers[currentQuestion.id]?.code;
//     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    
//     if (!code || !code.trim()) {
//       toast({
//         title: "Error",
//         description: "Please write some code before running",
//         variant: "destructive",
//       });
//       return;
//     }
    
//     setIsRunning(true);
    
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/coding/dry-run`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           questionId: currentQuestion.id,
//           code,
//           language
//         })
//       });
      
//       const result = await response.json();
      
//       if (result.success) {
//         setDryRunResults({ ...dryRunResults, [currentQuestion.id]: result });
//         toast({
//           title: "Dry Run Complete",
//           description: `Passed ${result.summary.passed}/${result.summary.total} test cases`,
//         });
//       } else {
//         toast({
//           title: "Dry Run Failed",
//           description: result.error || "Failed to execute code",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error('Dry run error:', error);
//       toast({
//         title: "Error",
//         description: "Failed to run code. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsRunning(false);
//     }
//   };

//   const handleSubmitCode = async () => {
//     if (currentQuestion.type !== 'Coding') return;
    
//     const code = codeAnswers[currentQuestion.id]?.code;
//     const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    
//     if (!code || !code.trim()) {
//       toast({
//         title: "Error",
//         description: "Please write some code before submitting",
//         variant: "destructive",
//       });
//       return;
//     }
    
//     setIsRunning(true);
    
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/coding/submit`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           questionId: currentQuestion.id,
//           code,
//           language,
//           studentId: 'student123', // Replace with actual student ID
//           testId
//         })
//       });
      
//       const result = await response.json();
      
//       if (result.success) {
//         setSubmissionResults({ ...submissionResults, [currentQuestion.id]: result });
//         toast({
//           title: "Code Submitted",
//           description: `Score: ${result.score}/${result.maxScore} (${result.testResults.percentage}%)`,
//         });
//         handleNext();
//       } else {
//         toast({
//           title: "Submission Failed",
//           description: result.error || "Failed to submit code",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       console.error('Code submission error:', error);
//       toast({
//         title: "Error",
//         description: "Failed to submit code. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsRunning(false);
//     }
//   };

//   const handleMark = () => {
//     const newSet = new Set(markedForReview);
//     if (newSet.has(currentQuestion.id)) {
//       newSet.delete(currentQuestion.id);
//     } else {
//       newSet.add(currentQuestion.id);
//     }
//     setMarkedForReview(newSet);
//     handleNext();
//   };

//   const handleNext = () => {
//     if (currentQuestionIndex < allQuestions.length - 1) {
//       setCurrentQuestionIndex((i) => i + 1);
//     }
//   };

//   const handlePrev = () => {
//     if (currentQuestionIndex > 0) {
//       setCurrentQuestionIndex((i) => i - 1);
//     }
//   };

//   const handleClear = () => {
//     if (currentQuestion.type === 'MCQ') {
//       const newAnswers = { ...answers };
//       delete newAnswers[currentQuestion.id];
//       setAnswers(newAnswers);
//     } else {
//       const newCodeAnswers = { ...codeAnswers };
//       delete newCodeAnswers[currentQuestion.id];
//       setCodeAnswers(newCodeAnswers);
//     }
//   };

//   const getStatusColor = (qid: number, questionType: string) => {
//     const hasAnswer = questionType === 'MCQ' ? answers[qid] : codeAnswers[qid]?.code;
//     const isSubmitted = questionType === 'Coding' && submissionResults[qid];
    
//     if (isSubmitted) return "bg-blue-500 text-white";
//     if (hasAnswer) return "bg-green-500 text-white";
//     if (markedForReview.has(qid)) return "bg-purple-500 text-white";
//     if (qid === currentQuestion?.id) return "bg-orange-500 text-white";
//     return "bg-gray-200 text-gray-700";
//   };

//   if (loading) {
//     return (
//       <TestLayout>
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//             <p className="text-gray-600">Loading test...</p>
//           </div>
//         </div>
//       </TestLayout>
//     );
//   }

//   if (error || !testData) {
//     return (
//       <TestLayout>
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <div className="text-red-500 text-xl mb-4">⚠️</div>
//             <h2 className="text-xl font-bold mb-2">Test Loading Error</h2>
//             <p className="text-gray-600 mb-4">{error || 'Failed to load test data'}</p>
//             <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
//           </div>
//         </div>
//       </TestLayout>
//     );
//   }

//   if (!testData || allQuestions.length === 0) {
//     return (
//       <TestLayout>
//         <div className="p-6 text-center">
//           <h2 className="text-xl font-bold mb-4">No Questions Available</h2>
//           <p className="text-gray-600 mb-4">
//             {!testData ? 'Test data could not be loaded.' : 'This test does not contain any questions.'}
//           </p>
//           <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
//         </div>
//       </TestLayout>
//     );
//   }

//   const currentQuestion = allQuestions[currentQuestionIndex];
  
//   // Safety check for current question
//   if (!currentQuestion) {
//     return (
//       <TestLayout>
//         <div className="p-6 text-center">
//           <h2 className="text-xl font-bold mb-4">Question Not Found</h2>
//           <p className="text-gray-600 mb-4">Unable to load the current question.</p>
//           <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
//         </div>
//       </TestLayout>
//     );
//   }

//   return (
//     <TestLayout>
//       <div className="flex h-screen">
//         {/* Main Area */}
//         <div className="flex-1 flex flex-col">
//           <div className="bg-white border-b p-4 flex justify-between items-center">
//             <h1 className="text-lg font-semibold">{testData.name}</h1>
//             <div className="flex items-center gap-4 text-orange-600">
//               <Clock className="w-4 h-4" />
//               <span>Time Left: {formatTime(timeLeft)}</span>
//               <div className="flex items-center gap-2 text-sm">
//                 <span>Violations: {getCurrentViolations()}/3</span>
//               </div>
//               <Button 
//                 variant="destructive" 
//                 size="sm" 
//                 onClick={handleManualSubmit}
//                 disabled={isTestEnded || (totalTestDuration - timeLeft) / totalTestDuration < 0.9}
//               >
//                 Submit Test
//               </Button>
//             </div>
//           </div>

//           <div className="p-4 overflow-auto">
//             <Card>
//               <CardHeader>
//                 <CardTitle>
//                   Q{currentQuestion.questionNo}: {currentQuestion.questionText}
//                 </CardTitle>
//                 {currentQuestion.questionImage && (
//                   <div className="mt-2">
//                     <img 
//                       src={currentQuestion.questionImage} 
//                       alt="Question" 
//                       className="max-w-full h-auto rounded border"
//                       onError={(e) => {
//                         console.error('Question image failed to load:', currentQuestion.questionImage);
//                         e.currentTarget.style.display = 'none';
//                       }}
//                     />
//                   </div>
//                 )}
//               </CardHeader>
//               <CardContent>
//                 {currentQuestion.type === 'MCQ' ? (
//                   <RadioGroup
//                     value={answers[currentQuestion.id] || ""}
//                     onValueChange={handleAnswer}
//                     disabled={isTestEnded}
//                   >
//                     {["A", "B", "C", "D"].map((opt) => (
//                       <div key={opt} className="flex items-start space-x-3 p-3 border rounded mb-2">
//                         <RadioGroupItem value={opt} id={`opt-${opt}`} className="mt-1" />
//                         <Label htmlFor={`opt-${opt}`} className="flex-1 cursor-pointer">
//                           <div className="flex items-start gap-2">
//                             <span className="font-medium">{opt})</span>
//                             <div className="flex-1">
//                               <div>{currentQuestion[`option${opt}`]}</div>
//                               {currentQuestion[`option${opt}Image`] && (
//                                 <img 
//                                   src={currentQuestion[`option${opt}Image`]} 
//                                   alt={`Option ${opt}`} 
//                                   className="mt-2 max-w-xs h-auto rounded border"
//                                   onError={(e) => {
//                                     console.error(`Option ${opt} image failed to load:`, currentQuestion[`option${opt}Image`]);
//                                     e.currentTarget.style.display = 'none';
//                                   }}
//                                 />
//                               )}
//                             </div>
//                           </div>
//                         </Label>
//                       </div>
//                     ))}
//                   </RadioGroup>
//                 ) : (
//                   <div className="space-y-4">
//                     <div className="bg-gray-50 p-4 rounded-lg">
//                       <h4 className="font-medium mb-2">Problem Statement:</h4>
//                       <div className="whitespace-pre-wrap">{currentQuestion.problemStatement}</div>
                      
//                       {currentQuestion.constraints && (
//                         <div className="mt-4">
//                           <h5 className="font-medium mb-1">Constraints:</h5>
//                           <div className="text-sm text-gray-600 whitespace-pre-wrap">{currentQuestion.constraints}</div>
//                         </div>
//                       )}
                      
//                       {currentQuestion.sampleTestCases && currentQuestion.sampleTestCases.length > 0 && (
//                         <div className="mt-4">
//                           <h5 className="font-medium mb-2">Sample Test Cases:</h5>
//                           <div className="space-y-2">
//                             {currentQuestion.sampleTestCases.map((testCase: any, index: number) => (
//                               <div key={index} className="bg-white p-3 rounded border">
//                                 <div className="grid grid-cols-2 gap-4 text-sm">
//                                   <div>
//                                     <strong>Input:</strong>
//                                     <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.input}</pre>
//                                   </div>
//                                   <div>
//                                     <strong>Output:</strong>
//                                     <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.output}</pre>
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>

//                     <div className="flex items-center gap-4">
//                       <div className="flex-1">
//                         <Label>Programming Language:</Label>
//                         <Select
//                           value={selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]}
//                           onValueChange={(value) => handleLanguageChange(currentQuestion.id, value)}
//                           disabled={isTestEnded}
//                         >
//                           <SelectTrigger className="mt-1">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {currentQuestion.allowedLanguages.map((lang: string) => (
//                               <SelectItem key={lang} value={lang}>{lang}</SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
                      
//                       <div className="flex gap-2">
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={handleDryRun}
//                           disabled={isTestEnded || isRunning}
//                           className="gap-2"
//                         >
//                           <Play className="w-4 h-4" />
//                           {isRunning ? 'Running...' : 'Dry Run'}
//                         </Button>
                        
//                         <Button
//                           size="sm"
//                           onClick={handleSubmitCode}
//                           disabled={isTestEnded || isRunning}
//                           className="gap-2 bg-blue-600 hover:bg-blue-700"
//                         >
//                           <Send className="w-4 h-4" />
//                           Submit Code
//                         </Button>
//                       </div>
//                     </div>

//                     <div>
//                       <Label>Your Solution:</Label>
//                       <Textarea
//                         placeholder={`Write your ${selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]} code here...`}
//                         value={codeAnswers[currentQuestion.id]?.code || ''}
//                         onChange={(e) => handleCodeAnswer(e.target.value)}
//                         className="mt-2 font-mono text-sm code-editor"
//                         rows={15}
//                         disabled={isTestEnded}
//                       />
//                     </div>
                    
//                     {/* Dry Run Results */}
//                     {dryRunResults[currentQuestion.id] && (
//                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
//                         <h5 className="font-medium mb-2 text-blue-800">Dry Run Results:</h5>
//                         <div className="text-sm">
//                           <p className="mb-2">Passed: {dryRunResults[currentQuestion.id].summary.passed}/{dryRunResults[currentQuestion.id].summary.total} test cases</p>
//                           <div className="space-y-2">
//                             {dryRunResults[currentQuestion.id].results.map((result: any, index: number) => (
//                               <div key={index} className={`p-2 rounded ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
//                                 <div className="font-medium">{result.passed ? '✅' : '❌'} Test Case {index + 1}</div>
//                                 {!result.passed && (
//                                   <div className="text-xs mt-1">
//                                     <div>Expected: {result.expectedOutput}</div>
//                                     <div>Got: {result.actualOutput}</div>
//                                     {result.error && <div className="text-red-600">Error: {result.error}</div>}
//                                   </div>
//                                 )}
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     )}
                    
//                     {/* Submission Results */}
//                     {submissionResults[currentQuestion.id] && (
//                       <div className="bg-green-50 p-4 rounded-lg border border-green-200">
//                         <h5 className="font-medium mb-2 text-green-800">Submission Results:</h5>
//                         <div className="text-sm">
//                           <p>Status: <span className={`font-medium ${submissionResults[currentQuestion.id].status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
//                             {submissionResults[currentQuestion.id].status.toUpperCase()}
//                           </span></p>
//                           <p>Score: {submissionResults[currentQuestion.id].score}/{submissionResults[currentQuestion.id].maxScore}</p>
//                           <p>Test Cases: {submissionResults[currentQuestion.id].testResults.passed}/{submissionResults[currentQuestion.id].testResults.total} passed</p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 <div className="flex justify-between mt-6 pt-4 border-t">
//                   <div className="space-x-2">
//                     <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0 || isTestEnded}>
//                       Previous
//                     </Button>
//                     <Button variant="outline" onClick={handleMark} disabled={isTestEnded}>
//                       {markedForReview.has(currentQuestion.id) ? "Unmark" : "Mark for Review"} & Next
//                     </Button>
//                   </div>
//                   <div className="space-x-2">
//                     <Button variant="outline" onClick={handleClear} disabled={isTestEnded}>
//                       Clear
//                     </Button>
//                     <Button 
//                       onClick={handleNext} 
//                       disabled={currentQuestionIndex === allQuestions.length - 1 || isTestEnded}
//                     >
//                       Save & Next
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         {/* Sidebar */}
//         <div className="w-80 border-l p-4 bg-white overflow-auto">
//           <h3 className="text-md font-semibold mb-2">Question Palette</h3>
//           <div className="grid grid-cols-4 gap-2">
//             {allQuestions.map((q: any, idx: number) => (
//               <button
//                 key={q.id}
//                 className={`w-8 h-8 rounded ${getStatusColor(q.id, q.type)}`}
//                 onClick={() => setCurrentQuestionIndex(idx)}
//                 disabled={isTestEnded}
//               >
//                 {q.questionNo}
//               </button>
//             ))}
//           </div>

//           <div className="mt-6 space-y-2">
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
//               <span className="text-sm">Answered</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
//               <span className="text-sm">Submitted</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded bg-purple-500 mr-2"></div>
//               <span className="text-sm">Marked</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded bg-orange-500 mr-2"></div>
//               <span className="text-sm">Current</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 rounded bg-gray-200 mr-2"></div>
//               <span className="text-sm">Unanswered</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Supervisor Passcode Dialog */}
//       <Dialog open={showPasscodeDialog} onOpenChange={handlePasscodeDialogClose}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Supervisor Passcode Required</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <p className="text-sm text-gray-600">
//               {timeLeft === 0 
//                 ? "Test time has ended. Please enter the supervisor passcode to submit your test."
//                 : "To submit the test, please enter the supervisor passcode."}
//             </p>
//             <div>
//               <Label htmlFor="passcode">Supervisor Passcode</Label>
//               <Input
//                 id="passcode"
//                 type="password"
//                 placeholder="Enter 6-digit passcode"
//                 value={supervisorPasscode}
//                 onChange={(e) => setSupervisorPasscode(e.target.value)}
//                 maxLength={6}
//                 className="mt-1"
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') {
//                     validateSupervisorPasscode();
//                   }
//                 }}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             {timeLeft > 0 && (
//               <Button variant="outline" onClick={handlePasscodeDialogClose}>
//                 Cancel
//               </Button>
//             )}
//             <Button 
//               onClick={validateSupervisorPasscode}
//               disabled={isValidatingPasscode || !supervisorPasscode.trim()}
//             >
//               {isValidatingPasscode ? 'Validating...' : 'Submit Test'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Fullscreen Warning Dialog */}
//       <Dialog open={showFullscreenWarning} onOpenChange={() => {}}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2 text-red-600">
//               <AlertTriangle className="w-5 h-5" />
//               Fullscreen Exit Detected
//             </DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="bg-red-50 p-4 rounded-lg border border-red-200">
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-red-600 mb-2">
//                   {fullscreenCountdown}
//                 </div>
//                 <p className="text-sm text-red-700 font-medium">
//                   seconds to return to fullscreen
//                 </p>
//               </div>
//             </div>
            
//             <div className="space-y-3">
//               <p className="text-sm text-gray-600">
//                 <strong>Violation {getCurrentViolations()}/3:</strong> You have exited fullscreen mode. 
//                 Please return to fullscreen immediately to continue your test.
//               </p>
              
//               <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
//                 <p className="text-sm text-yellow-800">
//                   <strong>Warning:</strong> If you don't return to fullscreen within {fullscreenCountdown} seconds, 
//                   your test will be automatically ended.
//                 </p>
//               </div>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button 
//               onClick={handleEnterFullscreen}
//               className="gap-2 bg-green-600 hover:bg-green-700"
//               size="lg"
//             >
//               <Fullscreen className="w-4 h-4" />
//               Enter Fullscreen Mode
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </TestLayout>
//   );
// };

// export default MCQTest;

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Play, Send, Fullscreen, AlertTriangle } from "lucide-react";
import TestLayout from "@/components/TestLayout";
import { API_BASE_URL } from "@/config/api";

const MCQTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [testData, setTestData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<number, { code: string; language: string }>>({});
  const [selectedLanguages, setSelectedLanguages] = useState<Record<number, string>>({});
  const [dryRunResults, setDryRunResults] = useState<Record<number, any>>({});
  const [submissionResults, setSubmissionResults] = useState<Record<number, any>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  
  // Timer and Test State
  const [timeLeft, setTimeLeft] = useState(1800);
  const [totalTestDuration, setTotalTestDuration] = useState(1800);
  const [isPaused, setIsPaused] = useState(false);
  const [isTestEnded, setIsTestEnded] = useState(false);
  
  // Fullscreen State
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(30);
  
  // Passcode State
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [supervisorPasscode, setSupervisorPasscode] = useState("");
  const [isValidatingPasscode, setIsValidatingPasscode] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Refs for Security Tracking
  const fullscreenViolationsRef = useRef(0);
  const isInFullscreenRef = useRef(true);
  const eventListenersRef = useRef<(() => void)[]>([]);

  // ============================================================================
  // FETCH TEST DATA
  // ============================================================================
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://localhost:5000/api/test/${testId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch test data');
        }
        
        const json = await res.json();
        console.log('Fetched test data:', json);
        setTestData(json);
        
        const totalSeconds = json.Sections?.reduce((acc: number, sec: any) => 
          acc + (sec.duration || 0) * 60, 0) || 1800;
        setTimeLeft(totalSeconds);
        setTotalTestDuration(totalSeconds);
      } catch (error) {
        console.error('Error fetching test:', error);
        setError('Failed to load test. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load test. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTest();
  }, [testId, navigate]);

  // ============================================================================
  // TIMER LOGIC
  // ============================================================================
  useEffect(() => {
    if (!isPaused && timeLeft > 0 && !isTestEnded) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isTestEnded) {
      handleTimeUp();
    }
  }, [timeLeft, isPaused, isTestEnded]);

  // ============================================================================
  // FULLSCREEN COUNTDOWN TIMER
  // ============================================================================
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    
    if (showFullscreenWarning && fullscreenCountdown > 0 && !isTestEnded) {
      countdownTimer = setInterval(() => {
        setFullscreenCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            endTest("You did not return to fullscreen mode in time. Test ended.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [showFullscreenWarning, fullscreenCountdown, isTestEnded]);

  // ============================================================================
  // PREPARE ALL QUESTIONS
  // ============================================================================
  const allQuestions = (testData?.Sections || []).flatMap((section: any) => {
    const mcqQuestions = (section?.MCQs || []).map((q: any, index: number) => ({
      ...q,
      type: 'MCQ',
      sectionName: section?.name || 'Unknown Section',
      questionNo: index + 1
    }));
    
    const codingQuestions = (section?.codingQuestions || []).map((q: any, index: number) => ({
      ...q,
      type: 'Coding',
      sectionName: section?.name || 'Unknown Section',
      questionNo: mcqQuestions.length + index + 1
    }));
    
    return [...mcqQuestions, ...codingQuestions];
  });

  // ============================================================================
  // END TEST AND SAVE RESULTS
  // ============================================================================
  const endTest = async (reason: string) => {
    setIsTestEnded(true);
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
    }

    // Calculate results
    const results = allQuestions.map(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctOptionLetter;
      return {
        ...question,
        userAnswer,
        isCorrect,
        explanation: question.explanation
      };
    });

    const correctAnswers = results.filter(r => r.isCorrect).length;
    const maxScore = allQuestions.length;
    const percentage = Math.round((correctAnswers / maxScore) * 100);

    const testResult = {
      testId,
      testName: testData.name,
      totalScore: correctAnswers,
      maxScore,
      percentage,
      status: 'completed',
      completedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      hasMCQQuestions: true,
      hasCodingQuestions: false,
      mcqResults: {
        totalQuestions: allQuestions.length,
        correctAnswers,
        wrongAnswers: maxScore - correctAnswers,
        unansweredCount: 0,
        accuracyRate: percentage,
        questions: results
      }
    };

    // Save test result
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userEmail = user?.email || "test@example.com";
      const studentName = user?.name || "Test Student";
      const department = user?.dept || "General";
      const sinNumber = user?.userSIN || "SIN-" + Date.now().toString().slice(-6);

      const testResultData = {
        testId,
        testName: testData.name,
        userEmail,
        studentName,
        department,
        sinNumber,
        totalScore: correctAnswers,
        maxScore,
        percentage,
        completedAt: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        answers: JSON.stringify(answers),
        sessionId: `session_${testId}_${Date.now()}`
      };

      // Enhanced test result with detailed MCQ data
      const enhancedTestResult = {
        ...testResult,
        mcqAnswers: results.map((question, index) => ({
          questionId: question.id,
          question: question.questionText || `Question ${index + 1}`,
          selectedAnswer: question.userAnswer,
          correctAnswer: question.correctOptionLetter,
          options: {
            A: question.optionA || 'Option A',
            B: question.optionB || 'Option B',
            C: question.optionC || 'Option C',
            D: question.optionD || 'Option D'
          },
          explanation: question.explanation || `The correct answer is ${question.correctOptionLetter}.`
        }))
      };

      // Save to localStorage
      localStorage.setItem(`test_result_${testId}`, JSON.stringify(enhancedTestResult));
      localStorage.setItem(`testResult_${testId}_${userEmail}`, JSON.stringify(enhancedTestResult));

      // Save to database
      const response = await fetch(`${API_BASE_URL}/api/student/test-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testResultData)
      });

      if (response.ok) {
        console.log('✅ Test result saved successfully');
      } else {
        console.error('❌ Failed to save test result:', response.status);
      }
    } catch (error) {
      console.error('❌ Error saving test result:', error);
    }

    toast({
      title: "Test Completed",
      description: `You scored ${correctAnswers}/${maxScore}`,
    });

    setTimeout(() => {
      navigate(`/student/test/${testId}/result`);
    }, 1000);
  };

  // ============================================================================
  // SECURITY EVENT HANDLERS
  // ============================================================================

  const handleFullscreenChange = async () => {
    const isFullscreen = !!document.fullscreenElement;
    isInFullscreenRef.current = isFullscreen;
    
    if (!testData || loading) return;
    
    if (!isFullscreen && !isTestEnded) {
      const currentViolations = fullscreenViolationsRef.current + 1;
      fullscreenViolationsRef.current = currentViolations;
      
      console.log(`Fullscreen violation: ${currentViolations}/3`);
      
      if (currentViolations >= 3) {
        endTest("Maximum fullscreen violations reached. Test ended.");
        return;
      }
      
      setShowFullscreenWarning(true);
      setFullscreenCountdown(30);
      
      toast({
        title: "Fullscreen Exit Detected",
        description: `Return to fullscreen. Violation ${currentViolations}/3`,
        variant: "destructive",
      });
    } else if (isFullscreen) {
      setShowFullscreenWarning(false);
      setFullscreenCountdown(30);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (isTestEnded || !testData || loading) return;

    const blockedActions = [
      e.altKey,
      e.altKey && e.key === 'Tab',
      e.altKey && e.key === 'F4',
      e.ctrlKey && e.key === 'Tab',
      e.ctrlKey && e.shiftKey && e.key === 'I',
      e.ctrlKey && e.shiftKey && e.key === 'J',
      e.ctrlKey && e.shiftKey && e.key === 'C',
      e.ctrlKey && e.key === 'u',
      e.ctrlKey && e.key === 'U',
      e.ctrlKey && e.key === 's',
      e.ctrlKey && e.key === 'S',
      e.ctrlKey && e.key === 'p',
      e.ctrlKey && e.key === 'P',
      e.key === 'F11',
      e.key === 'F12',
      e.metaKey,
      e.key === 'Escape' && document.fullscreenElement,
    ];

    if (blockedActions.some(condition => condition)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const currentViolations = fullscreenViolationsRef.current + 1;
      fullscreenViolationsRef.current = currentViolations;
      
      if (currentViolations >= 3) {
        await endTest("Maximum security violations reached. Test ended.");
        return;
      }
      
      toast({
        title: "Restricted Action",
        description: `Not allowed during test. Violation ${currentViolations}/3`,
        variant: "destructive",
      });
      
      return false;
    }
  };

  const handleCopy = async (e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const isCodeEditor = target.classList.contains('code-editor');
    
    if (!isCodeEditor && !isTestEnded) {
      e.preventDefault();
      if (testData && !loading) {
        const currentViolations = fullscreenViolationsRef.current + 1;
        fullscreenViolationsRef.current = currentViolations;
        
        if (currentViolations >= 3) {
          await endTest("Maximum copy violations reached. Test ended.");
          return;
        }
        
        toast({
          title: "Copy Disabled",
          description: `Violation ${currentViolations}/3`,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleCut = async (e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const isCodeEditor = target.classList.contains('code-editor');
    
    if (!isCodeEditor && !isTestEnded) {
      e.preventDefault();
      if (testData && !loading) {
        const currentViolations = fullscreenViolationsRef.current + 1;
        fullscreenViolationsRef.current = currentViolations;
        
        if (currentViolations >= 3) {
          await endTest("Maximum security violations reached. Test ended.");
          return;
        }
        
        toast({
          title: "Cut Disabled",
          description: `Violation ${currentViolations}/3`,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const isCodeEditor = target.classList.contains('code-editor');
    
    if (!isCodeEditor && !isTestEnded) {
      e.preventDefault();
      toast({
        title: "Paste Disabled",
        description: "Pasting is only allowed in code editor",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSelectStart = (e: Event) => {
    const target = e.target as HTMLElement;
    const isCodeEditor = target.classList.contains('code-editor');
    
    if (!isCodeEditor && !isTestEnded) {
      e.preventDefault();
      return false;
    }
  };

  const handleContextMenu = async (e: MouseEvent) => {
    if (!isTestEnded && testData && !loading) {
      e.preventDefault();
      
      // const currentViolations = fullscreenViolationsRef.current + 1;
      // fullscreenViolationsRef.current = currentViolations;
      
      // if (currentViolations >= 3) {
      //   await endTest("Maximum right-click violations reached. Test ended.");
      //   return;
      // }
      
      toast({
        title: "Restricted Action",
        description: `Right-click disabled.`,
        variant: "destructive",
      });
      return false;
    }
  };

  // const handleVisibilityChange = async () => {
  //   if (!testData || loading) return;
    
  //   if (document.hidden && !isTestEnded) {
  //     const currentViolations = fullscreenViolationsRef.current + 1;
  //     fullscreenViolationsRef.current = currentViolations;
      
  //     if (currentViolations >= 3) {
  //       await endTest("Maximum tab switch violations reached. Test ended.");
  //       return;
  //     }
      
  //     setShowFullscreenWarning(true);
  //     setFullscreenCountdown(30);
      
  //     toast({
  //       title: "Tab Switch Detected",
  //       description: `Return immediately. Violation ${currentViolations}/3`,
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const handleWindowBlur = async () => {
  //   if (!testData || loading || isTestEnded) return;
    
  //   const currentViolations = fullscreenViolationsRef.current + 1;
  //   fullscreenViolationsRef.current = currentViolations;
    
  //   if (currentViolations >= 3) {
  //     await endTest("Maximum window switch violations reached. Test ended.");
  //     return;
  //   }
    
  //   setShowFullscreenWarning(true);
  //   setFullscreenCountdown(30);
    
  //   toast({
  //     title: "Window Switch Detected",
  //     description: `Violation ${currentViolations}/3`,
  //     variant: "destructive",
  //   });
  // };

  // ============================================================================
  // EVENT LISTENERS SETUP
  // ============================================================================
  
  const handleVisibilityChange = async () => {
    if (!testData || loading || isTestEnded) return;
    
    // MODIFICATION:
    // Only count a violation if the tab is hidden AND we are 
    // confirmed to be in fullscreen mode.
    if (document.hidden && document.fullscreenElement) {
      const currentViolations = fullscreenViolationsRef.current + 1;
      fullscreenViolationsRef.current = currentViolations;
      
      if (currentViolations >= 3) {
        await endTest("Maximum tab switch violations reached. Test ended.");
        return;
      }
      
      setShowFullscreenWarning(true);
      setFullscreenCountdown(30);
      
      toast({
        title: "Tab Switch Detected",
        description: `Return immediately. Violation ${currentViolations}/3`,
        variant: "destructive",
      });
    }
  };

  const handleWindowBlur = async () => {
    // MODIFICATION:
    // Add !document.fullscreenElement to the guard.
    // Do not count a violation if we are not yet in fullscreen.
    if (!testData || loading || isTestEnded || !document.fullscreenElement) return;
    
    const currentViolations = fullscreenViolationsRef.current + 1;
    fullscreenViolationsRef.current = currentViolations;
    
    if (currentViolations >= 3) {
      await endTest("Maximum window switch violations reached. Test ended.");
      return;
    }
    
    setShowFullscreenWarning(true);
    setFullscreenCountdown(30);
    
    toast({
      title: "Window Switch Detected",
      description: `Violation ${currentViolations}/3`,
      variant: "destructive",
    });
  };
  
  useEffect(() => {
    if (isTestEnded || loading || !testData) return;

    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          isInFullscreenRef.current = true;
          setShowFullscreenWarning(false);
          fullscreenViolationsRef.current = 0;
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isTestEnded) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave? Your test will be submitted.";
      }
    };

    enterFullscreen();

    const handlers = {
      fullscreenchange: () => handleFullscreenChange(),
      visibilitychange: () => handleVisibilityChange(),
      keydown: (e: KeyboardEvent) => handleKeyDown(e),
      contextmenu: (e: MouseEvent) => handleContextMenu(e),
      copy: (e: ClipboardEvent) => handleCopy(e),
      cut: (e: ClipboardEvent) => handleCut(e),
      // paste: (e: ClipboardEvent) => handlePaste(e),
      selectstart: (e: Event) => handleSelectStart(e),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      if (event === 'keydown' || event === 'contextmenu') {
        document.addEventListener(event, handler as any, true);
      } else {
        document.addEventListener(event, handler as any);
      }
    });

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleWindowBlur);

    eventListenersRef.current = [
      () => document.removeEventListener("fullscreenchange", handlers.fullscreenchange),
      () => document.removeEventListener("visibilitychange", handlers.visibilitychange),
      () => document.removeEventListener("keydown", handlers.keydown, true),
      () => document.removeEventListener("contextmenu", handlers.contextmenu, true),
      () => document.removeEventListener("copy", handlers.copy),
      () => document.removeEventListener("cut", handlers.cut),
      () => document.removeEventListener("paste", handlers.paste),
      () => document.removeEventListener("selectstart", handlers.selectstart),
      () => window.removeEventListener("beforeunload", handleBeforeUnload),
      () => window.removeEventListener("blur", handleWindowBlur)
    ];

    return () => {
      eventListenersRef.current.forEach(cleanup => cleanup());
    };
  }, [isTestEnded, loading, testData]);

  // ============================================================================
  // TEST INTERACTION HANDLERS
  // ============================================================================

  const handleTimeUp = () => {
    toast({
      title: "Time's Up!",
      description: "Test time has ended. Please enter supervisor passcode to submit.",
      variant: "destructive",
    });
    setShowPasscodeDialog(true);
  };

  const handleManualSubmit = () => {
    const timeElapsed = (totalTestDuration - timeLeft) / totalTestDuration;
    if (timeElapsed >= 0.9) {
      setShowPasscodeDialog(true);
    } else {
      toast({
        title: "Cannot Submit Yet",
        description: `Complete ${Math.round((0.9 - timeElapsed) * 100 / 0.9)}% more of the test.`,
        variant: "destructive",
      });
    }
  };

  const validateSupervisorPasscode = async () => {
    if (!supervisorPasscode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the supervisor passcode.",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingPasscode(true);
    try {
      const response = await fetch('http://localhost:5000/api/passcode/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: supervisorPasscode,
          type: 'supervisor'
        }),
      });

      const data = await response.json();
      if (data.valid) {
        setShowPasscodeDialog(false);
        setSupervisorPasscode("");
        endTest("Test submitted successfully with supervisor approval.");
      } else {
        toast({
          title: "Invalid Passcode",
          description: "The supervisor passcode is incorrect.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Passcode validation error:', error);
      toast({
        title: "Error",
        description: "Failed to validate passcode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingPasscode(false);
    }
  };

  const handleEnterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        isInFullscreenRef.current = true;
        setShowFullscreenWarning(false);
        setFullscreenCountdown(30);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      toast({
        title: "Fullscreen Error",
        description: "Could not enter fullscreen mode. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleCodeAnswer = (code: string) => {
    const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    setCodeAnswers({ ...codeAnswers, [currentQuestion.id]: { code, language } });
  };

  const handleLanguageChange = (questionId: number, language: string) => {
    setSelectedLanguages({ ...selectedLanguages, [questionId]: language });
    const currentCode = codeAnswers[questionId]?.code || '';
    setCodeAnswers({ ...codeAnswers, [questionId]: { code: currentCode, language } });
  };

  const handleDryRun = async () => {
    if (currentQuestion.type !== 'Coding') return;
    
    const code = codeAnswers[currentQuestion.id]?.code;
    const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    
    if (!code?.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before running",
        variant: "destructive",
      });
      return;
    }
    
    setIsRunning(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/coding/dry-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQuestion.id, code, language })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDryRunResults({ ...dryRunResults, [currentQuestion.id]: result });
        toast({
          title: "Dry Run Complete",
          description: `Passed ${result.summary.passed}/${result.summary.total} test cases`,
        });
      } else {
        toast({
          title: "Dry Run Failed",
          description: result.error || "Failed to execute code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Dry run error:', error);
      toast({
        title: "Error",
        description: "Failed to run code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (currentQuestion.type !== 'Coding') return;
    
    const code = codeAnswers[currentQuestion.id]?.code;
    const language = selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0];
    
    if (!code?.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setIsRunning(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/coding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          code,
          language,
          studentId: 'student123',
          testId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubmissionResults({ ...submissionResults, [currentQuestion.id]: result });
        toast({
          title: "Code Submitted",
          description: `Score: ${result.score}/${result.maxScore}`,
        });
        handleNext();
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to submit code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Code submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleMark = () => {
    const newSet = new Set(markedForReview);
    if (newSet.has(currentQuestion.id)) {
      newSet.delete(currentQuestion.id);
    } else {
      newSet.add(currentQuestion.id);
    }
    setMarkedForReview(newSet);
    handleNext();
  };

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  const handleClear = () => {
    if (currentQuestion.type === 'MCQ') {
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestion.id];
      setAnswers(newAnswers);
    } else {
      const newCodeAnswers = { ...codeAnswers };
      delete newCodeAnswers[currentQuestion.id];
      setCodeAnswers(newCodeAnswers);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getStatusColor = (qid: number, questionType: string) => {
    const hasAnswer = questionType === 'MCQ' ? answers[qid] : codeAnswers[qid]?.code;
    const isSubmitted = questionType === 'Coding' && submissionResults[qid];
    
    if (isSubmitted) return "bg-blue-500 text-white";
    if (hasAnswer) return "bg-green-500 text-white";
    if (markedForReview.has(qid)) return "bg-purple-500 text-white";
    if (qid === currentQuestion?.id) return "bg-orange-500 text-white";
    return "bg-gray-200 text-gray-700";
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const getCurrentViolations = () => fullscreenViolationsRef.current;

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  if (loading) {
    return (
      <TestLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test...</p>
          </div>
        </div>
      </TestLayout>
    );
  }

  if (error || !testData || allQuestions.length === 0) {
    return (
      <TestLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Test Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Failed to load test data'}</p>
            <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
          </div>
        </div>
      </TestLayout>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <TestLayout>
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Question Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load the current question.</p>
          <Button onClick={() => navigate('/student/assessment')}>Back to Tests</Button>
        </div>
      </TestLayout>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <TestLayout>
      <style>{`
        .test-content {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .code-editor, .code-editor-container {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
      `}</style>

      <div className="flex h-screen test-content">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          {currentQuestion.type === 'MCQ' ? (
          <div className="bg-white border-b p-4 flex justify-between items-center">
            <h1 className="text-lg font-semibold">{testData.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span>Time Left: {formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <span>Violations: {getCurrentViolations()}/3</span>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleManualSubmit}
                disabled={isTestEnded || (totalTestDuration - timeLeft) / totalTestDuration < 0.9}
              >
                Submit Test
              </Button>
            </div>
          </div>
          ):(
          <div className="bg-white border-b p-4 flex justify-between items-center">
            <h1 className="text-lg font-semibold">{testData.name} - Coding Question</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span>Time Left: {formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-red-600">
                <span>Violations: {getCurrentViolations()}/3</span>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleManualSubmit}
                disabled={isTestEnded || (totalTestDuration - timeLeft) / totalTestDuration < 0.9}
              >
                Submit Test
              </Button>
            </div>
          </div>
          
          )}

          {/* Question Content */}
          <div className="p-4 overflow-auto flex-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  Q{currentQuestion.questionNo}: {currentQuestion.questionText}
                </CardTitle>
                {currentQuestion.questionImage && (
                  <div className="mt-2">
                    <img 
                      src={currentQuestion.questionImage} 
                      alt="Question" 
                      className="max-w-full h-auto rounded border"
                      onError={(e) => {
                        console.error('Image failed:', currentQuestion.questionImage);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {currentQuestion.type === 'MCQ' ? (
                  // ========== MCQ QUESTION ==========
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={handleAnswer}
                    disabled={isTestEnded}
                  >
                    {["A", "B", "C", "D"].map((opt) => (
                      <div key={opt} className="flex items-start space-x-3 p-3 border rounded mb-2 hover:bg-gray-50">
                        <RadioGroupItem value={opt} id={`opt-${opt}`} className="mt-1" />
                        <Label htmlFor={`opt-${opt}`} className="flex-1 cursor-pointer">
                          <div className="flex items-start gap-2">
                            <span className="font-medium">{opt})</span>
                            <div className="flex-1">
                              <div>{currentQuestion[`option${opt}`]}</div>
                              {currentQuestion[`option${opt}Image`] && (
                                <img 
                                  src={currentQuestion[`option${opt}Image`]} 
                                  alt={`Option ${opt}`} 
                                  className="mt-2 max-w-xs h-auto rounded border"
                                  onError={(e) => {
                                    console.error('Option image failed:', currentQuestion[`option${opt}Image`]);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : 
                (
                  console.log('Rendering coding question', currentQuestion),
                  <div className="grid grid-cols-2 gap-4">

                    {/* LEFT: PROBLEM STATEMENT */}
                    <div className="border rounded p-4 bg-gray-50 text-sm">
                      <h3 className="font-semibold mb-2">Problem Statement:</h3>
                      <pre className="whitespace-pre-wrap text-sm">{currentQuestion.problemStatement}</pre>

                      {/* <h4 className="font-semibold mt-4 mb-1">Input Format:</h4>
                      <pre className="bg-white p-2 border rounded text-xs">{currentQuestion.inputFormat}</pre> */}

                      {/* <h4 className="font-semibold mt-4 mb-1">Output Format:</h4>
                      <pre className="bg-white p-2 border rounded text-xs">{currentQuestion.outputFormat}</pre> */}
                      {currentQuestion.sampleTestCases && currentQuestion.sampleTestCases.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Sample Test Cases:</h5>
                          <div className="space-y-2">
                            {currentQuestion.sampleTestCases.map((testCase: any, index: number) => (
                              <div key={index} className="bg-white p-3 rounded border">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong>Input:</strong>
                                    <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.input}</pre>
                                  </div>
                                  <div>
                                    <strong>Output:</strong>
                                    <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">{testCase.output}</pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <h4 className="font-semibold mt-4 mb-1">Constraints:</h4>
                      <pre className="bg-white p-2 border rounded text-xs">{currentQuestion.constraints}</pre>
                    </div>
                    

                    {/* RIGHT: CODE AREA */}
                    <div>
                      <div className="flex gap-2 mb-2">
                        <Select
                          value={selectedLanguages[currentQuestion.id] || currentQuestion.allowedLanguages[0]}
                          onValueChange={(v)=>handleLanguageChange(currentQuestion.id, v)}
                        >
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>
                            {currentQuestion.allowedLanguages.map(l => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button onClick={handleDryRun} disabled={isRunning}><Play className="w-4 h-4"/> Run</Button>
                        <Button onClick={handleSubmitCode} disabled={isRunning}><Send className="w-4 h-4"/> Submit</Button>
                      </div>

                      <Textarea
                        className="h-80 font-mono text-xs border"
                        value={codeAnswers[currentQuestion.id]?.code || ""}
                        onChange={(e)=>handleCodeAnswer(e.target.value)}
                        placeholder="Write code here..."
                      />

                      {dryRunResults[currentQuestion.id] && (
                        <div className="bg-gray-200 text-xs p-2 mt-2 rounded">
                          ✅ Test Passed: {dryRunResults[currentQuestion.id].summary.passed} / {dryRunResults[currentQuestion.id].summary.total}
                        </div>
                      )}
                    </div>
                  </div>
                )
                }

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={handlePrev} 
                      disabled={currentQuestionIndex === 0 || isTestEnded}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleMark} 
                      disabled={isTestEnded}
                    >
                      {markedForReview.has(currentQuestion.id) ? "Unmark" : "Mark for Review"} & Next
                    </Button>
                  </div>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={handleClear} 
                      disabled={isTestEnded}
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      disabled={currentQuestionIndex === allQuestions.length - 1 || isTestEnded}
                    >
                      Save & Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>



        {/* Question Palette Sidebar */}

        {currentQuestion.type === 'MCQ' ? (
        <div className="w-80 border-l p-4 bg-white overflow-y-auto">
          <h3 className="text-md font-semibold mb-4">Question Palette</h3>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {allQuestions.map((q: any, idx: number) => (
              <button
                key={q.id}
                className={`w-8 h-8 rounded font-medium text-xs transition ${getStatusColor(q.id, q.type)}`}
                onClick={() => setCurrentQuestionIndex(idx)}
                disabled={isTestEnded}
                title={`Question ${q.questionNo}`}
              >
                {q.questionNo}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">Legend:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span>Submitted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500"></div>
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <span>Currently Viewing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-200"></div>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : null}
      </div>

      {/* Supervisor Passcode Dialog */}
      <Dialog open={showPasscodeDialog} onOpenChange={() => timeLeft > 0 && setShowPasscodeDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supervisor Passcode Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {timeLeft === 0 
                ? "Test time has ended. Please enter the supervisor passcode to submit your test."
                : "To submit the test, please enter the supervisor passcode."}
            </p>
            <div>
              <Label htmlFor="passcode">Supervisor Passcode</Label>
              <Input
                id="passcode"
                type="password"
                placeholder="Enter 6-digit passcode"
                value={supervisorPasscode}
                onChange={(e) => setSupervisorPasscode(e.target.value)}
                maxLength={6}
                className="mt-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    validateSupervisorPasscode();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            {timeLeft > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowPasscodeDialog(false)}
              >
                Cancel
              </Button>
            )}
            <Button 
              onClick={validateSupervisorPasscode}
              disabled={isValidatingPasscode || !supervisorPasscode.trim()}
            >
              {isValidatingPasscode ? 'Validating...' : 'Submit Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Warning Dialog */}
      <Dialog open={showFullscreenWarning} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Fullscreen Exit Detected
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {fullscreenCountdown}
                </div>
                <p className="text-sm text-red-700 font-medium">
                  seconds to return to fullscreen
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <strong>Violation {getCurrentViolations()}/3:</strong> You have exited fullscreen mode. 
                Please return to fullscreen immediately to continue your test.
              </p>
              
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Warning:</strong> If you don't return to fullscreen within {fullscreenCountdown} seconds, 
                  your test will be automatically ended.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleEnterFullscreen}
              className="gap-2 bg-green-600 hover:bg-green-700 w-full"
              size="lg"
            >
              <Fullscreen className="w-4 h-4" />
              Enter Fullscreen Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TestLayout>
  );
};

export default MCQTest;