-- Add resultsReleased column to test_sessions table
ALTER TABLE test_sessions 
ADD COLUMN results_released BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Whether admin has released results for viewing';

-- Add resultsReleased column to students_results table  
ALTER TABLE students_results 
ADD COLUMN results_released BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Whether admin has released results for viewing';

-- Add indexes for better performance
ALTER TABLE test_sessions ADD INDEX idx_results_released (results_released);
ALTER TABLE students_results ADD INDEX idx_results_released (results_released);

-- Show the updated table structures
DESCRIBE test_sessions;
DESCRIBE students_results;