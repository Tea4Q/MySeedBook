import { Tabs } from 'expo-router';
import {
  Sprout as Seed,
  Tractor,
  Calendar,
  Settings,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import React from 'react';


// import { Slot } from 'expo-router';
// // This is the root layout for the app, which will render the tabs.
// // It uses the `expo-router` library to define the layout and navigation structure.
// const RootLayout = () => {
//   return (
//     <Slot />
//   );
// }
// export { RootLayout as default };

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarActive,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerStyle: {
          backgroundColor: colors.tabBarBackground,
        },
        headerTintColor: colors.tabBarActive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <Seed size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage-suppliers"
        options={{
          title: 'Suppliers',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
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
