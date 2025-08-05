# MySeedBook Catalogue - Theme Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Theme System Architecture](#theme-system-architecture)
- [Color Palette](#color-palette)
- [Implementation Guide](#implementation-guide)
- [Component Examples](#component-examples)
- [Best Practices](#best-practices)
- [Platform-Specific Considerations](#platform-specific-considerations)
- [Accessibility](#accessibility)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

---

## 📖 Overview

MySeedBook Catalogue uses a comprehensive theme system that provides light and dark mode support across all platforms (Web, iOS, Android). The theme system is built with React Context and AsyncStorage for persistence.

**Key Features:**
- 🌓 Light and Dark mode support
- 💾 Persistent theme selection
- 🎨 Comprehensive color palette
- 📱 Platform-specific optimizations
- ♿ Accessibility compliance

---

## 🏗 Theme System Architecture

### Core Components

```tsx
// lib/theme.tsx
- ThemeProvider: Context provider component
- useTheme: Hook for accessing theme
- ThemeColors: Interface defining all color tokens
- lightTheme & darkTheme: Color definitions
```

### Theme Context Structure

```tsx
interface ThemeContextType {
  theme: Theme;           // 'light' | 'dark'
  colors: ThemeColors;    // Current color palette
  toggleTheme: () => void;  // Switch between themes
  setTheme: (theme: Theme) => void; // Set specific theme
}
```

---

## 🎨 Color Palette

### Light Theme Colors

| Category | Token | Color | Usage |
|----------|-------|-------|-------|
| **Backgrounds** | `background` | `#ffffff` | Main app background |
| | `surface` | `#f8f9fa` | Cards, elevated surfaces |
| | `card` | `#ffffff` | Card backgrounds |
| **Text** | `text` | `#212529` | Primary text |
| | `textSecondary` | `#495057` | Secondary text |
| **Primary** | `primary` | `#2f9e44` | Brand color, buttons |
| | `primaryText` | `#ffffff` | Text on primary color |
| **Borders** | `border` | `#e9ecef` | Dividers, borders |
| **Feedback** | `success` | `#8ce99a` | Success states |
| | `warning` | `#ffec99` | Warning states |
| | `error` | `#ff8787` | Error states |
| **Navigation** | `tabBarBackground` | `#262A2B` | Tab bar background |
| | `tabBarActive` | `#BCAB92` | Active tab |
| | `tabBarInactive` | `#8B8776` | Inactive tab |
| **Inputs** | `inputBackground` | `#ffffff` | Input backgrounds |
| | `inputBorder` | `#e0e0e0` | Input borders |
| | `inputText` | `#333333` | Input text |

### Dark Theme Colors

| Category | Token | Color | Usage |
|----------|-------|-------|-------|
| **Backgrounds** | `background` | `#1a1a1a` | Main app background |
| | `surface` | `#2d2d2d` | Cards, elevated surfaces |
| | `card` | `#2d2d2d` | Card backgrounds |
| **Text** | `text` | `#ffffff` | Primary text |
| | `textSecondary` | `#b3b3b3` | Secondary text |
| **Primary** | `primary` | `#4ade80` | Brand color, buttons |
| | `primaryText` | `#000000` | Text on primary color |
| **Borders** | `border` | `#404040` | Dividers, borders |
| **Feedback** | `success` | `#22c55e` | Success states |
| | `warning` | `#f59e0b` | Warning states |
| | `error` | `#ef4444` | Error states |
| **Navigation** | `tabBarBackground` | `#1a1a1a` | Tab bar background |
| | `tabBarActive` | `#4ade80` | Active tab |
| | `tabBarInactive` | `#666666` | Inactive tab |
| **Inputs** | `inputBackground` | `#404040` | Input backgrounds |
| | `inputBorder` | `#555555` | Input borders |
| | `inputText` | `#ffffff` | Input text |

---

## 🛠 Implementation Guide

### 1. Setup Theme Provider

Wrap your app with the ThemeProvider:

```tsx
// app/_layout.tsx
import { ThemeProvider } from '@/lib/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### 2. Using Theme in Components

```tsx
import { useTheme } from '@/lib/theme';

export default function MyComponent() {
  const { colors, theme, toggleTheme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        Hello World
      </Text>
      <Pressable 
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={toggleTheme}
      >
        <Text style={[styles.buttonText, { color: colors.primaryText }]}>
          Switch Theme
        </Text>
      </Pressable>
    </View>
  );
}
```

### 3. Dynamic Styling Pattern

```tsx
// Create styles that adapt to theme
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  text: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    color: colors.inputText,
  },
});

// In component:
const styles = createStyles(colors);
```

---

## 🧩 Component Examples

### Basic Screen Layout

```tsx
export default function MyScreen() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>
          Screen Title
        </Text>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Card Title
          </Text>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Card content goes here
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
```

### Input Components

```tsx
export default function ThemedTextInput({ placeholder, value, onChangeText }) {
  const { colors } = useTheme();
  
  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.inputBackground,
          borderColor: colors.inputBorder,
          color: colors.inputText,
        }
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
    />
  );
}
```

### Button Components

```tsx
export default function ThemedButton({ title, onPress, variant = 'primary' }) {
  const { colors } = useTheme();
  
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          color: colors.primaryText,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          color: colors.primaryText,
        };
      default:
        return {
          backgroundColor: colors.primary,
          color: colors.primaryText,
        };
    }
  };
  
  const buttonStyles = getButtonStyles();
  
  return (
    <Pressable
      style={[styles.button, { backgroundColor: buttonStyles.backgroundColor }]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, { color: buttonStyles.color }]}>
        {title}
      </Text>
    </Pressable>
  );
}
```

---

## ✅ Best Practices

### 1. Always Use Theme Colors

❌ **Don't do this:**
```tsx
<View style={{ backgroundColor: '#ffffff' }}>
  <Text style={{ color: '#000000' }}>Hello</Text>
