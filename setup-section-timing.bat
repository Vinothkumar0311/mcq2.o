@echo off
echo ========================================
echo   SECTION-BASED TIMING SETUP
echo ========================================
echo.

echo 🔄 Running database migration for section timing...
cd backend
node scripts/database/add-missing-columns.js

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Migration failed!
    pause
    exit /b 1
)

echo.
echo 🧪 Testing section timing functionality...
node scripts/testing/test-section-timing-simple.js

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Tests failed!
    pause
    exit /b 1
)

echo.
echo ✅ Section-based timing system setup complete!
echo.
echo 📋 Features implemented:
echo   - Individual section timers
echo   - Automatic progression when time expires
echo   - No return to completed sections
echo   - Auto-submission on timeout
echo   - Section completion tracking
echo.
echo 🚀 You can now use section-based tests with strict timing!
echo.
pause