@echo off
echo Testing Admin Report Download Fix
echo ================================

echo.
echo 1. Stopping any existing backend processes...
taskkill /f /im node.exe 2>nul

echo.
echo 2. Starting backend server with enhanced error handling...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo 3. Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo 4. Testing download endpoints...
echo.
echo To test the fix:
echo 1. Open frontend at http://localhost:8080
echo 2. Go to Admin Reports section
echo 3. Try downloading a test report
echo 4. Check backend console for detailed error logs
echo.
echo Backend server is running in a separate window.
echo Check the backend console for detailed debugging information.
echo.
pause