</View>
```

✅ **Do this:**
```tsx
<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Hello</Text>
</View>
```

### 2. Use Semantic Color Names

❌ **Avoid hardcoded colors:**
```tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2f9e44', // What is this color for?
  },
});
```

✅ **Use semantic names:**
```tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary, // Clear purpose
  },
});
```

### 3. Consistent Color Usage

- Use `colors.text` for primary text
- Use `colors.textSecondary` for secondary text
- Use `colors.primary` for brand elements
- Use `colors.surface` for elevated elements
- Use `colors.border` for dividers and borders

### 4. Handle Edge Cases

```tsx
// Provide fallbacks for undefined colors
const safeColor = colors.customColor || colors.text;

// Handle platform differences
const shadowColor = Platform.OS === 'ios' ? colors.shadowColor : 'transparent';
```

---

## 📱 Platform-Specific Considerations

### Web Platform

```tsx
// Web-specific theme handling
if (Platform.OS === 'web') {
  // Update CSS custom properties for web
  document.documentElement.style.setProperty('--primary-color', colors.primary);
}
```

### iOS Platform

```tsx
// iOS status bar styling
<StatusBar 
  barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
  backgroundColor={colors.background}
/>
```

### Android Platform

```tsx
// Android navigation bar
import { NavigationBar } from 'expo-navigation-bar';

NavigationBar.setBackgroundColorAsync(colors.background);
```

---

## ♿ Accessibility

### Color Contrast

Ensure proper contrast ratios:
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **Interactive elements**: 3:1 minimum

### Testing Colors

```tsx
// Test contrast ratios
const testContrast = (foreground: string, background: string) => {
  // Use contrast checking libraries
  return getContrastRatio(foreground, background) >= 4.5;
};
```

### High Contrast Support

```tsx
// Detect high contrast mode
const isHighContrast = AccessibilityInfo.isHighContrastEnabled();

