@echo off
echo ========================================
echo COMPREHENSIVE FUNCTIONALITY TEST
echo ========================================
echo.

echo 🔍 Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)
echo ✅ Node.js is installed

echo.
echo 🔍 Installing test dependencies...
cd backend
npm install axios >nul 2>&1
cd ..

echo.
echo 🧪 Running comprehensive functionality test...
node test-all-functionality.js

echo.
echo ========================================
echo MANUAL TESTING INSTRUCTIONS
echo ========================================
echo.
echo 1. BACKEND: Open terminal → cd backend → npm run dev
echo 2. FRONTEND: Open terminal → cd frontend → npm run dev
echo 3. STUDENT TEST:
echo    - Go to http://localhost:8080
echo    - Complete a test (MCQ + Coding)
echo    - Should see "🎉 Test Completed Successfully" (NOT results)
echo.
echo 4. ADMIN TEST:
echo    - Go to http://localhost:8080/admin
echo    - Navigate to Test Reports
echo    - Find completed test
echo    - Click "Release Result" for student
echo    - Should see success message
echo.
echo 5. STUDENT VERIFICATION:
echo    - Refresh student result page
echo    - Should now see FULL results with download option
echo    - PDF download should work
echo.
echo 6. ADMIN VERIFICATION:
echo    - Try clicking "Release Result" again
echo    - Should show "Already Released" message
echo    - Admin PDF download should work
echo.
echo ✅ If all steps work → SYSTEM IS WORKING CORRECTLY! 🎉
echo ❌ If any step fails → Check console logs for errors
echo.
pause