import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, radius, shadows } from '@/lib/tokens';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Remove default padding (e.g. for full-bleed image headers) */
  noPadding?: boolean;
}

export function AppCard({ children, style, noPadding = false }: AppCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadowColor,
        },
        noPadding ? styles.noPadding : styles.withPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  withPadding: {
    padding: spacing.md,
  },
  noPadding: {
    overflow: 'hidden',
  },
});
