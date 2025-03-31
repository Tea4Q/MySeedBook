import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Bell, Sun, Moon, CloudRain } from 'lucide-react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Bell size={24} color="#2f9e44" />
            <Text style={styles.settingText}>Planting Reminders</Text>
          </View>
          <Switch
            trackColor={{ false: '#dee2e6', true: '#8ce99a' }}
            thumbColor="#ffffff"
            ios_backgroundColor="#dee2e6"
          />
        </View>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <CloudRain size={24} color="#2f9e44" />
            <Text style={styles.settingText}>Weather Alerts</Text>
          </View>
          <Switch
            trackColor={{ false: '#dee2e6', true: '#8ce99a' }}
            thumbColor="#ffffff"
            ios_backgroundColor="#dee2e6"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Sun size={24} color="#2f9e44" />
            <Text style={styles.settingText}>Light Mode</Text>
          </View>
          <Pressable style={[styles.themeButton, styles.activeTheme]}>
            <Text style={styles.themeButtonText}>On</Text>
          </Pressable>
        </View>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Moon size={24} color="#2f9e44" />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Pressable style={styles.themeButton}>
            <Text style={styles.themeButtonText}>Off</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#495057',
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
  },
  activeTheme: {
    backgroundColor: '#e6f3e6',
  },
  themeButtonText: {
    fontSize: 14,
    color: '#2f9e44',
    fontWeight: '500',
  },
  version: {
    fontSize: 14,
    color: '#868e96',
  },
});
