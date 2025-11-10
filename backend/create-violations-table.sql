-- Create student_violations table if it doesn't exist
USE test_platform;

CREATE TABLE IF NOT EXISTS student_violations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  test_id VARCHAR(255) NOT NULL,
  violation_type ENUM('Time', 'Plagiarism', 'TabSwitch', 'CopyPaste', 'Technical', 'Cheating') NOT NULL,
  description TEXT,
  severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
  status ENUM('Active', 'Blocked', 'Reviewed', 'Cleared') DEFAULT 'Active',
  evidence TEXT,
  admin_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_student_id (student_id),
  INDEX idx_test_id (test_id),
  INDEX idx_status (status),
  INDEX idx_violation_type (violation_type)
);

SELECT 'Student violations table created/verified successfully' as message;