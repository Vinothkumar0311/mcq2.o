@echo off
echo Adding results_released field to database tables...

mysql -u root -p12345 -D projectinforce1 -e "
ALTER TABLE students_results ADD COLUMN IF NOT EXISTS results_released BOOLEAN DEFAULT FALSE;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS results_released BOOLEAN DEFAULT FALSE;
SELECT 'Database updated successfully' as Status;
"

echo ✅ Database migration completed!
pause