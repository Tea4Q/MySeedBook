import { useTheme } from './theme';
import { StyleSheet } from 'react-native';

/**
 * Hook to create theme-aware styles
 * Usage: const styles = useThemedStyles(createStyles);
 * where createStyles is a function that takes colors and returns a StyleSheet
 */
export function useThemedStyles<T>(
  createStyles: (colors: ReturnType<typeof useTheme>['colors']) => T
): T {
  const { colors } = useTheme();
  return createStyles(colors);
}

/**
 * Helper function to create dynamic styles
 * Usage: const styles = createThemedStyles((colors) => StyleSheet.create({...}));
 */
export function createThemedStyles<T>(
  styleFunction: (colors: ReturnType<typeof useTheme>['colors']) => T
) {
  return styleFunction;
}
