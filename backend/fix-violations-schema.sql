-- Fix student_violations table schema
USE test_platform;

-- Add missing columns to student_violations table
ALTER TABLE student_violations 
ADD COLUMN reviewed_by VARCHAR(255) NULL AFTER admin_notes,
ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by;

-- Add indexes for better performance
ALTER TABLE student_violations 
ADD INDEX idx_student_id (student_id),
ADD INDEX idx_test_id (test_id),
ADD INDEX idx_status (status),
ADD INDEX idx_violation_type (violation_type);

SELECT 'Student violations schema updated successfully' as message;