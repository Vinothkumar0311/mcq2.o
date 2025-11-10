@echo off
echo ========================================
echo TESTING RESULT RELEASE FLOW
echo ========================================
echo.

echo 1. Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run dev"
timeout /t 5

echo 2. Starting frontend server...
cd ../frontend  
start "Frontend Server" cmd /k "npm run dev"
timeout /t 5

echo 3. Test Flow Instructions:
echo ========================================
echo STUDENT SIDE:
echo - Go to http://localhost:8080
echo - Complete a test (MCQ + Coding)
echo - After completion, should see "Test Completed Successfully" screen
echo - Should NOT see results until admin releases them
echo.
echo ADMIN SIDE:
echo - Go to http://localhost:8080/admin
echo - Navigate to Test Reports
echo - Find the completed test
echo - Click "Release Result" for individual student
echo - OR click "Release All Results" for all students
echo.
echo STUDENT SIDE (After Release):
echo - Refresh the result page
echo - Should now see full results with download option
echo - PDF download should work with comprehensive report
echo.
echo ADMIN VERIFICATION:
echo - Admin can download individual student reports
echo - Admin can download Excel reports
echo - "Release Result" button should show "Already Released" on second click
echo ========================================

pause