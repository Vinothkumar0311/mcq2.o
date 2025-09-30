@echo off
echo ========================================
echo   MCQ Platform System Health Check
echo ========================================
echo.

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    goto :error
)

echo Checking npm installation...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    goto :error
)

echo.
echo Checking MySQL connection...
cd backend
node -e "
const { sequelize } = require('./models');
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
"
if %errorlevel% neq 0 (
    echo ERROR: Database connection failed
    goto :error
)

echo.
echo Checking backend dependencies...
if not exist "node_modules" (
    echo WARNING: Backend dependencies not installed
    echo Run: cd backend && npm install
) else (
    echo ✅ Backend dependencies installed
)

echo.
echo Checking frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    echo WARNING: Frontend dependencies not installed
    echo Run: cd frontend && npm install
) else (
    echo ✅ Frontend dependencies installed
)

echo.
echo Checking environment configuration...
cd ..\backend
if not exist ".env" (
    echo ERROR: Backend .env file missing
    goto :error
) else (
    echo ✅ Backend .env file exists
)

cd ..\frontend
if not exist ".env" (
    echo WARNING: Frontend .env file missing (optional)
) else (
    echo ✅ Frontend .env file exists
)

echo.
echo ========================================
echo   System Health Check PASSED
echo ========================================
echo All critical components are working properly!
echo You can now run: start-dev.bat
goto :end

:error
echo.
echo ========================================
echo   System Health Check FAILED
echo ========================================
echo Please fix the errors above before starting the application.

:end
pause