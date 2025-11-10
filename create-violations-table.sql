-- Create student_violations table
CREATE TABLE IF NOT EXISTS student_violations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  test_id VARCHAR(255) NOT NULL,
  violation_type ENUM('Time','Plagiarism','TabSwitch','CopyPaste','Technical','Cheating') NOT NULL,
  description TEXT,
  severity ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  status ENUM('Active','Blocked','Reviewed','Cleared') DEFAULT 'Active',
  evidence TEXT,
  admin_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_student_id (student_id),
  INDEX idx_test_id (test_id),
  INDEX idx_status (status),
  INDEX idx_violation_type (violation_type),
  INDEX idx_created_at (created_at)
);

-- Insert sample violation data for testing
INSERT INTO student_violations (student_id, test_id, violation_type, description, severity, status, evidence) VALUES
('1', 'test_001', 'TabSwitch', 'Student switched browser tab during test', 'Medium', 'Active', '{"timestamp":"2024-01-15T10:30:00Z","userAgent":"Mozilla/5.0"}'),
('2', 'test_001', 'CopyPaste', 'Large text paste detected in coding section', 'High', 'Active', '{"pastedContent":"function solve()...","questionId":"q1"}'),
('3', 'test_002', 'Time', 'Test completed 15 minutes overtime', 'Medium', 'Reviewed', '{"timeLimit":3600,"actualTime":4500}'),
('1', 'test_002', 'Plagiarism', 'Suspicious code similarity detected', 'Critical', 'Blocked', '{"similarity":85,"confidence":0.9}'),
('4', 'test_001', 'Technical', 'Multiple device usage detected', 'High', 'Active', '{"devices":["Desktop","Mobile"],"ipChanges":2}');

SELECT 'Violations table created and sample data inserted successfully!' as Result;