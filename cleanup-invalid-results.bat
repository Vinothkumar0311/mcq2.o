@echo off
echo Cleaning up invalid test results...
echo.

echo 1. Cleaning up backend database...
cd backend
node scripts/cleanup-invalid-sessions.js
echo.

echo 2. Frontend cleanup will run automatically when the app starts
echo.

echo Cleanup completed!
pause