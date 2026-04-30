import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableStateCallbackType,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { AppText } from './AppText';
import { spacing, radius, shadows, fontFamily, fontSize } from '@/lib/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: AppButtonProps) {
  const { colors } = useTheme();

  const getContainerStyle = (state: PressableStateCallbackType): ViewStyle => {
    const base: ViewStyle = {
      ...styles.button,
      opacity: disabled || loading ? 0.5 : state.pressed ? 0.8 : 1,
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: colors.buttonBackground };
      case 'secondary':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'danger':
        return { ...base, backgroundColor: colors.error };
    }
  };

  const getLabelColor = () => {
    switch (variant) {
      case 'primary':
        return colors.buttonText;
      case 'secondary':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      case 'danger':
        return '#FFFFFF';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={(state) => [getContainerStyle(state), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getLabelColor()} />
      ) : (
        <>
          {icon}
          <AppText
            variant="label"
            color={getLabelColor()}
            style={[styles.label, textStyle ?? {}]}
          >
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
});
