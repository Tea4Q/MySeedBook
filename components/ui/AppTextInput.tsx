import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { useTheme } from '@/lib/theme';
import { AppText } from './AppText';
import { spacing, radius, fontFamily, fontSize } from '@/lib/tokens';

interface AppTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

export function AppTextInput({
  label,
  error,
  hint,
  containerStyle,
  rightElement,
  ...inputProps
}: AppTextInputProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.inputText, fontFamily: fontFamily.regular, fontSize: fontSize.md }]}
          placeholderTextColor={colors.textSecondary}
          {...inputProps}
        />
        {rightElement}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.error} style={styles.helper}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.helper}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    includeFontPadding: false,
  },
  helper: {
    marginTop: spacing.xs,
  },
});
