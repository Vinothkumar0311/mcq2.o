-- Show all students with violations or plagiarism
USE test_platform;

-- Summary of all violated students
SELECT 
    student_id as 'Student ID',
    COUNT(*) as 'Total Violations',
    SUM(CASE WHEN violation_type = 'Plagiarism' THEN 1 ELSE 0 END) as 'Plagiarism Count',
    SUM(CASE WHEN violation_type IN ('TabSwitch', 'CopyPaste', 'Cheating') THEN 1 ELSE 0 END) as 'Other Violations',
    MAX(CASE WHEN status = 'Blocked' THEN 'BLOCKED' ELSE 'ACTIVE' END) as 'Status',
    MAX(created_at) as 'Latest Violation'
FROM student_violations 
WHERE violation_type IN ('Plagiarism', 'TabSwitch', 'CopyPaste', 'Cheating')
GROUP BY student_id
ORDER BY COUNT(*) DESC;

-- Detailed view of all violations
SELECT 
    student_id as 'Student',
    test_id as 'Test',
    violation_type as 'Type',
    severity as 'Severity',
    status as 'Status',
    description as 'Description',
    created_at as 'Date'
FROM student_violations 
WHERE violation_type IN ('Plagiarism', 'TabSwitch', 'CopyPaste', 'Cheating')
ORDER BY created_at DESC;