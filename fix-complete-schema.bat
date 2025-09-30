@echo off
echo ========================================
echo   Complete Database Schema Fix
echo ========================================
echo.

cd backend
echo Running complete database schema fix...
node scripts/fix-complete-schema.js

echo.
echo ========================================
echo   Complete schema fix completed!
echo ========================================
pause