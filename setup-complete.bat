@echo off
echo ========================================
echo   Student Assignment Center Setup
echo ========================================
echo.

echo Step 1: Validating environment...
cd backend
call npm run validate-env
if %errorlevel% neq 0 (
    echo ERROR: Environment validation failed
    echo Please check your .env file
    pause
    exit /b 1
)

echo.
echo Step 2: Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed
    pause
    exit /b 1
)

echo.
echo Step 3: Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed
    pause
    exit /b 1
)

echo.
echo Step 4: Testing database connection...
cd ..\backend
call npm run health-check
if %errorlevel% neq 0 (
    echo ERROR: Database connection failed
    echo Please ensure MySQL is running and credentials are correct
    pause
    exit /b 1
)

echo.
echo Step 5: Initializing database...
call npm run init-db
if %errorlevel% neq 0 (
    echo ERROR: Database initialization failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Run 'start-dev.bat' to start the application
echo 2. Access frontend at: http://localhost:8080
echo 3. Access backend at: http://localhost:5000
echo.
pause