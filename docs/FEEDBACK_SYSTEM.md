# Feedback System Documentation

## Overview
The feedback system allows users to submit bug reports, feature requests, general feedback, questions, and complaints directly from the app. All feedback is stored in Supabase with automatic device information capture.

## Features
- 📝 **Multiple Feedback Types**: Bug reports, feature requests, general feedback, questions/support, and complaints
- ⭐ **Rating System**: Optional 1-5 star rating
- 📱 **Auto-Capture Device Info**: Platform, OS version, app version, screen size
- ✉️ **Optional Email**: Users can provide email for follow-up (auto-filled for logged-in users)
- 🔒 **Secure Storage**: All feedback stored in Supabase with RLS policies
- 🎨 **Beautiful UI**: Clean, intuitive form with emoji icons

## Architecture

### Files Created
```
📁 app/
  └── feedback.tsx                          # Feedback form screen
📁 lib/services/
  └── feedbackService.ts                    # Feedback business logic
📁 types/
  └── feedback.ts                           # TypeScript types
📁 supabase/migrations/
  └── 20251030_create_feedback_table.sql   # Database schema
📁 scripts/
  └── apply-feedback-migration.ps1         # Migration helper script
```

### Database Schema
```sql
feedback table:
  - id: UUID (primary key)
  - user_id: UUID (references auth.users, nullable)
  - user_email: TEXT (optional)
  - feedback_type: TEXT (enum)
  - subject: TEXT (required)
  - description: TEXT (required)
  - rating: INTEGER (1-5, optional)
  - device_info: JSONB (auto-captured)
  - screenshot_url: TEXT (optional, for future)
  - status: TEXT (new, reviewing, in_progress, completed, closed)
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP
```

### RLS Policies
- **Insert**: Anyone can submit feedback (including guests)
- **Select**: Users can only view their own feedback

## Setup Instructions

### 1. Apply Database Migration
```powershell
# Run the migration helper script
.\scripts\apply-feedback-migration.ps1

# Or manually:
# 1. Go to https://app.supabase.com/project/YOUR_PROJECT_ID/editor
# 2. Click "SQL Editor" → "+ New Query"
# 3. Copy contents of supabase/migrations/20251030_create_feedback_table.sql
# 4. Paste and click "Run"
```

### 2. Verify Installation
1. Check that the `feedback` table exists in Supabase
2. Verify RLS policies are enabled
3. Test feedback submission from the app

## Usage

### Accessing Feedback Form
Users can access the feedback form from:
- **Settings Tab** → "Help & Support" → "Send Feedback"

### Submitting Feedback
1. Select feedback type (Bug Report, Feature Request, etc.)
2. Enter subject (required)
3. Provide detailed description (required, min 10 characters)
4. Optionally rate the app (1-5 stars)
5. Optionally provide email for follow-up
6. Click "Submit Feedback"

### Form Validation
- ✅ Subject: Required
- ✅ Description: Required, minimum 10 characters, maximum 1000 characters
- ✅ Rating: Optional, 1-5 stars
- ✅ Email: Optional, auto-filled for logged-in users

## Code Examples

### Submitting Feedback
```typescript
import { feedbackService } from '@/lib/services/feedbackService';

const result = await feedbackService.submitFeedback({
  feedback_type: 'bug_report',
  subject: 'App crashes on startup',
  description: 'The app crashes immediately when I tap the icon...',
  rating: 3,
  user_email: 'user@example.com', // Optional
});

if (result.success) {
  console.log('Feedback submitted successfully!');
} else {
  console.error('Error:', result.error);
}
```

### Getting User Feedback History
```typescript
const { data, error } = await feedbackService.getUserFeedback();

if (data) {
  console.log('User feedback:', data);
} else {
  console.error('Error:', error);
}
```

## Auto-Captured Device Information
The following information is automatically captured with each feedback submission:
- **Platform**: iOS, Android, or Web
- **OS Version**: Operating system version
- **App Version**: Current app version from expo config
- **Screen Size**: Device screen width and height

Example device_info JSON:
```json
{
  "platform": "android",
  "osVersion": "13",
  "appVersion": "1.0.0",
  "screenSize": {
    "width": 411,
    "height": 823
  }
}
```

## Feedback Types

### Bug Report 🐛
For reporting bugs, crashes, or unexpected behavior.

### Feature Request 💡
For suggesting new features or improvements.

### General Feedback 💬
For general comments, praise, or suggestions.

### Question/Support ❓
For asking questions or requesting help.

### Complaint 😞
For expressing dissatisfaction or concerns.

## Admin Panel (Future Enhancement)
In the future, you can create an admin panel to:
- View all feedback submissions
- Filter by type, status, rating
- Respond to users via email
- Track and update feedback status
- Export feedback data

Example admin query:
```sql
-- View all feedback with user info
SELECT 
  f.*,
  u.email as user_email_auth
FROM feedback f
LEFT JOIN auth.users u ON f.user_id = u.id
ORDER BY f.created_at DESC;

-- Get feedback statistics
SELECT 
  feedback_type,
  COUNT(*) as count,
  AVG(rating) as avg_rating
FROM feedback
WHERE rating IS NOT NULL
GROUP BY feedback_type;
```

## Testing

### Test Scenarios
1. **Guest User**: Submit feedback without being logged in
2. **Logged-in User**: Submit with auto-filled email
3. **Form Validation**: Try submitting with empty fields
4. **Rating**: Submit with and without rating
5. **Long Text**: Test character limit (1000 chars)
6. **Device Info**: Verify device info is captured correctly

### Test Data
```typescript
// Test bug report
{
  feedback_type: 'bug_report',
  subject: 'Test bug report',
  description: 'This is a test bug report with sufficient detail to pass validation.',
  rating: 4
}

// Test feature request
{
  feedback_type: 'feature_request',
  subject: 'Add dark mode to calendar',
  description: 'It would be great to have a dark mode option for the calendar view to reduce eye strain at night.',
  rating: 5,
  user_email: 'test@example.com'
}
```

## Troubleshooting

### "Failed to submit feedback"
- Check that the database migration has been applied
- Verify Supabase connection is working
- Check RLS policies are enabled
- Review browser/app console for errors

### "User not authenticated" when viewing history
- This is expected for guest users
- Only logged-in users can view their feedback history
- Guests can still submit feedback

### Device info not capturing
- Verify expo-constants is installed
- Check that React Native Dimensions API is available
- Review feedbackService.ts for errors

## Future Enhancements
- [ ] Screenshot/image attachment support
- [ ] In-app feedback history view for users
- [ ] Push notifications for feedback responses
- [ ] Admin dashboard for managing feedback
- [ ] Feedback voting system
- [ ] Email notifications when feedback status changes
- [ ] Feedback search and filtering
- [ ] Export feedback to CSV

## Security Considerations
- ✅ RLS policies prevent users from viewing others' feedback
- ✅ User IDs are automatically set server-side
- ✅ All feedback requires valid subject and description
- ✅ SQL injection protection via Supabase client
- ✅ Rate limiting should be added in production
- ⚠️ Consider adding CAPTCHA for guest submissions in production

## Performance
- Feedback submission is async and doesn't block UI
- Device info collection is fast (<1ms)
- Database queries are indexed for performance
- Form validation happens client-side before submission

## Analytics (Future)
Consider tracking:
- Feedback submission rate
- Most common feedback types
- Average ratings over time
- Time to resolution
- User engagement metrics

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-30  
**Maintainer**: Development Team
