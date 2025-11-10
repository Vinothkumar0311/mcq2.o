require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./models");
const initializeDatabase = require('../init-db');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  // credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Core Routes
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const questionRoutes = require('./routes/questionRoutes');
const questionBankRoutes = require('./routes/questionBankRoutes');
const answerRoutes = require('./routes/answerRoutes');

// Feature Routes
const codingRoutes = require('./routes/codingRoutes');
const codeTestRoutes = require('./routes/codeTestRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const passcodeRoutes = require('./routes/passcodeRoutes');
const licenseRoutes = require('./routes/licenseRoutes');

// Student Routes
const studentReportsRoutes = require('./routes/studentReportsRoutes');
const studentReportStorageRoutes = require('./routes/studentReportStorageRoutes');
const studentDashboardRoutes = require('./routes/studentDashboardRoutes');
const studentTestRoutes = require('./routes/studentTestRoutes');
const studentTestResultRoutes = require('./routes/studentTestResultRoutes');
const testResultRoutes = require('./routes/testResultRoutes');
const testResultsRoutes = require('./routes/testResultsRoutes');
const codingInterfaceRoutes = require('./routes/codingInterfaceRoutes');
const simpleTestResultRoutes = require('./routes/simpleTestResultRoutes');

// Admin Routes
const adminReportRoutes = require('./routes/adminReportRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const testAssignmentRoutes = require('./routes/testAssignmentRoutes');

// System Routes
const testSessionRoutes = require('./routes/testSessionRoutes');
const sectionTimerRoutes = require('./routes/sectionTimerRoutes');
const autoSaveRoutes = require('./routes/autoSaveRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminResultReleaseRoutes = require('./routes/adminResultReleaseRoutes');
const testProgressRoutes = require('./routes/testProgressRoutes');
const comprehensiveReportRoutes = require('./routes/comprehensiveReportRoutes');
const violationRoutes = require('./routes/violationRoutes');
const testEligibilityRoutes = require('./routes/testEligibilityRoutes');
// Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/answers', answerRoutes);

// Feature Routes
app.use('/api/coding', codingRoutes);
app.use('/api/code-test', codeTestRoutes);
app.use('/api/coding-reports', require('./routes/codingReportsRoutes'));
app.use('/api/student-reports', require('./routes/studentReportRoutes'));
app.use('/api/test-reports', require('./routes/testReportRoutes'));
app.use('/api/practice', practiceRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/passcode', passcodeRoutes);
app.use('/api/license', licenseRoutes);

// Student Routes
app.use('/api/student', studentReportsRoutes);
app.use('/api/student', studentReportStorageRoutes);
app.use('/api/student', studentTestResultRoutes);
app.use('/api/student', simpleTestResultRoutes);
app.use('/api/student/tests', studentTestRoutes);
app.use('/api/student-dashboard', studentDashboardRoutes);
app.use('/api/coding-interface', codingInterfaceRoutes);

// Admin Routes
app.use('/api/admin', adminReportRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/test-assignments', testAssignmentRoutes);

// System Routes
app.use('/api/test-session', testSessionRoutes);
app.use('/api/section-timer', sectionTimerRoutes);
app.use('/api/auto-save', autoSaveRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin/results', adminResultReleaseRoutes);
app.use('/api/test-progress', testProgressRoutes);
app.use('/api/comprehensive-report', comprehensiveReportRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/test-eligibility', testEligibilityRoutes);
app.use('/api/test-completion', require('./routes/testCompletionRoutes'));
app.use('/api/test-result', testResultRoutes);
app.use('/api/test-results', testResultsRoutes);
app.use('/api/pdf-report', require('./routes/pdfReportRoutes'));
app.use('/api/excel-report', require('./routes/excelReportRoutes'));
app.use('/api/load-test', require('./routes/loadTestRoutes'));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Load test routes
app.use('/api/test-results', require('./routes/loadTestRoutes'));

// Health check route
app.get("/", (req, res) => {
  return res.json({ 
    status: "Server is running",
    timestamp: new Date().toISOString(),
    port: 5000
  });
});

// API health check
app.get("/api/health", (req, res) => {
  return res.json({ 
    status: "API is working",
    database: "connected",
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database and models
    await initializeDatabase();
    console.log("✅ Database initialized");

    const PORT = process.env.PORT || 5000;
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log("🔑 Database-backed passcode system ready");
      console.log("🌐 CORS enabled for frontend connections");
      console.log("✅ All routes registered and ready");
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('🔧 Attempting to kill existing process...');
        require('child_process').exec(`lsof -ti:${PORT} | xargs kill -9`, (err) => {
          if (!err) {
            console.log('✅ Killed existing process, restarting...');
            setTimeout(() => {
              app.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 Server restarted on http://localhost:${PORT}`);
              });
            }, 1000);
          } else {
            console.log(`💡 Try: lsof -ti:${PORT} | xargs kill -9`);
            console.log('💡 Or change PORT in .env file');
          }
        });
      } else {
        console.error('❌ Server error:', error);
      }
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.log('🔧 Database connection failed. Please check:');
      console.log('- MySQL server is running');
      console.log('- Database "test_platform" exists');
      console.log('- Credentials in .env file are correct');
    }
    
    process.exit(1);
  }
}

startServer();