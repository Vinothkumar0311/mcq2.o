@echo off
echo Adding resultsReleased columns to database...

cd /d "z:\Final aakam project\Assigment only\mcq"

mysql -u root -p test_platform < add-results-released-columns.sql

echo.
echo Database schema updated successfully!
echo - Added results_released column to test_sessions table
echo - Added results_released column to students_results table
echo - Added performance indexes
echo.
pause