@echo off
echo ========================================
echo   POPULATING SAMPLE TEST DATA
echo ========================================
echo.

cd backend
node scripts/populate-test-data.js

echo.
echo ========================================
echo   SAMPLE DATA POPULATION COMPLETE
echo ========================================
echo.
echo You can now:
echo 1. Visit http://localhost:8080/admin/test-reports
echo 2. View the populated test reports
echo 3. Test the download functionality
echo.
pause