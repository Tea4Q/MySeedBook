# Test Account Setup Guide for Google Play Review

**Purpose**: Create a test account in Supabase for Google Play Store reviewers  
**Date**: November 11, 2025

## Overview

Google Play requires login credentials to review apps with authentication. This guide helps you create a dedicated test account for reviewers.

---

## Step 1: Create Test Account in Supabase

### Option A: Via Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Enter the following details:
   - **Email**: `reviewer@myseedbook.test`
   - **Password**: `ReviewTest2025!`
   - **Auto Confirm User**: ✅ Yes (important!)
5. Click **Create user**

### Option B: Via App Sign-Up Flow

1. Open your app (development or production)
2. Go to the sign-up screen
3. Create account with:
   - Email: `reviewer@myseedbook.test`
   - Password: `ReviewTest2025!`
4. Verify the email (check your email or auto-confirm in Supabase)

---

## Step 2: Pre-populate Test Data (Optional but Recommended)

To make the reviewer's experience better, add some sample data to the test account:

### Method 1: Use the App
1. Sign in with the test account
2. Add 3-5 sample seeds:
   - Tomato - Early Girl
   - Lettuce - Buttercrunch
   - Carrot - Danvers Half Long
   - Basil - Sweet Genovese
   - Cucumber - Straight Eight

3. Add 2-3 sample suppliers:
   - Burpee Seeds
   - Baker Creek Heirloom Seeds
   - Johnny's Selected Seeds

### Method 2: Direct SQL Insert (Advanced)

If you have SQL access to your Supabase database:

```sql
-- Insert sample seeds (adjust user_id to match the test account)
INSERT INTO seeds (user_id, name, type, variety, description, planting_season) 
VALUES 
  ('test-user-uuid', 'Tomato', 'Vegetable', 'Early Girl', 'Early maturing tomato variety', 'Spring'),
  ('test-user-uuid', 'Lettuce', 'Vegetable', 'Buttercrunch', 'Butterhead lettuce, heat tolerant', 'Spring'),
  ('test-user-uuid', 'Basil', 'Herb', 'Sweet Genovese', 'Classic Italian basil', 'Summer');

-- Insert sample suppliers
INSERT INTO suppliers (user_id, name, website, notes)
VALUES
  ('test-user-uuid', 'Burpee Seeds', 'https://www.burpee.com', 'Large selection, good quality'),
  ('test-user-uuid', 'Baker Creek', 'https://www.rareseeds.com', 'Heirloom varieties');
```

---

## Step 3: Test the Account

### Verify Login Works
1. Open the app
2. Sign in with:
   - Email: `reviewer@myseedbook.test`
   - Password: `ReviewTest2025!`
3. Confirm you can access all features
4. Verify sample data appears (if you added it)

### Test Key Features
- [ ] View seeds inventory
- [ ] Add a new seed
- [ ] Edit existing seed
- [ ] Delete a seed
- [ ] View calendar
- [ ] Navigate all tabs
- [ ] Sign out and sign back in

---

## Step 4: Document for Google Play Console

### For App Access Declaration in Google Play Console:

1. Go to **Google Play Console** → **Policy** → **App access**
2. Select: **"All or some functionality is restricted"**
3. Under **Instructions for app access**, enter:

```
LOGIN CREDENTIALS:
Email: reviewer@myseedbook.test
Password: ReviewTest2025!

INSTRUCTIONS:
1. Launch the app
2. Enter the email and password above
3. Tap "Sign In"
4. All features are available for testing

ALTERNATIVE - GUEST MODE:
You can also tap "Continue as Guest" on the login screen to test without an account. Guest mode has limited features but demonstrates core functionality.

NOTES:
- This is a standard free-tier account
- Premium features (Weather, Barcode Scanner) will show upgrade prompts - this is expected behavior
- The account contains sample seed and supplier data for testing
```

---

## Step 5: Maintain Test Account

