import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { router } from 'expo-router';
import { Sprout, CheckCircle, Settings, ExternalLink, ArrowLeft, TestTube } from 'lucide-react-native';
import { usePremiumFeature } from '../hooks/usePremiumFeature';
import PremiumModal from '../components/PremiumModal';
import { premiumManager } from '../utils/premiumManager';
import { useGlobalSubscription } from '../lib/globalSubscriptionManager';

const TIER_FEATURES: Record<string, string[]> = {
  essential: [
    'Unlimited seeds',
    'Unlimited suppliers',
    'Unlimited photos',
    'Weather integration',
    'Cloud sync across devices',
    'Advanced calendar',
  ],
  voice: [
    'Everything in Essential',
    'Voice notes',
    'AI voice transcription entry',
    'Hands-free add and edit workflow',
  ],
};

export default function PremiumSettingsScreen() {
  const { colors } = useTheme();
  const { isPremium, subscription } = usePremiumFeature();
  const { tier, planType, renewalDate, planLabel, openManageSubscriptions } = useGlobalSubscription();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isTestPremium, setIsTestPremium] = useState(isPremium);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleToggleTestPremium = async () => {
    try {
      if (isTestPremium) {
        await premiumManager.disableTestPremium();
        setIsTestPremium(false);
        Alert.alert('Test Premium Disabled', 'Premium features have been disabled. Please restart the app to see changes.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await premiumManager.enableTestPremium();
        setIsTestPremium(true);
        Alert.alert('Test Premium Enabled', 'Premium features have been enabled. Please restart the app to see changes.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error toggling test premium:', error);
      Alert.alert('Error', 'Failed to toggle premium features. Please try again.');
    }
  };

  const handleManageSubscription = () => {
    openManageSubscriptions();
  };

  const handleContactSupport = () => {
    // Navigate to feedback form for premium support
    router.push('/feedback');
  };

  if (isPremium) {
    return (
      <>
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Development Test Toggle (only in __DEV__) */}
          {__DEV__ && (
            <View style={[styles.testCard, { backgroundColor: colors.card, borderColor: '#FFA500' }]}>
              <View style={styles.testHeader}>
                <TestTube size={24} color="#FFA500" />
                <Text style={[styles.testTitle, { color: colors.text }]}>Development Mode</Text>
              </View>
              <View style={styles.testToggleRow}>
                <Text style={[styles.testToggleText, { color: colors.text + '80' }]}>
                  Test Premium Features
                </Text>
                <Switch
                  value={isTestPremium}
                  onValueChange={handleToggleTestPremium}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={isTestPremium ? '#FFFFFF' : '#F4F3F4'}
                />
              </View>
              <Text style={[styles.testNote, { color: colors.text + '80' }]}>
                Toggle this to test premium features without a real subscription. Restart the app after toggling.
              </Text>
            </View>
          )}

          {/* Premium Status */}
          <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.statusHeader}>
              <Sprout size={32} color={colors.primary} />
              <View style={styles.statusContent}>
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  Subscription Active
                </Text>
                <Text style={[styles.statusSubtitle, { color: colors.primary }]}>
                  {planLabel || (planType === 'yearly' ? 'Yearly Plan' : 'Monthly Plan')}
                </Text>
              </View>
              <CheckCircle size={24} color={colors.primary} />
            </View>
            
            <View style={styles.statusDetails}>
              <Text style={[styles.statusDetailText, { color: colors.text + '80' }]}>
                Active until: {renewalDate ?? formatDate(subscription.expiresAt)}
              </Text>
            </View>
          </View>

        {/* Premium Features */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}> 
            Included in Your Plan
          </Text>

          {(tier === 'voice' ? TIER_FEATURES.voice : TIER_FEATURES.essential).map((featureName) => (
            <View key={featureName} style={styles.featureItem}>
              <CheckCircle size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                {featureName}
              </Text>
            </View>
          ))}

          {__DEV__ && !tier && subscription.features.plant_identification && (
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>Development fallback premium features enabled</Text>
            </View>
          )}
        </View>

        {/* Management Options */}
        <View style={[styles.managementCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Manage Subscription
          </Text>
          
          <Pressable
            style={[styles.managementButton, { borderBottomColor: colors.border }]}
            onPress={handleManageSubscription}
          >
            <Settings size={20} color={colors.text + '80'} />
            <Text style={[styles.managementButtonText, { color: colors.text }]}>
              Manage Subscription
            </Text>
            <ExternalLink size={16} color={colors.text + '80'} />
          </Pressable>
          
          <Pressable
            style={styles.managementButton}
            onPress={handleContactSupport}
          >
            <Sprout size={20} color={colors.primary} />
            <Text style={[styles.managementButtonText, { color: colors.text }]}>
              Subscription Support
            </Text>
            <ExternalLink size={16} color={colors.text + '80'} />
          </Pressable>
        </View>
      </ScrollView>
      
      {/* Floating Back Button */}
      <Pressable onPress={() => router.back()} style={[styles.floatingBackButton, { backgroundColor: colors.card }]}>
        <ArrowLeft size={24} color={colors.text} />
      </Pressable>
      </>
    );
  }

  // Free tier display
  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Development Test Toggle (only in __DEV__) */}
        {__DEV__ && (
          <View style={[styles.testCard, { backgroundColor: colors.card, borderColor: '#FFA500' }]}>
            <View style={styles.testHeader}>
              <TestTube size={24} color="#FFA500" />
              <Text style={[styles.testTitle, { color: colors.text }]}>Development Mode</Text>
            </View>
            <View style={styles.testToggleRow}>
              <Text style={[styles.testToggleText, { color: colors.text + '80' }]}>
                Test Premium Features
              </Text>
              <Switch
                value={isTestPremium}
                onValueChange={handleToggleTestPremium}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isTestPremium ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>
            <Text style={[styles.testNote, { color: colors.text + '80' }]}>
              Toggle this to test premium features without a real subscription. Restart the app after toggling.
            </Text>
          </View>
        )}

        {/* Free Status */}
        <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusHeader}>
            <Settings size={32} color={colors.text + '80'} />
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Free Plan
              </Text>
              <Text style={[styles.statusSubtitle, { color: colors.text + '80' }]}>
                Limited Features
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade Prompt */}
        <View style={[styles.upgradeCard, { backgroundColor: colors.primary + '15' }]}>
          <Sprout size={48} color={colors.primary} />
          <Text style={[styles.upgradeTitle, { color: colors.text }]}>
            Choose Your Garden Plan
          </Text>
          <Text style={[styles.upgradeDescription, { color: colors.text + '80' }]}>
            Essential starts at $7.99. Upgrade to Voice & AI at $9.99 when you are ready.
          </Text>
          
          <Pressable
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowPremiumModal(true)}
          >
            <Sprout size={20} color="#FFFFFF" />
            <Text style={[styles.upgradeButtonText, { color: '#FFFFFF' }]}>
              View Subscription Plans
            </Text>
          </Pressable>
        </View>

        {/* Feature Comparison */}
        <View style={[styles.comparisonCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Plan Comparison
          </Text>
          
          <View style={styles.comparisonRow}>
            <Text style={[styles.comparisonFeature, { color: colors.text }]}>Seeds</Text>
            <Text style={[styles.comparisonFree, { color: colors.text + '80' }]}>3 max</Text>
            <Text style={[styles.comparisonPremium, { color: colors.primary }]}>Essential+</Text>
          </View>
          
          <View style={styles.comparisonRow}>
            <Text style={[styles.comparisonFeature, { color: colors.text }]}>Suppliers</Text>
            <Text style={[styles.comparisonFree, { color: colors.text + '80' }]}>2 max</Text>
            <Text style={[styles.comparisonPremium, { color: colors.primary }]}>Essential+</Text>
          </View>
          
          <View style={styles.comparisonRow}>
            <Text style={[styles.comparisonFeature, { color: colors.text }]}>Photos</Text>
            <Text style={[styles.comparisonFree, { color: colors.text + '80' }]}>5 max</Text>
            <Text style={[styles.comparisonPremium, { color: colors.primary }]}>Essential+</Text>
          </View>
          
          <View style={styles.comparisonRow}>
            <Text style={[styles.comparisonFeature, { color: colors.text }]}>Weather + Sync</Text>
            <Text style={[styles.comparisonFree, { color: colors.text + '80' }]}>Basic</Text>
            <Text style={[styles.comparisonPremium, { color: colors.primary }]}>Essential+</Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={[styles.comparisonFeature, { color: colors.text }]}>Voice Notes</Text>
            <Text style={[styles.comparisonFree, { color: colors.text + '80' }]}>No</Text>
            <Text style={[styles.comparisonPremium, { color: colors.primary }]}>Voice & AI</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Floating Back Button */}
      <Pressable onPress={() => router.back()} style={[styles.floatingBackButton, { backgroundColor: colors.card }]}>
        <ArrowLeft size={24} color={colors.text} />
      </Pressable>
      
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContent: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#00000020',
  },
  statusDetailText: {
    fontSize: 14,
  },
  featuresCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
  managementCard: {
    borderRadius: 16,
    padding: 20,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  managementButtonText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  upgradeCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  comparisonCard: {
    borderRadius: 16,
    padding: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 16,
  },
  comparisonFree: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  comparisonPremium: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  floatingBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  testToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  testNote: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});