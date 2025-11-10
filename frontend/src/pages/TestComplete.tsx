import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TestComplete = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/student/assessment');
    }, 15000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
      <div className="text-center text-white p-8">
        <div className="w-32 h-32 mx-auto mb-8 bg-white rounded-full flex items-center justify-center">
          <span className="text-6xl">🎓</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">
          ✅ Test Completed Successfully!
        </h1>
        
        <p className="text-xl mb-8">
          Your test has been submitted successfully.
        </p>
        
        <div className="text-lg">
          Redirecting to dashboard in 15 seconds...
        </div>
      </div>
    </div>
  );
};

export default TestComplete;