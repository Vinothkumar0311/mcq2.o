# Violation Management System Integration Guide

## 🎯 **SYSTEM OVERVIEW**
Complete violation management system with:
- ✅ Automatic violation detection during tests
- ✅ Admin dashboard with search, filter, block/unblock
- ✅ Excel and PDF export functionality
- ✅ Integration with existing test system
- ✅ Real-time violation logging

## 🔧 **INTEGRATION STEPS**

### **1. Database Setup**
```bash
# Run the SQL migration
mysql -u root -p test_platform < create-violations-table.sql
```

### **2. Backend Integration**

#### **Add to your main routes file (backend/src/index.js)**
```javascript
const violationRoutes = require('./routes/violationRoutes');
app.use('/api/violations', violationRoutes);
```

#### **Update models/index.js to include StudentViolation**
```javascript
// Add this line with other model imports
const StudentViolation = require('./StudentViolation')(sequelize, DataTypes);

// Add associations
StudentViolation.associate(db);
```

### **3. Frontend Integration**

#### **Add to your admin navigation**
```javascript
// In your admin layout/navigation component
{
  path: '/admin/violations',
  name: 'Violations',
  icon: AlertTriangle,
  component: AdminViolations
}
```

#### **Add route to your React Router**
```javascript
import AdminViolations from './pages/AdminViolations';

// In your router configuration
<Route path="/admin/violations" element={<AdminViolations />} />
```

### **4. Install Required Packages**
```bash
cd backend
npm install exceljs pdfkit
```

## 🚨 **AUTOMATIC VIOLATION DETECTION**

### **Types of Violations Automatically Logged:**

#### **1. Time-Based Violations**
- **Late Entry**: Student joins after 15-minute window
- **Section Timeout**: Auto-submission due to time expiry

#### **2. Access Violations**
- **Multiple Attempts**: Licensed users trying to retake tests
- **Blocked Access**: Students with active violations

#### **3. Technical Violations** (Can be added)
- **Tab Switching**: Browser focus changes during test
- **Copy-Paste Attempts**: Clipboard access detection
- **Network Issues**: Suspicious connection patterns

### **Adding Custom Violation Detection**

```javascript
// Example: Log tab switch violation
const logViolation = async (studentId, testId, type, description) => {
  await fetch('/api/violations/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId,
      testId,
      violationType: type,
      description,
      severity: 'Medium',
      evidence: { timestamp: new Date().toISOString() }
    })
  });
};

// Usage in frontend
window.addEventListener('blur', () => {
  logViolation(studentId, testId, 'TabSwitch', 'Student switched browser tab');
});
```

## 📊 **ADMIN FEATURES**

### **Dashboard Capabilities**
- **Real-time Stats**: Active, blocked, reviewed, cleared violations
- **Advanced Search**: By student name, email, test, violation type
- **Multi-level Filtering**: Type, severity, status, date range
- **Bulk Actions**: Block/unblock multiple students
- **Export Options**: Excel and PDF reports

### **Violation Management Actions**
- **Block Student**: Prevent access to all tests
- **Unblock Student**: Restore test access
- **Review Violation**: Mark as reviewed
- **Clear Violation**: Mark as resolved
- **Add Notes**: Admin comments on violations

## 🔒 **SECURITY INTEGRATION**

### **Test Eligibility Check**
The system automatically checks for blocked students:

```javascript
// In testSessionController.js (already integrated)
const isBlocked = await checkStudentBlocked(studentId);
if (isBlocked) {
  return res.status(403).json({
    error: 'Access denied: You are blocked due to test violations.'
  });
}
```

### **Result Access Control**
Blocked students cannot:
- Start new test sessions
- Access test results
- Download reports
- View test history

## 📈 **REPORTING & ANALYTICS**

### **Excel Export Includes:**
- Student details (name, email, department)
- Test information (ID, name)
- Violation details (type, severity, description)
- Timestamps and admin notes
- Status tracking

### **PDF Export Features:**
- Summary statistics
- Detailed violation list
- Student and test information
- Formatted for printing/archiving

## 🧪 **TESTING THE SYSTEM**

### **Run the Test Script**
```bash
node test-violation-system.js
```

### **Manual Testing Checklist**
- [ ] Create violation by attempting late entry
- [ ] Check admin dashboard shows violation
- [ ] Block student and verify access denied
- [ ] Unblock student and verify access restored
- [ ] Export Excel and PDF reports
- [ ] Search and filter functionality
- [ ] Real-time stats updates

## 🚀 **DEPLOYMENT CHECKLIST**

### **Database**
- [ ] Run SQL migration for violations table
- [ ] Verify table indexes are created
- [ ] Test database connections

### **Backend**
- [ ] Install required npm packages
- [ ] Add violation routes to main app
- [ ] Update model associations
- [ ] Test API endpoints

### **Frontend**
- [ ] Add admin navigation link
- [ ] Configure React routes
- [ ] Test UI components
- [ ] Verify export functionality

### **Integration**
- [ ] Test violation logging during tests
- [ ] Verify blocked student access control
- [ ] Check real-time updates
- [ ] Test search and filtering

## 🎯 **USAGE WORKFLOW**

### **For Admins:**
1. **Monitor Dashboard**: Check violation stats regularly
2. **Investigate Violations**: Review details and evidence
3. **Take Action**: Block/unblock students as needed
4. **Generate Reports**: Export for documentation
5. **Track Trends**: Identify patterns in violations

### **For Students:**
1. **Automatic Detection**: Violations logged transparently
2. **Access Control**: Blocked students see clear error messages
3. **Appeal Process**: Contact admin for violation review
4. **Restoration**: Access restored after admin clearance

## ✅ **VERIFICATION**

The system is working correctly when:
- ✅ Violations are automatically logged during tests
- ✅ Admin dashboard shows real-time violation data
- ✅ Block/unblock actions work immediately
- ✅ Blocked students cannot access tests
- ✅ Export functions generate proper reports
- ✅ Search and filtering work accurately

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**
1. **Violations not logging**: Check model associations and API routes
2. **Dashboard not loading**: Verify frontend routing and API endpoints
3. **Export not working**: Check ExcelJS and PDFKit installations
4. **Block not effective**: Verify integration in test controllers

### **Debug Commands:**
```bash
# Check database table
mysql -u root -p -e "DESCRIBE test_platform.student_violations;"

# Test API endpoints
curl -X GET http://localhost:5000/api/violations/admin/list

# Check logs
tail -f backend/logs/app.log
```

**🎉 The Violation Management System is now fully integrated and ready for production use!**