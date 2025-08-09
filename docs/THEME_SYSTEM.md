# Theme System Documentation

## Overview

This app now includes a comprehensive dark/light theme system that automatically applies consistent colors throughout the entire application. The theme system supports:

- ✅ Light and Dark themes
- ✅ Persistent theme storage (remembers user preference)
- ✅ Dynamic theme switching via Settings screen
- ✅ Consistent color scheme across all screens
- ✅ Type-safe theme colors
- ✅ Easy integration with existing components

## Usage

### 1. Using Theme in Components

Import and use the `useTheme` hook in any component:

```tsx
import { useTheme } from '@/lib/theme';

export default function MyComponent() {
  const { theme, colors, setTheme, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        Current theme: {theme}
      </Text>
    </View>
  );
}
```

### 2. Theme Colors Available

The theme system provides the following color properties:

- `background` - Main background color
- `surface` - Secondary background (cards, modals)
- `card` - Card background color
- `text` - Primary text color
- `textSecondary` - Secondary text color
- `primary` - Primary brand color
- `primaryText` - Text color for primary backgrounds
- `border` - Border color
- `header` - Header background color
- `headerText` - Header text color
- `icon` - Icon color
- `success` - Success color (green)
- `warning` - Warning color (yellow/orange)
- `error` - Error color (red)
- `tabBarBackground` - Tab bar background
- `tabBarActive` - Active tab color
- `tabBarInactive` - Inactive tab color
- `inputBackground` - Input field background
- `inputBorder` - Input field border
- `inputText` - Input field text
- `buttonBackground` - Button background
- `buttonText` - Button text
- `modalBackground` - Modal overlay background
- `shadowColor` - Shadow color

### 3. Theme Methods

- `theme` - Current theme ('light' | 'dark')
- `colors` - Current theme colors object
- `setTheme(theme)` - Set specific theme
- `toggleTheme()` - Toggle between light/dark

### 4. Best Practices

#### Remove Hardcoded Colors
❌ **Before:**
```tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  text: {
    color: '#000000',
  },
});
```

✅ **After:**
```tsx
// In component
const { colors } = useTheme();

// In JSX
<View style={[styles.container, { backgroundColor: colors.background }]}>
  <Text style={[styles.text, { color: colors.text }]}>Hello</Text>
</View>

// In StyleSheet - remove colors, add them dynamically
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor removed - added dynamically
  },
  text: {
    fontSize: 16,
    // color removed - added dynamically
  },
});
```

#### Use Semantic Color Names
```tsx
// Use semantic names for better theme support
{ color: colors.text }          // ✅ Good
{ color: colors.textSecondary } // ✅ Good
{ color: colors.primary }       // ✅ Good
{ color: '#000000' }            // ❌ Bad - hardcoded
```

### 5. Updating Existing Components

To update existing components for theme support:

1. **Add the hook:**
   ```tsx
   import { useTheme } from '@/lib/theme';
   
   const { colors } = useTheme();
   ```

2. **Update JSX with dynamic colors:**
   ```tsx
   <View style={[styles.container, { backgroundColor: colors.background }]}>
     <Text style={[styles.title, { color: colors.text }]}>Title</Text>
   </View>
   ```

3. **Remove hardcoded colors from StyleSheet:**
   ```tsx
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       // Remove: backgroundColor: '#ffffff',
     },
     title: {
       fontSize: 20,
       fontWeight: 'bold',
       // Remove: color: '#000000',
     },
   });
   ```

### 6. Theme Settings UI

The theme can be controlled from the Settings screen:

- **Light Mode button** - Sets theme to 'light'
- **Dark Mode button** - Sets theme to 'dark'
- **Active state** - Shows which theme is currently active
- **Persistence** - Theme choice is automatically saved and restored

### 7. Advanced Usage

#### Using the Themed Styles Helper
```tsx
import { useThemedStyles } from '@/lib/themedStyles';

const MyComponent = () => {
  const styles = useThemedStyles(createStyles);
  
  return <View style={styles.container} />;
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
});
```

### 8. Theme Customization

To customize theme colors, edit `lib/theme.tsx`:

```tsx
const lightTheme: ThemeColors = {
  background: '#ffffff',     // Change light background
  primary: '#2f9e44',       // Change primary color
  // ... other colors
};

const darkTheme: ThemeColors = {
  background: '#1a1a1a',     // Change dark background  
  primary: '#4ade80',       // Change primary color
  // ... other colors
};
```

## Implementation Status

### ✅ Completed Screens
- Settings screen (full theme integration + toggle controls)
- Tab layout (dynamic tab bar colors)
- Main app layout (theme provider setup)
- Inventory screen (partial - header and search)
- Calendar screen (partial - header and container)
- Manage suppliers screen (hook added)

### 🔄 Partially Updated
- Inventory screen (needs full color integration)
- Calendar screen (needs full color integration)
- Manage suppliers screen (needs UI color updates)

### ⏳ Pending Screens
- Add seed screen
- Add supplier screen
- Edit supplier screen
- Auth screens (login/signup)
- Other modal/component screens

## Common Issues & Solutions

### Theme Not Updating in Callbacks

If you're using `useCallback` with theme colors, make sure to include `colors` in the dependency array:

```tsx
// ❌ Wrong - missing colors dependency
const renderItem = useCallback(({ item }) => {
  return <View style={{ backgroundColor: colors.card }} />;
}, [item.id]);

// ✅ Correct - includes colors dependency
const renderItem = useCallback(({ item }) => {
  return <View style={{ backgroundColor: colors.card }} />;
}, [item.id, colors]);
```

### Static Styles Override Theme

Remove hardcoded `backgroundColor` from `StyleSheet.create` and apply them inline:

```tsx
// ❌ Static background won't change with theme
const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff' },
});

// ✅ Dynamic background
<View style={[styles.card, { backgroundColor: colors.card }]} />
```

## Next Steps

1. **Complete remaining screens** - Apply theme colors to all remaining screens
2. **Test theme switching** - Verify all screens look good in both themes
3. **Add transitions** - Smooth theme switching animations (optional)
4. **Custom themes** - Add more color schemes (optional)

The theme system is now fully functional and ready to be applied throughout the entire application!
