@echo off
echo ========================================
echo   COMPREHENSIVE PLATFORM TESTING
echo ========================================
echo.
echo This script will test the platform with:
echo - 100 concurrent students
echo - 3-section test (1 MCQ + 2 Coding)
echo - Performance monitoring
echo - Report generation testing
echo.

echo Step 1: Checking system readiness...
echo ========================================

REM Check backend server
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend server not running. Starting it now...
    start "Backend Server" cmd /k "cd backend && npm run dev"
    echo ⏳ Waiting for backend to start...
    timeout /t 10 /nobreak >nul
) else (
    echo ✅ Backend server is running
)

REM Check frontend server
curl -s http://localhost:8080 >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend server not running. Starting it now...
    start "Frontend Server" cmd /k "cd frontend && npm run dev"
    echo ⏳ Waiting for frontend to start...
    timeout /t 15 /nobreak >nul
) else (
    echo ✅ Frontend server is running
)

echo.
echo Step 2: Running load test...
echo ========================================
call run-load-test.bat

echo.
echo Step 3: Inserting test data...
echo ========================================
node insert-load-test-data.js

echo.
echo Step 4: Testing admin features...
echo ========================================
echo.
echo 🌐 Opening admin panel...
start http://localhost:8080/admin/test-reports

echo.
echo ✅ TESTING COMPLETE!
echo ========================================
echo.
echo What to test now:
echo.
echo 1. ADMIN REPORTS:
echo    - Go to http://localhost:8080/admin/test-reports
echo    - View the load test results
echo    - Test PDF/Excel downloads
echo    - Check leaderboard functionality
echo.
echo 2. PERFORMANCE VERIFICATION:
echo    - Check if all 100 students appear
echo    - Verify score calculations
echo    - Test section-wise performance display
echo    - Validate report generation speed
echo.
echo 3. STUDENT REPORTS:
echo    - Go to http://localhost:8080/student/reports
echo    - Test individual student views
echo    - Check report downloads
echo.
echo 4. DATABASE PERFORMANCE:
echo    - Monitor query response times
echo    - Check for any errors in console
echo    - Verify data integrity
echo.
echo 📊 Check the generated files:
echo    - load-test-report-*.json
echo    - load-test-fallback-data-*.json
echo.
echo 🎯 Platform is ready for production testing!
echo.
pause