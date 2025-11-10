@echo off
echo ========================================
echo SETTING UP VIOLATION MANAGEMENT SYSTEM
echo ========================================
echo.

echo 🗄️ Creating violations table in database...
mysql -u root -p test_platform < create-violations-table.sql

if %errorlevel% equ 0 (
    echo ✅ Database table created successfully!
) else (
    echo ❌ Database setup failed. Please check MySQL connection.
    pause
    exit /b 1
)

echo.
echo 🔧 Checking backend files...
if exist "backend\src\models\StudentViolation.js" (
    echo ✅ StudentViolation model exists
) else (
    echo ❌ StudentViolation model missing
)

if exist "backend\src\controllers\violationController.js" (
    echo ✅ Violation controller exists
) else (
    echo ❌ Violation controller missing
)

if exist "backend\src\routes\violationRoutes.js" (
    echo ✅ Violation routes exist
) else (
    echo ❌ Violation routes missing
)

echo.
echo 🎨 Checking frontend files...
if exist "frontend\src\pages\AdminViolations.tsx" (
    echo ✅ Admin violations page exists
) else (
    echo ❌ Admin violations page missing
)

if exist "frontend\src\components\ViolationWarning.tsx" (
    echo ✅ Violation warning component exists
) else (
    echo ❌ Violation warning component missing
)

echo.
echo 🚀 Starting servers...
echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo VIOLATION SYSTEM SETUP COMPLETE!
echo ========================================
echo.
echo 🎯 TESTING INSTRUCTIONS:
echo.
echo 1. ADMIN TESTING:
echo    - Go to http://localhost:8080/admin
echo    - Navigate to Violations page
echo    - Test filtering, search, block/unblock
echo    - Test Excel/PDF exports
echo.
echo 2. API TESTING:
echo    - Test violation logging: POST /api/violations/log
echo    - Test eligibility check: GET /api/test-eligibility/check/1
echo    - Test violation list: GET /api/violations
echo.
echo 3. STUDENT TESTING:
echo    - Add ViolationWarning component to test pages
echo    - Test eligibility checking before tests
echo    - Verify blocked students cannot take tests
echo.
echo ✅ System is ready for use!
echo.
pause