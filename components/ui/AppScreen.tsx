import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // R3: correct import
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'; // R2
import { useTheme } from '@/lib/theme';
import { spacing, screenMaxWidth } from '@/lib/tokens';

interface AppScreenProps {
  children: React.ReactNode;
  /** Enable scrolling with keyboard-aware behaviour */
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Limit content width for tablets and centre it (R4) */
  maxWidth?: boolean;
}

export function AppScreen({
  children,
  scrollable = false,
  style,
  contentStyle,
  maxWidth = false,
}: AppScreenProps) {
  const { colors } = useTheme();

  const centeredContent = maxWidth ? styles.centeredContent : undefined;

  if (scrollable) {
    // R2: KeyboardAwareScrollView handles Android keyboard correctly
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }, style]}>
        <KeyboardAwareScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={[styles.scrollContent, centeredContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid
          extraScrollHeight={16}
        >
          {children}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }

  // R2: KeyboardAvoidingView for non-scroll screens
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }, style]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.flex, centeredContent, contentStyle]}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  centeredContent: {
    maxWidth: screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
});
