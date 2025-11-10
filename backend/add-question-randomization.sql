-- Add question randomization fields to sections table
USE test_platform;

-- Add new columns for question randomization
ALTER TABLE sections 
ADD COLUMN total_questions INT NULL COMMENT 'Total questions available in question pool',
ADD COLUMN display_questions INT NULL COMMENT 'Number of questions to display to student (random selection)',
ADD COLUMN randomize_questions BOOLEAN DEFAULT FALSE COMMENT 'Whether to randomize question order';

-- Show updated table structure
DESCRIBE sections;

SELECT 'Question randomization fields added successfully' as message;