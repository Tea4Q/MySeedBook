import { Tabs } from 'expo-router';
import {
  Sprout as Seed,
  Tractor,
  Calendar,
  Settings,
  Users,
  CloudRain,
  Brain,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// import { Slot } from 'expo-router';
// // This is the root layout for the app, which will render the tabs.
// // It uses the `expo-router` library to define the layout and navigation structure.
// const RootLayout = () => {
//   return (
//     <Slot />
//   );
// }
// export { RootLayout as default };

type AnimatedTabButtonProps = {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  activeTintColor: string;
  inactiveTintColor: string;
  selected: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
};

function AnimatedTabButton({
  label,
  icon: Icon,
  activeTintColor,
  inactiveTintColor,
  selected,
  onPress,
  onLongPress,
  accessibilityLabel,
}: AnimatedTabButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const progress = React.useRef(new Animated.Value(selected ? 1 : 0)).current;

  const shouldExpand = selected || isHovered || isPressed;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: shouldExpand ? 1 : 0,
      duration: shouldExpand ? 220 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, shouldExpand]);

  const tintColor = selected ? activeTintColor : inactiveTintColor;
  const containerWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 132],
  });
  const labelOpacity = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.2, 1],
  });
  const labelTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onLongPress={onLongPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={styles.buttonPressable}
    >
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            width: containerWidth,
            backgroundColor: selected
              ? `${activeTintColor}22`
              : 'transparent',
            borderColor: selected ? `${activeTintColor}66` : 'transparent',
          } as ViewStyle,
        ]}
      >
        <View style={styles.iconWrap}>
          <Icon size={22} color={tintColor} />
        </View>

        <Animated.View
          style={[
            styles.labelWrap,
            {
              opacity: labelOpacity,
              transform: [{ translateX: labelTranslate }],
            },
          ]}
        >
          <Text style={[styles.labelText, { color: tintColor }]} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

type TabButtonFactoryProps = {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  activeTintColor: string;
  inactiveTintColor: string;
};

function createAnimatedTabButton({
  label,
  icon,
  activeTintColor,
  inactiveTintColor,
}: TabButtonFactoryProps) {
  return function TabButton({
    onPress,
    onLongPress,
    accessibilityState,
    accessibilityLabel,
  }: {
    onPress?: () => void;
    onLongPress?: () => void;
    accessibilityState?: { selected?: boolean };
    accessibilityLabel?: string;
  }) {
    return (
      <AnimatedTabButton
        label={label}
        icon={icon}
        activeTintColor={activeTintColor}
        inactiveTintColor={inactiveTintColor}
        selected={Boolean(accessibilityState?.selected)}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={accessibilityLabel}
      />
    );
  };
}

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const tabBarBaseHeight = isLandscape ? 56 : 64;
  const tabBarPaddingTop = isLandscape ? 4 : 8;
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);
  const tabBarHeight = tabBarBaseHeight + tabBarPaddingTop + tabBarPaddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.header,
        },
        headerTintColor: colors.headerText,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: `${colors.tabBarBackground}E6`,
          borderTopWidth: 0,
          borderTopColor: colors.tabBarActive,
          height: tabBarHeight,
          paddingTop: tabBarPaddingTop,
          paddingBottom: tabBarPaddingBottom,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Seed Inventory',
          tabBarButton: createAnimatedTabButton({
            label: 'Seeds',
            icon: Seed,
            activeTintColor: colors.tabBarActive,
            inactiveTintColor: colors.tabBarInactive,
          }),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Planting Calendar',
          tabBarButton: createAnimatedTabButton({
            label: 'Calendar',
            icon: Calendar,
            activeTintColor: colors.tabBarActive,
            inactiveTintColor: colors.tabBarInactive,
          }),
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: 'Weather & Garden',
          tabBarButton: createAnimatedTabButton({
            label: 'Weather',
            icon: CloudRain,
            activeTintColor: colors.tabBarActive,
            inactiveTintColor: colors.tabBarInactive,
          }),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Assistant',
          tabBarButton: createAnimatedTabButton({
            label: 'AI',
            icon: Brain,
            activeTintColor: colors.tabBarActive,
            inactiveTintColor: colors.tabBarInactive,
          }),
        }}
      />
      <Tabs.Screen
        name="manage-suppliers"
        options={{
          title: 'Manage Suppliers',
          tabBarButton: createAnimatedTabButton({
            label: 'Suppliers',
            icon: Users,
            activeTintColor: colors.tabBarActive,
            inactiveTintColor: colors.tabBarInactive,
          }),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'App Settings',
          tabBarButton: createAnimatedTabButton({
            label: 'Settings',
            icon: Settings,
            activeTintColor: colors.tabBarActive,
            inactiveTintColor: colors.tabBarInactive,
          }),
        }}
      />
      <Tabs.Screen
        name="select-supplier"
        options={{
          href: null, // Hide from tabs - only accessible via direct navigation
          title: 'Select Supplier',
          tabBarIcon: ({ color }) => <Tractor size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  buttonPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedContainer: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 14,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
