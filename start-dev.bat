@echo off
echo Starting Student Assignment Center...

echo Starting backend server...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080
pause