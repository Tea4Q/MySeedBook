import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { fontFamily, fontSize } from '@/lib/tokens';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'label' | 'caption';

interface AppTextProps {
  variant?: Variant;
  color?: string;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  numberOfLines?: number;
}

const variantStyles: Record<Variant, TextStyle> = {
  h1: { fontFamily: fontFamily.bold, fontSize: fontSize.xxl, lineHeight: fontSize.xxl * 1.2 },
  h2: { fontFamily: fontFamily.semiBold, fontSize: fontSize.xl, lineHeight: fontSize.xl * 1.25 },
  h3: { fontFamily: fontFamily.semiBold, fontSize: fontSize.lg, lineHeight: fontSize.lg * 1.3 },
  body: { fontFamily: fontFamily.regular, fontSize: fontSize.md, lineHeight: fontSize.md * 1.5 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.5 },
  label: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, lineHeight: fontSize.sm * 1.4 },
  caption: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, lineHeight: fontSize.xs * 1.4 },
};

export function AppText({ variant = 'body', color, style, children, numberOfLines }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[styles.base, variantStyles[variant], { color: color ?? colors.text }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
