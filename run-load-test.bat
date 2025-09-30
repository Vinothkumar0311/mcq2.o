@echo off
echo ========================================
echo   100 Students Load Test - 3 Sections
echo ========================================
echo.

echo Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is available

REM Check if backend server is running
echo.
echo Checking if backend server is running...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend server is not running on port 5000
    echo Please start the backend server first:
    echo    cd backend
    echo    npm run dev
    echo.
    pause
    exit /b 1
)

echo ✅ Backend server is running

REM Install axios if not present
echo.
echo Installing required dependencies...
npm list axios >nul 2>&1
if errorlevel 1 (
    echo Installing axios...
    npm install axios
)

echo ✅ Dependencies ready

echo.
echo ========================================
echo Starting Load Test...
echo ========================================
echo.
echo Test Configuration:
echo - Students: 100
echo - Sections: 3 (1 MCQ + 2 Coding)
echo - MCQ Questions: 3
echo - Coding Problems: 2
echo - Concurrent batches: 10 students per batch
echo.
echo This test will:
echo 1. Simulate 100 students taking the test
echo 2. Generate realistic answers and scores
echo 3. Test database performance under load
echo 4. Generate comprehensive performance report
echo 5. Save results to JSON files
echo.

set /p confirm="Press Enter to start the load test (or Ctrl+C to cancel)..."

echo.
echo 🚀 Starting load test...
node test-100-students-load.js

echo.
echo ========================================
echo Load Test Complete!
echo ========================================
echo.
echo Check the generated files:
echo - load-test-report-*.json (detailed results)
echo - load-test-fallback-data-*.json (backup data)
echo.
echo You can now:
echo 1. Check admin reports at http://localhost:8080/admin/test-reports
echo 2. View student results and performance
echo 3. Test report generation and downloads
echo 4. Verify leaderboard functionality
echo.
pause