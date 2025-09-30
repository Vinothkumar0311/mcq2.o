@echo off
echo ========================================
echo FIXING EMAIL COLUMN CONFLICT
echo ========================================
echo.
echo This will remove the conflicting 'email' column from students_results table
echo The application uses 'user_email' column instead
echo.
pause

cd backend

echo Removing conflicting email column...
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixEmailColumn() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'test_platform'
        });

        console.log('Connected to database...');
        
        // Check if email column exists
        const [columns] = await connection.execute(
            'SHOW COLUMNS FROM students_results LIKE \"email\"'
        );
        
        if (columns.length > 0) {
            console.log('Removing conflicting email column...');
            await connection.execute('ALTER TABLE students_results DROP COLUMN email');
            console.log('✅ Email column removed successfully!');
        } else {
            console.log('ℹ️  Email column does not exist - no action needed');
        }
        
        await connection.end();
        console.log('Database connection closed.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixEmailColumn();
"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo EMAIL COLUMN FIX COMPLETED SUCCESSFULLY
    echo ========================================
    echo.
    echo ✅ Conflicting email column has been removed
    echo ✅ Application now uses user_email column only
    echo.
    echo NEXT STEPS:
    echo 1. Restart your backend server
    echo 2. Test form submission
    echo 3. Verify no more email field errors
    echo.
) else (
    echo.
    echo ❌ Fix failed. Please check the error above.
    echo.
)

pause