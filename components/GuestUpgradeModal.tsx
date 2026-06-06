import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { User, ArrowRight, Check } from 'lucide-react-native';

interface GuestUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function GuestUpgradeModal({ 
  visible, 
  onClose, 
  title = "Upgrade to Full Access",
  message = "You've reached your guest limit. Create an account to continue using all features unlimited!"
}: GuestUpgradeModalProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/auth');
  };

  const benefits = [
    "Unlimited seed additions",
    "Unlimited supplier management", 
    "Full inventory tracking",
    "Advanced search and filtering",
    "Photo storage and management",
    "Calendar integration",
    "Data backup and sync"
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { backgroundColor: colors.primary + '15' }]}>
            <User size={32} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
            
            <View style={styles.benefitsContainer}>
              <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                Full account includes:
              </Text>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Check size={16} color={colors.success} />
                  <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.actions}>
            <Pressable 
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
            >
              <Text style={[styles.upgradeButtonText, { color: colors.primaryText }]}>
                Create Account
              </Text>
              <ArrowRight size={20} color={colors.primaryText} />
            </Pressable>
            
            <Pressable 
              style={[styles.laterButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.laterButtonText, { color: colors.textSecondary }]}>
                Maybe Later
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: 8,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    padding: 24,
    paddingTop: 0,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
