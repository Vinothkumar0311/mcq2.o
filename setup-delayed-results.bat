@echo off
echo ========================================
echo   DELAYED RESULT RELEASE SETUP
echo ========================================
echo.

echo 1️⃣ Adding results_released column to database...
mysql -u root -p12345 -D projectinforce1 -e "
ALTER TABLE students_results ADD COLUMN IF NOT EXISTS results_released BOOLEAN DEFAULT FALSE;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS results_released BOOLEAN DEFAULT FALSE;
SELECT 'Database updated successfully' as Status;
"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database update failed!
    echo Please check:
    echo - MySQL server is running
    echo - Database 'projectinforce1' exists
    echo - Credentials are correct
    pause
    exit /b 1
)

echo ✅ Database migration completed!
echo.

echo 2️⃣ Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo 3️⃣ Testing the system...
cd ..
node test-delayed-results.js

echo.
echo ========================================
echo   SETUP COMPLETED!
echo ========================================
echo.
echo 🎯 WHAT'S NEW:
echo ✅ Students see completion message only
echo ✅ Admin can release results individually
echo ✅ Admin can release all results at once
echo ✅ Students see full results after release
echo.
echo 🔗 ADMIN PANEL:
echo http://localhost:8080/admin/test-reports
echo.
echo 🔗 STUDENT PANEL:
echo http://localhost:8080/student/assessment
echo.
pause