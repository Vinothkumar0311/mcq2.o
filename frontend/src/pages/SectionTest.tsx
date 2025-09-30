import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Coffee, CheckCircle } from 'lucide-react';
import StudentLayout from '@/components/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/api';
import MCQSection from '@/components/MCQSection';
import CodingSection from '@/components/CodingSection';

const SectionTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [testData, setTestData] = useState<any>(null);
  const [onBreak, setOnBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<number, { code: string; language: string }>>({});
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  const [sectionStartTime, setSectionStartTime] = useState<Date>(new Date());
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(0);
  const [sectionTimer, setSectionTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);

  const studentId = user?.id;

  // Debug logging
  useEffect(() => {
    console.log('SectionTest - User:', user);
    console.log('SectionTest - Student ID:', studentId);
  }, [user, studentId]);

  useEffect(() => {
    if (studentId) {
      checkTestEligibility();
    }
  }, [testId, studentId]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (session && !onBreak && !autoSubmitTriggered) {
      const interval = setInterval(() => {
        saveAnswersToDatabase();
      }, 30000); // 30 seconds
      setAutoSaveInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [session, onBreak, autoSubmitTriggered]);

  const checkTestEligibility = async () => {
    try {
      console.log('Checking test eligibility for:', { testId, studentId });
      const response = await fetch(`${API_BASE_URL}/api/test-session/${testId}/${studentId}/eligibility`);
      const result = await response.json();
      
      if (result.success) {
        if (!result.canTakeTest) {
          // Student has already completed this test
          toast({
            title: "Test Already Completed",
            description: `You completed this test on ${new Date(result.completedAt).toLocaleDateString()} with a score of ${result.score}/${result.maxScore} (${result.percentage}%). Each test can only be taken once.`,
            variant: "destructive",
          });
          setTimeout(() => {
            navigate('/student/reports');
          }, 3000);
          return;
        }
        
        if (result.hasInProgressSession) {
          toast({
            title: "Resuming Test",
            description: `You have an in-progress session. Resuming from section ${result.currentSection + 1}.`,
          });
        }
        
        // Proceed to start the test session
        startTestSession();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Check eligibility error:', error);
      toast({
        title: "Error",
        description: "Failed to check test eligibility",
        variant: "destructive",
      });
    }
  };

  // Section timer effect
  useEffect(() => {
    if (currentSection && session && !onBreak && !autoSubmitTriggered) {
      startSectionTimer();
    }
    return () => {
      if (sectionTimer) {
        clearInterval(sectionTimer);
      }
    };
  }, [currentSection, session, onBreak]);

  // Section countdown timer
  useEffect(() => {
    if (sectionTimeRemaining > 0 && !onBreak && !autoSubmitTriggered) {
      const timer = setInterval(() => {
        setSectionTimeRemaining(prev => {
          if (prev <= 1) {
            // Section time expired - auto-submit
            handleSectionTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setSectionTimer(timer);
      return () => clearInterval(timer);
    }
  }, [sectionTimeRemaining, onBreak, autoSubmitTriggered]);

  useEffect(() => {
    if (onBreak && breakTimeLeft > 0) {
      const timer = setInterval(() => {
        setBreakTimeLeft(prev => {
          if (prev <= 1) {
            setOnBreak(false);
            getCurrentSection();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [onBreak, breakTimeLeft]);

  const startTestSession = async () => {
    try {
      console.log('Starting test session with:', { testId, studentId });
      const response = await fetch(`${API_BASE_URL}/api/test-session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, studentId })
      });

      const result = await response.json();
      if (result.success) {
        setSession(result.session);
        if (result.session.breakEndTime) {
          const breakEnd = new Date(result.session.breakEndTime);
          const now = new Date();
          if (breakEnd > now) {
            setOnBreak(true);
            setBreakTimeLeft(Math.ceil((breakEnd.getTime() - now.getTime()) / 1000));
            return;
          }
        }
        getCurrentSection();
      } else {
        if (result.alreadyCompleted) {
          toast({
            title: "Test Already Completed",
            description: "You have already completed this test. Redirecting to reports...",
            variant: "destructive",
          });
          setTimeout(() => {
            navigate('/student/reports');
          }, 2000);
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Start session error:', error);
      toast({
        title: "Error",
        description: "Failed to start test session",
        variant: "destructive",
      });
    }
  };

  const startSectionTimer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/section-timer/${testId}/${studentId}/start-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIndex: session?.currentSectionIndex || 0 })
      });
      
      const result = await response.json();
      if (result.success) {
        setSectionTimeRemaining(result.timeRemaining);
        console.log(`⏰ Section timer started - ${result.timeRemaining} seconds remaining`);
      }
    } catch (error) {
      console.error('Start section timer error:', error);
    }
  };

  const saveAnswersToDatabase = async () => {
    if (!session || !session.id) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/auto-save/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          answers,
          codeAnswers,
          currentSectionId: session.currentSectionIndex
        })
      });
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const loadSavedAnswers = async (sessionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auto-save/state/${sessionId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const currentSectionId = session?.currentSectionIndex || 0;
        const savedAnswers = result.data.mcqAnswers?.[currentSectionId] || {};
        const savedCodeAnswers = result.data.codeAnswers?.[currentSectionId] || {};
        
        setAnswers(savedAnswers);
        setCodeAnswers(savedCodeAnswers);
      }
    } catch (error) {
      console.error('Load saved answers error:', error);
    }
  };

  const handleSectionTimeout = async () => {
    if (autoSubmitTriggered) return;
    
    setAutoSubmitTriggered(true);
    
    try {
      // Save final answers before auto-submit
      await saveAnswersToDatabase();
      
      toast({
        title: "⏰ Section Time Expired",
        description: "Time's up! Auto-submitting your answers and moving to next section...",
        variant: "destructive",
      });
      
      // Auto-submit current section answers
      const timeSpent = Math.floor((new Date().getTime() - sectionStartTime.getTime()) / 1000);
      
      const codingSubmissions = Object.entries(codeAnswers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        code: answer.code,
        language: answer.language,
        score: 0
      }));
      
      const response = await fetch(`${API_BASE_URL}/api/test-session/${testId}/${studentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mcqAnswers: answers,
          codingSubmissions,
          timeSpent,
          autoSubmitted: true
        })
      });
      
      const result = await response.json();
      if (result.success) {
        if (result.testCompleted) {
          toast({
            title: "✅ Test Completed",
            description: "All sections completed. Redirecting to results...",
          });
          
          setTimeout(() => {
            navigate(`/student/test-result/${testId}`);
          }, 2000);
        } else {
          toast({
            title: "➡️ Moving to Next Section",
            description: `Section ${session.currentSectionIndex + 1} completed. Loading next section...`,
          });
          
          // Reset for next section
          setAutoSubmitTriggered(false);
          setAnswers({});
          setCodeAnswers({});
          getCurrentSection();
        }
      }
    } catch (error) {
      console.error('Auto-submit error:', error);
      setAutoSubmitTriggered(false);
    }
  };

  const getCurrentSection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test-session/${testId}/${studentId}/current`);
      const result = await response.json();

      if (result.success) {
        if (result.sectionExpired) {
          // Handle expired section
          handleSectionTimeout();
          return;
        }
        
        if (result.onBreak) {
          setOnBreak(true);
          setBreakTimeLeft(result.remainingBreakTime);
          return;
        }

        setSession(result.session);
        setCurrentSection(result.section);
        setTestData(result.test);
        setSectionStartTime(new Date());
        
        // Load saved answers from database if available
        if (result.session.id) {
          loadSavedAnswers(result.session.id);
        } else {
          // Clear local state for new section
          setAnswers({});
          setCodeAnswers({});
        }
        
        // Set section time remaining if available
        if (result.session.sectionTimeRemaining) {
          setSectionTimeRemaining(result.session.sectionTimeRemaining);
        }
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Get section error:', error);
      toast({
        title: "Error",
        description: "Failed to load section",
        variant: "destructive",
      });
    }
  };

  const submitSection = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Save final answers before submission
      await saveAnswersToDatabase();
      
      const timeSpent = Math.floor((new Date().getTime() - sectionStartTime.getTime()) / 1000);
      
      // Prepare coding submissions
      const codingSubmissions = Object.entries(codeAnswers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        code: answer.code,
        language: answer.language,
        score: 0 // Will be calculated by backend
      }));

      console.log('Submitting section with studentId:', studentId);
      const response = await fetch(`${API_BASE_URL}/api/test-session/${testId}/${studentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mcqAnswers: answers,
          codingSubmissions,
          timeSpent
        })
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.testCompleted) {
          console.log('Test completed for student:', studentId);
          toast({
            title: "Test Completed!",
            description: `Your score: ${result.totalScore}/${result.maxScore}`,
          });
          
          // Redirect to test result page to show detailed results
          setTimeout(() => {
            navigate(`/student/test-result/${testId}`);
          }, 2000);
        } else if (result.sectionCompleted) {
          toast({
            title: "Section Completed!",
            description: result.message || "Moving to next section...",
          });
          // Reset for next section
          setAutoSubmitTriggered(false);
          getCurrentSection();
        }
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Submit section error:', error);
      toast({
        title: "Error",
        description: "Failed to submit section",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (onBreak) {
    return (
      <StudentLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <Coffee className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <CardTitle className="text-2xl">Section Break</CardTitle>
              <p className="text-gray-600 mt-2">
                Great job! You've completed a section.
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  Take a moment to relax and prepare for the next section
                </p>
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {formatTime(breakTimeLeft)}
                </div>
                <Progress value={((60 - breakTimeLeft) / 60) * 100} className="w-full mb-2" />
                <p className="text-sm text-gray-500">
                  Next section starts automatically
                </p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  💡 <strong>Tip:</strong> Use this time to stretch, take deep breaths, or review your strategy
                </p>
              </div>
              
              {session && (
                <div className="text-sm text-gray-600">
                  <p>Section {session.currentSectionIndex} of {session.totalSections} completed</p>
                  <Progress 
                    value={(session.currentSectionIndex / session.totalSections) * 100} 
                    className="w-full mt-2" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  if (!session || !currentSection || !testData) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test...</p>
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/student/assessment')}
                className="text-sm"
              >
                Back to Tests
              </Button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{testData.name}</h1>
                <p className="text-sm text-gray-600">
                  Section {session.currentSectionIndex + 1} of {session.totalSections}: {currentSection.name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      sectionTimeRemaining <= 300 ? 'text-red-600' : 
                      sectionTimeRemaining <= 600 ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {formatTime(sectionTimeRemaining)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Section {session.currentSectionIndex + 1} Time
                    </div>
                  </div>
                </div>
                <Button
                  onClick={submitSection}
                  disabled={isSubmitting || autoSubmitTriggered}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Submitting...' : 
                   session.currentSectionIndex === session.totalSections - 1 ? 'Submit Test' : 'Submit Section'}
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{session.currentSectionIndex + 1} / {session.totalSections} sections</span>
              </div>
              <Progress 
                value={((session.currentSectionIndex + 1) / session.totalSections) * 100} 
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Section Timer Warning */}
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-orange-800">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="font-medium">Section-Based Test</p>
                  <p className="text-sm">
                    Each section has its own timer. When time expires, you'll automatically move to the next section. 
                    <strong>You cannot return to previous sections.</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {currentSection.instructions && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Section Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{currentSection.instructions}</p>
              </CardContent>
            </Card>
          )}

          {currentSection.type === 'MCQ' ? (
            <MCQSection
              questions={currentSection.MCQs}
              answers={answers}
              onAnswerChange={setAnswers}
            />
          ) : (
            <CodingSection
              questions={currentSection.codingQuestions}
              codeAnswers={codeAnswers}
              onCodeAnswerChange={setCodeAnswers}
              testDuration={currentSection.duration}
              testName={testData.name}
            />
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default SectionTest;