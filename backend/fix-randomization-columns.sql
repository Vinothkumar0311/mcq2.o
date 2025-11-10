USE test_platform;

ALTER TABLE sections 
ADD COLUMN total_questions INT NULL,
ADD COLUMN display_questions INT NULL,
ADD COLUMN randomize_questions BOOLEAN DEFAULT FALSE;

SELECT 'Randomization columns added successfully' as message;