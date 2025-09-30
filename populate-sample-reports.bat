@echo off
echo ========================================
echo   Populating Sample Test Reports
echo ========================================
echo.

cd backend
echo Adding sample test results for demonstration...
node -e "
const { sequelize } = require('./models');
const sampleData = [
  { test_id: 'test162', test_name: 'JavaScript Basics', user_email: 'test@example.com', student_name: 'Test Student', department: 'Computer Science', sin_number: 'SIN-123456', total_score: 18, max_score: 20, percentage: 90, completed_at: new Date(Date.now() - 86400000), date: new Date(Date.now() - 86400000).toLocaleDateString(), answers: JSON.stringify({1: 'A', 2: 'B', 3: 'C'}), session_id: 'session_test162_125' },
  { test_id: 'test163', test_name: 'React Components', user_email: 'test@example.com', student_name: 'Test Student', department: 'Computer Science', sin_number: 'SIN-123456', total_score: 14, max_score: 20, percentage: 70, completed_at: new Date(Date.now() - 172800000), date: new Date(Date.now() - 172800000).toLocaleDateString(), answers: JSON.stringify({1: 'D', 2: 'A', 3: 'B'}), session_id: 'session_test163_126' },
  { test_id: 'test164', test_name: 'Database Design', user_email: 'test@example.com', student_name: 'Test Student', department: 'Computer Science', sin_number: 'SIN-123456', total_score: 22, max_score: 25, percentage: 88, completed_at: new Date(Date.now() - 259200000), date: new Date(Date.now() - 259200000).toLocaleDateString(), answers: JSON.stringify({1: 'C', 2: 'D', 3: 'A'}), session_id: 'session_test164_127' },
  { test_id: 'test165', test_name: 'Python Programming', user_email: 'test@example.com', student_name: 'Test Student', department: 'Computer Science', sin_number: 'SIN-123456', total_score: 16, max_score: 20, percentage: 80, completed_at: new Date(Date.now() - 345600000), date: new Date(Date.now() - 345600000).toLocaleDateString(), answers: JSON.stringify({1: 'B', 2: 'C', 3: 'D'}), session_id: 'session_test165_128' }
];

Promise.all(sampleData.map(data => 
  sequelize.query('INSERT INTO students_results (test_id, test_name, user_email, student_name, department, sin_number, total_score, max_score, percentage, completed_at, date, answers, session_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())', 
  { replacements: [data.test_id, data.test_name, data.user_email, data.student_name, data.department, data.sin_number, data.total_score, data.max_score, data.percentage, data.completed_at, data.date, data.answers, data.session_id] })
)).then(() => {
  console.log('✅ Sample test reports populated successfully');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
"

echo.
echo ========================================
echo   Sample reports populated!
echo ========================================
pause