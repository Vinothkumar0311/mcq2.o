@echo off
echo 🚨 Setting up Violation Management System...

echo.
echo 📊 Creating database table...
mysql -u root -p test_platform < create-violations-table.sql

echo.
echo 📦 Installing required packages...
cd backend
npm install exceljs pdfkit

echo.
echo 🔧 Adding routes to main app...
echo Adding violation routes to backend/src/index.js

echo.
echo ✅ Violation Management System setup complete!
echo.
echo 📋 Next steps:
echo 1. Add violation routes to your main app.js/index.js
echo 2. Update your admin navigation to include /admin/violations
echo 3. Test the system by triggering violations during tests
echo.
echo 🎯 Access admin violations at: http://localhost:5000/admin/violations
pause