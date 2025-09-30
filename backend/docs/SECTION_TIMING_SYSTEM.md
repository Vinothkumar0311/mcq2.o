# Section-Based Timing System

## Overview

The Section-Based Timing System implements strict section-by-section progression in tests, where each section has its own individual timer and students cannot return to completed sections.

## Key Features

### 1. Individual Section Timers
- Each section has its own countdown timer
- Timer starts when student enters the section
- Visual countdown with color-coded warnings (red < 5min, orange < 10min)

### 2. Automatic Progression
- When section timer expires, system automatically saves current answers
- Student is immediately moved to the next section
- No manual intervention required

### 3. Section Locking
- Completed sections are permanently locked
- Students cannot navigate back to previous sections
- Ensures fairness and prevents time manipulation

### 4. Auto-Submission
- Unanswered questions are auto-submitted with no score
- Partial answers are saved and scored appropriately
- System tracks which sections were auto-submitted

## Technical Implementation

### Database Schema Changes

#### TestSession Model Updates
```sql
-- New fields added to test_sessions table
section_start_time    DATETIME    -- When current section started
section_end_time      DATETIME    -- When current section should end  
completed_sections    JSON        -- Array of completed section indices
```

#### SectionSubmission Model Updates
```sql
-- New field added to section_submissions table
auto_submitted        BOOLEAN     -- Whether section was auto-submitted due to timeout
```

### API Endpoints

#### Section Timer Management
- `POST /api/section-timer/:testId/:studentId/start-section` - Start section timer
- `GET /api/section-timer/:testId/:studentId/timer` - Get timer status
- `POST /api/section-timer/:testId/:studentId/auto-submit` - Auto-submit expired section

#### Enhanced Test Session
- `GET /api/test-session/:testId/:studentId/current` - Returns section timing info
- `POST /api/test-session/:testId/:studentId/submit` - Handles section completion

### Frontend Implementation

#### Timer Display
```typescript
// Section-specific countdown timer
const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(0);

// Color-coded timer display
const timerColor = sectionTimeRemaining <= 300 ? 'text-red-600' : 
                  sectionTimeRemaining <= 600 ? 'text-orange-600' : 'text-blue-600';
```

#### Auto-Submission Logic
```typescript
// Automatic section timeout handling
const handleSectionTimeout = async () => {
  // Auto-submit current section
  // Move to next section or complete test
  // Show appropriate notifications
};
```

## User Experience Flow

### 1. Test Start
- Student enters test and sees Section 1
- Section timer starts automatically
- Warning message explains the section-based rules

### 2. During Section
- Countdown timer visible at all times
- Color changes as time runs low (orange at 10min, red at 5min)
- Student can submit section early or wait for auto-submission

### 3. Section Completion
- Manual submission: Immediate progression to next section
- Auto-submission: Automatic progression with notification
- Previous section becomes locked and inaccessible

### 4. Test Completion
- After final section, test is marked as completed
- Results are calculated and reports generated
- Student redirected to results page

## Configuration

### Section Duration Setup
```javascript
// When creating sections, specify duration in minutes
const section = await Section.create({
  name: 'Section 1',
  duration: 30, // 30 minutes for this section
  type: 'MCQ',
  // ... other fields
});
```

### Timer Warnings
```javascript
// Frontend timer color coding
const getTimerColor = (timeRemaining) => {
  if (timeRemaining <= 300) return 'text-red-600';    // < 5 minutes
  if (timeRemaining <= 600) return 'text-orange-600'; // < 10 minutes
  return 'text-blue-600';                             // Normal
};
```

## Benefits

### For Students
- Clear time management per section
- No confusion about overall vs section time
- Fair progression for all students
- Immediate feedback on section completion

### For Administrators
- Prevents time manipulation
- Ensures consistent test conditions
- Detailed tracking of section performance
- Automatic handling of timeouts

### For System
- Reduced server load (no complex overall timing)
- Better data integrity
- Clearer audit trails
- Simplified result calculation

## Migration and Setup

### 1. Run Database Migration
```bash
cd backend
node scripts/database/run-section-timing-migration.js
```

### 2. Test Functionality
```bash
node scripts/testing/test-section-timing.js
```

### 3. Complete Setup
```bash
# Run the complete setup script
setup-section-timing.bat
```

## Troubleshooting

### Common Issues

#### Timer Not Starting
- Check if section has valid duration
- Verify API endpoints are accessible
- Check browser console for errors

#### Auto-Submission Not Working
- Verify section end time is set correctly
- Check if frontend timer is running
- Ensure API calls are not blocked

#### Section Not Progressing
- Check if next section exists
- Verify session state in database
- Look for transaction rollback errors

### Debug Information

#### Check Session State
```sql
SELECT 
  current_section_index,
  section_start_time,
  section_end_time,
  completed_sections,
  status
FROM test_sessions 
WHERE test_id = ? AND student_id = ?;
```

#### Monitor Section Submissions
```sql
SELECT 
  section_index,
  score,
  max_score,
  time_spent,
  auto_submitted,
  submitted_at
FROM section_submissions 
WHERE test_session_id = ?
ORDER BY section_index;
```

## Best Practices

### Test Design
- Keep section durations reasonable (15-45 minutes)
- Balance question count with available time
- Provide clear section instructions
- Test the timing with sample users

### Student Communication
- Explain section-based timing before test starts
- Provide practice tests with similar timing
- Include timing information in test instructions
- Send reminders about no-return policy

### Monitoring
- Watch for frequent auto-submissions (may indicate timing issues)
- Monitor section completion rates
- Check for technical issues during peak times
- Review student feedback on timing

## Future Enhancements

### Planned Features
- Configurable warning thresholds
- Section-specific break periods
- Adaptive timing based on question difficulty
- Real-time analytics dashboard

### Possible Improvements
- Mobile-optimized timer display
- Audio warnings for time limits
- Customizable timer colors/themes
- Integration with accessibility tools