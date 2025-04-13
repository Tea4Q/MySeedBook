import { Tabs } from 'expo-router';
<<<<<<< HEAD
import { Bed as Seed, Calendar, ShoppingBag, Settings } from 'lucide-react-native';
=======
import { Bed as Seed, ShoppingBag, Calendar, Settings } from 'lucide-react-native';
>>>>>>> 3db94dbf120985edd02394475cba0a6fd8fd58ee

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
<<<<<<< HEAD
          backgroundColor: '#f8f9fa',
          borderTopColor: '#e9ecef',
        },
        tabBarActiveTintColor: '#2f9e44',
        tabBarInactiveTintColor: '#868e96',
        headerStyle: {
          backgroundColor: '#f8f9fa',
        },
        headerTintColor: '#2f9e44',
=======
          backgroundColor: '#262A2B',
          borderTopColor: '#BCAB92',
        },
        tabBarActiveTintColor: '#BCAB92',
        tabBarInactiveTintColor: '#8B8776',
        headerStyle: {
          backgroundColor: '#262A2B',
        },
        headerTintColor: '#BCAB92',
>>>>>>> 3db94dbf120985edd02394475cba0a6fd8fd58ee
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventory',
<<<<<<< HEAD
          tabBarIcon: ({ color, size }) => <Seed size={size} color={color} />,
=======
          tabBarIcon: ({ color }) => <Seed size={24} color={color} />,
>>>>>>> 3db94dbf120985edd02394475cba0a6fd8fd58ee
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
<<<<<<< HEAD
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
=======
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
>>>>>>> 3db94dbf120985edd02394475cba0a6fd8fd58ee
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Suppliers',
<<<<<<< HEAD
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
=======
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
>>>>>>> 3db94dbf120985edd02394475cba0a6fd8fd58ee
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
<<<<<<< HEAD
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
=======
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
>>>>>>> 3db94dbf120985edd02394475cba0a6fd8fd58ee
        }}
      />
    </Tabs>
  );
}