import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DetailedTestResult from "@/components/DetailedTestResult";

const TestResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resultsReleased, setResultsReleased] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const checkResultStatus = async () => {
      try {
        const studentId = localStorage.getItem('studentId') || localStorage.getItem('userId') || user?.id || '1';
        
        // Check if results are released
        const response = await fetch(`http://localhost:5000/api/test-result/${testId}/student/${studentId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          console.log('Result status check:', data);
          
          // If results are released, show full results
          if (data.success && data.results && data.resultsReleased !== false) {
            setResultsReleased(true);
            setLoading(false);
            return;
          }
          
          // If completion screen or results not released
          if (data.view === 'completion-screen' || data.resultsReleased === false) {
            setResultsReleased(false);
            setLoading(false);
            return;
          }
        }
        
        // Default: Results not released - show completion screen
        setResultsReleased(false);
        setLoading(false);
        
      } catch (error) {
        console.error('Error checking result status:', error);
        setResultsReleased(false);
        setLoading(false);
      }
    };

    checkResultStatus();
  }, [testId, user]);

  // Countdown timer for redirect
  useEffect(() => {
    if (!resultsReleased && !loading) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            navigate('/student/assessment');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resultsReleased, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If results are released, show detailed results
  if (resultsReleased) {
    return <DetailedTestResult />;
  }

  // Show simple completion screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border border-gray-100">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <img 
              src="/favicon.svg" 
              alt="Platform Logo" 
              className="w-12 h-12 text-white"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'block';
              }}
            />
            <span className="text-3xl text-white hidden">🎓</span>
          </div>
        </div>
        
        {/* Success Message */}
        <div className="mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Test Completed Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            You have successfully completed the test.
          </p>
        </div>
        
        {/* Countdown Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
          <div className="flex items-center justify-center mb-3">
            <span className="text-2xl mr-2">⏳</span>
            <p className="text-lg font-medium text-gray-700">
              Redirecting in {countdown} seconds
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${((15 - countdown) / 15) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            {Math.round(((15 - countdown) / 15) * 100)}% complete
          </p>
        </div>
        
        {/* Action Button */}
        <button
          onClick={() => navigate('/student/assessment')}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <span className="flex items-center justify-center">
            <span className="mr-2">🏠</span>
            Go to Dashboard Now
          </span>
        </button>
        
        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          Your results will be available once released by the admin.
        </p>
      </div>
    </div>
  );
};

export default TestResult;