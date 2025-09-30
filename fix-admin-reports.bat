@echo off
echo ========================================
echo   FIXING ADMIN TEST REPORTS
echo ========================================
echo.

echo 1. Stopping any running servers...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo 2. Populating sample test data...
cd backend
node scripts/populate-test-data.js
cd ..

echo 3. Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 5 >nul

echo 4. Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 3 >nul

echo.
echo ========================================
echo   ADMIN REPORTS FIX COMPLETE
echo ========================================
echo.
echo Servers are starting up...
echo.
echo Once both servers are running:
echo 1. Visit http://localhost:8080/admin/test-reports
echo 2. You should see 3 tests with sample data
echo 3. Test the download and view functionality
echo.
echo If you see "No Tests Found", wait a moment and click Refresh
echo.
pause