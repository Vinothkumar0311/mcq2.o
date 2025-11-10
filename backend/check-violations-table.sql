-- Check if student_violations table exists and show its structure
USE test_platform;

-- Show table structure
DESCRIBE student_violations;

-- Show existing violations
SELECT * FROM student_violations ORDER BY created_at DESC LIMIT 10;

-- Show violation counts by status
SELECT status, COUNT(*) as count FROM student_violations GROUP BY status;