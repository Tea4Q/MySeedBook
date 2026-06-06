# Testing AI Premium Features

## 🧪 Quick Development Setup

To test AI features without purchasing premium:

1. **Open browser console** (web) or React Native debugger
2. **Import the dev helpers**:
   ```javascript
   import { devGrantAIFeatures, devCheckPremiumStatus, devRevokePremium } from './utils/devPremiumHelpers'
   ```

3. **Grant AI access for testing**:
   ```javascript
   devGrantAIFeatures(); // Grants only AI features
   // OR
   devGrantPremium(); // Grants full premium access
   ```

4. **Check your premium status**:
   ```javascript
   devCheckPremiumStatus();
   ```

5. **Return to free tier**:
   ```javascript
   devRevokePremium();
   ```

## ✅ Test Cases

### Free User Experience
1. Navigate to AI tab
2. Verify premium badges show on all features
3. Tap any AI feature → upgrade prompt should appear
4. Try voice notes in Add Seed → upgrade prompt should appear

### Premium User Experience
1. Run `devGrantAIFeatures()` or `devGrantPremium()`
2. Navigate to AI tab
3. All features should be accessible
4. Voice notes should work in Add Seed form
5. AI chat and smart shopping should be functional

### Specific Features to Test

#### AI Garden Chat
- **Free**: Shows upgrade prompt when tapped
- **Premium**: Full chat interface with OpenAI integration
- **Test**: Ask about companion planting or seed timing

#### Smart Shopping Assistant
- **Free**: Shows premium badge and upgrade prompt
- **Premium**: Generates personalized recommendations
- **Test**: Works best with several seeds in inventory

#### Voice Notes
- **Free**: Shows upgrade button in Add Seed form
- **Premium**: Full voice recording with transcription
- **Test**: Record a note, verify it appends to text field

## 🔧 Development Console Commands

```javascript
// Quick test sequence
devCheckPremiumStatus();        // Check current state
devGrantAIFeatures();          // Enable AI features
// Test features in UI
devRevokePremium();            // Return to free tier
// Test upgrade prompts
```

## 📱 Production Monetization

In production, users will:
1. See AI features with premium badges
2. Tap to see upgrade options
3. Purchase via App Store/Google Play
4. Instant access to all AI functionality

The premium integration ensures AI features drive subscription revenue while providing clear value proposition to users.

## 🚀 Testing Tips

- **Always test both free and premium flows**
- **Verify upgrade prompts are clear and compelling**
- **Check that premium features work as expected**
- **Test on both mobile and web platforms**
- **Voice features only work on mobile (not web)**