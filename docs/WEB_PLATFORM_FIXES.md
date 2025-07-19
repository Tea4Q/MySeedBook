# Web Platform Fixes

## Issues Fixed

### 1. React Native Gesture Handler Error on Web
**Error**: `Uncaught Error: Element.setPointerCapture: Invalid pointer id`

**Root Cause**: React Native Gesture Handler tries to capture pointer events that don't exist properly on web platforms.

**Solution**: 
- Conditionally wrap `GestureHandlerRootView` only for mobile platforms
- On web, render components directly without gesture handler wrapper

**Files Modified**: 
- `app/_layout.tsx` - Conditional GestureHandlerRootView wrapper
- `app/(tabs)/index.tsx` - Conditional Swipeable components

### 2. Swipeable Components on Web
**Issue**: Swipeable gesture components causing web compatibility issues

**Solution**:
- Conditionally render `Swipeable` components only on mobile platforms
- On web, render the content directly without swipe functionality
- Updated `closeAllSwipeables` function to handle web case

## Changes Made

### app/_layout.tsx
```tsx
// Before: Always wrapped with GestureHandlerRootView
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// After: Conditional wrapping based on platform
export default function RootLayout() {
  const AppContent = (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );

  if (Platform.OS === 'web') {
    return AppContent;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {AppContent}
    </GestureHandlerRootView>
  );
}
```

### app/(tabs)/index.tsx
```tsx
// Before: Always wrapped with Swipeable
return (
  <Swipeable>
    <Pressable>...</Pressable>
  </Swipeable>
);

// After: Conditional wrapping
const seedItemContent = (<Pressable>...</Pressable>);

if (Platform.OS === 'web') {
  return seedItemContent;
}

return (
  <Swipeable>
    {seedItemContent}
  </Swipeable>
);
```

## Authentication Control Added

Added authentication bypass controls in `app/_layout.tsx`:

```tsx
const byPassAuthForTesting = false; // Set to true to skip all authentication
const byPassWebAuth = false; // Set to true to skip authentication on web only
```

## Testing

1. **Web**: Visit `http://localhost:8081`
2. **Mobile**: Use Expo Go app with QR code
3. **Gesture Issues**: Should be resolved on web, swipe still works on mobile

## Notes

- Swipe-to-delete functionality is only available on mobile platforms
- All other features work identically across platforms
- Authentication flow works on both web and mobile
