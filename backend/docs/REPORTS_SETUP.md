# Reports Functionality Setup Guide

## Quick Setup

Run the complete setup script:
```bash
setup-reports-complete.bat
```

This will:
1. Install all dependencies
2. Initialize the database
3. Seed sample test data
4. Set up the reports functionality

## Manual Setup

If you prefer to set up manually:

### 1. Backend Setup
```bash
cd backend
npm install
npm run init-db
npm run seed-data
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Features Fixed

### Student Reports (`/student/reports`)
- ✅ Test history display
- ✅ Performance statistics (total tests, average score, completion rate, best score)
- ✅ Individual test report downloads
- ✅ Overall performance report download
- ✅ Auto-refresh every 30 seconds
- ✅ Proper error handling for empty data

### Admin Reports (`/admin/reports`)
- ✅ Overview statistics dashboard
- ✅ Live activity monitoring
- ✅ Top performers list
- ✅ Recent reports display
- ✅ Report generation functionality
- ✅ Time period filtering
- ✅ Auto-refresh every 30 seconds

## Sample Data Created

The setup creates:
- **5 Students**: student1@demo.com to student5@demo.com
- **3 Tests**: TEST-1, TEST-2, TEST-3
- **15 Test Sessions**: Each student has completed all 3 tests with random scores (60-95%)

## API Endpoints

### Student Reports
- `GET /api/student/test-history/:studentId` - Get student test history
- `GET /api/student/download-report/:sessionId` - Download individual test report
- `GET /api/student/overall-report/:studentId` - Download overall performance report

### Admin Reports
- `GET /api/reports/overview?period=last30days` - Get overview statistics
- `GET /api/reports/student-performance?limit=5` - Get top performers
- `GET /api/reports/recent` - Get recent reports
- `GET /api/reports/live-activity` - Get live activity data
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/download/:reportId` - Download report file

## Database Tables Used

- **Tests**: Test definitions
- **TestSessions**: Student test attempts and scores
- **LicensedUsers**: Student information
- **Licenses**: User access control

## Troubleshooting

### No Data Showing
1. Ensure the database is running (MySQL)
2. Run the data seeder: `npm run seed-data`
3. Check browser console for API errors
4. Verify backend is running on port 5000

### Download Issues
- Downloads are currently text files (.txt format)
- Check browser's download folder
- Ensure popup blockers are disabled

### Performance Issues
- Auto-refresh can be disabled by modifying the frontend code
- Reduce the refresh interval if needed
- Check database performance with large datasets

## Next Steps

To enhance the reports functionality:
1. Add PDF generation for professional reports
2. Implement Excel export functionality
3. Add more detailed analytics and charts
4. Create custom report templates
5. Add email report delivery

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review backend logs for API errors
3. Ensure all dependencies are installed
4. Verify database connection and data