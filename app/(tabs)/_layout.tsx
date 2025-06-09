import { Tabs } from 'expo-router';
import {
  Sprout as Seed,
  Tractor,
  Calendar,
  Settings,
  Users,
} from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#262A2B',
          borderTopColor: '#BCAB92',
        },
        tabBarActiveTintColor: '#BCAB92',
        tabBarInactiveTintColor: '#8B8776',
        headerStyle: {
          backgroundColor: '#262A2B',
        },
        headerTintColor: '#BCAB92',
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
        name="suppliers"
        options={{
          title: 'Suppliers',
          tabBarIcon: ({ color }) => <Tractor size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage-suppliers"
        options={{
          title: 'Manage Suppliers',
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
    </Tabs>
  );
}