const accessibleColors = isHighContrast 
  ? highContrastTheme 
  : colors;
```

---

## 🚀 Advanced Usage

### Custom Themes

```tsx
// Create custom theme variants
const springTheme: ThemeColors = {
  ...lightTheme,
  primary: '#10b981', // Spring green
  success: '#84cc16', // Lime green
};

// Extend theme context
type CustomTheme = 'light' | 'dark' | 'spring';
```

### Theme Transitions

```tsx
// Smooth theme transitions
const [isTransitioning, setIsTransitioning] = useState(false);

const smoothToggleTheme = () => {
  setIsTransitioning(true);
  setTimeout(() => {
    toggleTheme();
    setIsTransitioning(false);
  }, 150);
};
```

### Dynamic Theme Colors

```tsx
// Generate theme variations
const generateThemeVariant = (baseColor: string, variant: 'lighter' | 'darker') => {
  // Use color manipulation library
  return variant === 'lighter' 
    ? lighten(baseColor, 0.1)
    : darken(baseColor, 0.1);
};
```

---

## 🛠 Troubleshooting

### Common Issues

#### 1. Theme Not Persisting

**Problem**: Theme resets on app restart
**Solution**: Check AsyncStorage permissions and error handling

```tsx
// Add proper error handling
const loadTheme = async () => {
  try {
    const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      setThemeState(savedTheme as Theme);
    }
  } catch (error) {
    console.error('Failed to load theme:', error);
    // Fallback to system theme or default
  }
};
```

#### 2. Colors Not Updating

**Problem**: Some components don't update when theme changes
**Solution**: Ensure proper useTheme hook usage

```tsx
// Make sure component re-renders on theme change
const { colors } = useTheme();

// Use useEffect if needed
useEffect(() => {
  // Update non-React Native elements
  updateWebStyles(colors);
}, [colors]);
```

#### 3. Performance Issues

**Problem**: Theme switching is slow
**Solution**: Optimize re-renders

```tsx
// Memoize expensive theme calculations
const memoizedColors = useMemo(() => {
  return computeThemeColors(theme);
}, [theme]);

// Avoid inline style objects
const styles = useMemo(() => 
  createStyles(colors), [colors]
);
```

---

## 📊 Theme Implementation Checklist

### Basic Implementation
- [ ] ThemeProvider wraps app
- [ ] useTheme hook imported in components
- [ ] Background colors use theme
- [ ] Text colors use theme
- [ ] Border colors use theme

### Component Theming
- [ ] Headers themed
- [ ] Navigation themed
- [ ] Buttons themed
- [ ] Input fields themed
- [ ] Cards themed
- [ ] Modals themed

### Advanced Features
- [ ] Theme persistence working
- [ ] Smooth theme transitions
- [ ] Platform-specific optimizations
- [ ] Accessibility compliance
- [ ] Custom theme variants (optional)

### Testing
- [ ] Light theme displays correctly
- [ ] Dark theme displays correctly
- [ ] Theme switching works
- [ ] Colors persist across app restarts
- [ ] All screens support both themes

---

## 🎯 Quick Reference

### Essential Hook Usage
```tsx
const { theme, colors, toggleTheme, setTheme } = useTheme();
```

### Most Used Colors
```tsx
colors.background    // Main backgrounds
colors.text         // Primary text
colors.textSecondary // Secondary text
colors.primary      // Brand color
colors.surface      // Cards, elevated elements
colors.border       // Dividers, borders
colors.inputBackground // Input fields
colors.inputText    // Input text
```

### Common Patterns
```tsx
// Dynamic background
style={{ backgroundColor: colors.background }}

// Dynamic text
style={{ color: colors.text }}

// Dynamic borders
style={{ borderColor: colors.border }}

// Theme-aware shadows
shadowColor: colors.shadowColor,
```

---

*Last Updated: August 4, 2025*  
*Version: 1.0*  
*Compatible with: MySeedBook Catalogue v1.0*
