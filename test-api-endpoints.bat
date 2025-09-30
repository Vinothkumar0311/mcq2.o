@echo off
echo ========================================
echo   TESTING API ENDPOINTS
echo ========================================
echo.

echo Testing backend health...
curl -s http://localhost:5000/api/health
echo.
echo.

echo Testing test results endpoint...
curl -s http://localhost:5000/api/test-results
echo.
echo.

echo Testing admin reports endpoint...
curl -s http://localhost:5000/api/admin/tests-summary
echo.
echo.

echo ========================================
echo   API ENDPOINT TESTS COMPLETE
echo ========================================
pause