### Regular Maintenance
- **Keep data current**: Refresh sample data periodically
- **Monitor usage**: Check if reviewers report issues
- **Reset password**: Update if compromised
- **Verify access**: Test login before each submission

### Password Rotation (Quarterly)
If you need to change the password:

1. Update in Supabase: **Authentication** → **Users** → Select user → **Send Password Recovery**
2. Or delete and recreate the account
3. Update Google Play Console documentation
4. Test new credentials before resubmission

---

## Alternative: Guest Mode Only

If you prefer not to provide login credentials, you can rely solely on Guest Mode:

### Update Google Play Console Documentation:

```
APP ACCESS: Guest Mode Available (No Login Required)

INSTRUCTIONS:
1. Launch the app
2. Tap "Continue as Guest" on the login screen
3. All core features are immediately available for testing

FEATURES AVAILABLE IN GUEST MODE:
- Add/edit/delete seeds (up to 10 seeds)
- Add/edit/delete suppliers (up to 5 suppliers)
- View calendar and planting schedules
- Photo uploads via camera/gallery
- Browse inventory and filter
- App settings and preferences

LIMITATIONS IN GUEST MODE:
- Data stored locally only (no cloud sync)
- Limited to free tier features
- Premium features show upgrade prompts (expected behavior)

NOTE: Guest mode demonstrates full functionality without requiring account creation. Premium features (Weather, Barcode Scanner) show upgrade prompts - this is expected behavior for free users.
```

---

## Security Best Practices

### Account Security
- ✅ Use unique password for test account only
- ✅ Don't use personal or production data
- ✅ Monitor for unusual activity
- ✅ Rotate credentials quarterly
- ✅ Document in secure location

### Data Privacy
- ✅ Use sample/fake data only
- ✅ No real personal information
- ✅ No real supplier contact details
- ✅ Mark as test account in database (optional flag)

### Access Control
- ✅ Test account has same permissions as regular user
- ✅ No admin or elevated privileges
- ✅ Cannot access other users' data
- ✅ Follows all app security policies

---

## Troubleshooting

### Cannot Create User in Supabase
**Issue**: "User already exists" error  
**Solution**: User may already exist. Check Users list or use different email

### Test Account Cannot Sign In
**Issue**: Invalid credentials error  
**Solution**: 
- Verify email confirmation status in Supabase
- Check "Auto Confirm User" was enabled
- Try password reset flow

### No Data Shows After Login
**Issue**: Empty inventory  
**Solution**: This is normal for new accounts. Add sample data manually or note in instructions that account starts empty

### Supabase Rate Limits
**Issue**: Too many sign-in attempts  
**Solution**: 
- Wait 15 minutes
- Check rate limiting settings in Supabase
- Use Guest Mode as backup access method

---

## Checklist Before Google Play Submission

- [ ] Test account created in Supabase
- [ ] Email confirmed/auto-confirmed
- [ ] Sample data added (optional but recommended)
- [ ] Login tested successfully
- [ ] All features accessible with test account
- [ ] Google Play Console updated with instructions
- [ ] Guest Mode also documented as alternative
- [ ] Credentials stored securely for future reference

---

## Quick Reference

**Test Account Email**: `reviewer@myseedbook.test`  
**Test Account Password**: `ReviewTest2025!`  
**Supabase Project**: [Your project URL]  
**Google Play Console**: Policy → App access  
**Alternative Access**: Guest Mode (tap "Continue as Guest")

---

**Created**: November 11, 2025  
**Last Updated**: November 11, 2025  
**Next Review**: February 11, 2026 (Quarterly rotation)

---

## Related Documentation
- [Google Play Reviewer Instructions](GOOGLE_PLAY_REVIEWER_INSTRUCTIONS.md)
- [Guest Login Implementation](GUEST_LOGIN_IMPLEMENTATION.md)
- [Production Checklist](../PRODUCTION_CHECKLIST.md)
