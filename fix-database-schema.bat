@echo off
echo ========================================
echo   Database Schema Fix - test_id Column
echo ========================================
echo.

cd backend
echo Running database schema fix...
node scripts/fix-database-schema.js

echo.
echo ========================================
echo   Database schema fix completed!
echo ========================================
pause