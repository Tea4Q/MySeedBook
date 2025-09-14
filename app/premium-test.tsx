import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Crown, TestTube, CheckCircle, XCircle, Settings } from 'lucide-react-native';
import { usePremiumFeature, useUsageLimit, usePremiumGate } from '../hooks/usePremiumFeature';
import PremiumModal from '../components/PremiumModal';
import { premiumManager } from '../utils/premiumManager';

export default function PremiumTestScreen() {
  const { colors } = useTheme();
  const { isPremium, subscription, showUpgradePrompt } = usePremiumFeature();
  const { hasFeature: hasUnlimitedSeeds, requestFeature: requestUnlimitedSeeds } = usePremiumGate('unlimited_seeds');
  const seedLimit = useUsageLimit('seed');
  const supplierLimit = useUsageLimit('supplier');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runPremiumTests = async () => {
    setTestResults([]);
    addTestResult('🚀 Starting premium feature tests...');

    // Test 1: Check subscription status
    addTestResult(`📊 Current Status: ${isPremium ? 'Premium' : 'Free'} (${subscription.tier})`);
    
    // Test 2: Test feature gates
    const canAddSeeds = hasUnlimitedSeeds;
    addTestResult(`🌱 Unlimited Seeds: ${canAddSeeds ? '✅ Available' : '❌ Locked'}`);

    // Test 3: Test usage limits
    const seedStatus = await premiumManager.checkLimit('seed');
    addTestResult(`📈 Seed Limit: ${seedStatus.current}/${seedStatus.limit === -1 ? '∞' : seedStatus.limit} (${seedStatus.allowed ? 'Can add' : 'Limit reached'})`);

    const supplierStatus = await premiumManager.checkLimit('supplier');
    addTestResult(`🏪 Supplier Limit: ${supplierStatus.current}/${supplierStatus.limit === -1 ? '∞' : supplierStatus.limit} (${supplierStatus.allowed ? 'Can add' : 'Limit reached'})`);

    // Test 4: Test premium manager initialization
    try {
      await premiumManager.initialize();
      addTestResult('⚙️ Premium Manager: ✅ Initialized successfully');
    } catch {
      addTestResult('⚙️ Premium Manager: ❌ Failed to initialize');
    }

    // Test 5: Test subscription validation
    try {
      await premiumManager.validatePurchases();
      addTestResult('💳 Purchase Validation: ✅ Completed');
    } catch {
      addTestResult('💳 Purchase Validation: ❌ Failed');
    }

    addTestResult('🎉 All tests completed!');
  };

  const simulatePremiumUpgrade = async () => {
    try {
      addTestResult('🔄 Simulating premium upgrade...');
      const success = await premiumManager.purchaseSubscription('premium_monthly_web');
      if (success) {
        addTestResult('✅ Premium upgrade successful!');
        Alert.alert('Success!', 'Premium simulation completed. In production, this would be a real purchase.');
      }
    } catch {
      addTestResult('❌ Premium upgrade failed');
      Alert.alert('Test Complete', 'This is a simulation. Real purchases happen on mobile platforms.');
    }
  };

  const testFeatureRequest = () => {
    const hasFeature = requestUnlimitedSeeds();
    if (hasFeature) {
      addTestResult('✅ Feature granted: Unlimited seeds');
    } else {
      addTestResult('❌ Feature denied: Showed upgrade prompt');
    }
  };

  const testUsageLimit = async (action: 'seed' | 'supplier') => {
    const canUse = await (action === 'seed' ? seedLimit : supplierLimit).requestAction();
    if (canUse) {
      addTestResult(`✅ ${action} addition allowed`);
    } else {
      addTestResult(`❌ ${action} limit reached - showed upgrade prompt`);
    }
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TestTube size={32} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Premium Feature Testing
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
            Test and validate premium functionality
          </Text>
        </View>

        {/* Current Status */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusRow}>
            <Crown size={24} color={isPremium ? colors.primary : colors.text + '80'} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {isPremium ? 'Premium Active' : 'Free Tier'}
            </Text>
            {isPremium ? (
              <CheckCircle size={20} color={colors.primary} />
            ) : (
              <XCircle size={20} color={colors.text + '80'} />
            )}
          </View>
          
          <Text style={[styles.statusDetail, { color: colors.text + '80' }]}>
            Tier: {subscription.tier} | Expires: {subscription.expiresAt || 'N/A'}
          </Text>
        </View>

        {/* Usage Limits Display */}
        <View style={[styles.limitsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Current Usage Limits</Text>
          
          <View style={styles.limitRow}>
            <Text style={[styles.limitLabel, { color: colors.text }]}>Seeds:</Text>
            <Text style={[styles.limitValue, { color: seedLimit.canUse ? colors.primary : colors.notification }]}>
              {seedLimit.current}/{seedLimit.isPremium ? '∞' : seedLimit.limit}
            </Text>
          </View>
          
          <View style={styles.limitRow}>
            <Text style={[styles.limitLabel, { color: colors.text }]}>Suppliers:</Text>
            <Text style={[styles.limitValue, { color: supplierLimit.canUse ? colors.primary : colors.notification }]}>
              {supplierLimit.current}/{supplierLimit.isPremium ? '∞' : supplierLimit.limit}
            </Text>
          </View>
        </View>

        {/* Test Actions */}
        <View style={[styles.testCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Test Actions</Text>
          
          <Pressable
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={runPremiumTests}
          >
            <TestTube size={20} color="#FFFFFF" />
            <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
              Run All Tests
            </Text>
          </Pressable>

          <Pressable
            style={[styles.testButton, { backgroundColor: colors.primary + '80' }]}
            onPress={testFeatureRequest}
          >
            <Crown size={20} color="#FFFFFF" />
            <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
              Test Feature Gate
            </Text>
          </Pressable>

          <Pressable
            style={[styles.testButton, { backgroundColor: colors.primary + '60' }]}
            onPress={() => testUsageLimit('seed')}
          >
            <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
              Test Seed Limit
            </Text>
          </Pressable>

          <Pressable
            style={[styles.testButton, { backgroundColor: colors.primary + '40' }]}
            onPress={() => testUsageLimit('supplier')}
          >
            <Text style={[styles.testButtonText, { color: '#FFFFFF' }]}>
              Test Supplier Limit
            </Text>
          </Pressable>
        </View>

        {/* Premium Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Premium Actions</Text>
          
          <Pressable
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={() => setShowPremiumModal(true)}
          >
            <Crown size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Open Premium Modal
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={simulatePremiumUpgrade}
          >
            <Settings size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Simulate Purchase
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { borderColor: colors.text + '40' }]}
            onPress={() => showUpgradePrompt('unlimited features')}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Show Upgrade Prompt
            </Text>
          </Pressable>
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={[styles.resultsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Test Results</Text>
            <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
              {testResults.map((result, index) => (
                <Text key={index} style={[styles.resultText, { color: colors.text + '80' }]}>
                  {result}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="testing premium features"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  statusDetail: {
    fontSize: 14,
    marginLeft: 36,
  },
  limitsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  limitLabel: {
    fontSize: 16,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  testCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  resultsContainer: {
    maxHeight: 200,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});