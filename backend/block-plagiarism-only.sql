-- Block only students who committed plagiarism
USE test_platform;

-- Show current plagiarism violations
SELECT 
    student_id as 'Student ID',
    test_id as 'Test ID', 
    status as 'Current Status',
    description as 'Description',
    created_at as 'Date'
FROM student_violations 
WHERE violation_type = 'Plagiarism'
ORDER BY created_at DESC;

-- Block only plagiarism violations
UPDATE student_violations 
SET status = 'Blocked'
WHERE violation_type = 'Plagiarism' 
AND status = 'Active';

-- Show updated status
SELECT 
    student_id as 'Student ID',
    COUNT(*) as 'Plagiarism Count',
    status as 'Status'
FROM student_violations 
WHERE violation_type = 'Plagiarism'
GROUP BY student_id, status
ORDER BY COUNT(*) DESC;