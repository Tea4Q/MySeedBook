import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Crown, Check, X, Star } from 'lucide-react-native';
import { premiumManager, SUBSCRIPTION_PRODUCTS } from '../utils/premiumManager';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

export default function PremiumModal({ visible, onClose, feature }: PremiumModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);

  // Color fallbacks for missing theme colors
  const textSecondary = colors.text + '80'; // 50% opacity
  const primaryText = '#FFFFFF';
  const successColor = '#22C55E';

  const handlePurchase = async (productId: string, isYearly: boolean = false) => {
    setLoading(productId);
    
    try {
      const success = await premiumManager.purchaseSubscription(productId);
      
      if (success) {
        Alert.alert(
          '🎉 Welcome to Premium!',
          'Thank you for upgrading! You now have access to all premium features.',
          [
            {
              text: 'Get Started',
              onPress: () => {
                onClose();
              }
            }
          ]
        );
      }
    } catch {
      Alert.alert(
        'Purchase Failed',
        'We couldn\'t complete your purchase. Please try again or contact support if the problem persists.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading('restore');
    
    try {
      const restored = await premiumManager.restorePurchases();
      
      if (restored) {
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert(
        'Restore Failed',
        'We couldn\'t restore your purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(null);
    }
  };

  const premiumFeatures = [
    {
      icon: <Star size={20} color={colors.primary} />,
      title: 'Unlimited Seeds',
      description: 'Add as many seeds as you want to your collection'
    },
    {
      icon: <Crown size={20} color={colors.primary} />,
      title: 'Unlimited Suppliers',
      description: 'Manage all your gardening suppliers without limits'
    },
    {
      icon: <Check size={20} color={colors.primary} />,
      title: 'Advanced Calendar',
      description: 'Plan your entire growing season with detailed scheduling'
    },
    {
      icon: <Star size={20} color={colors.primary} />,
      title: 'Weather Integration',
      description: 'Get weather-based planting and care recommendations'
    },
    {
      icon: <Crown size={20} color={colors.primary} />,
      title: 'Plant Identification',
      description: 'Identify plants and diseases with AI-powered recognition'
    },
    {
      icon: <Check size={20} color={colors.primary} />,
      title: 'Data Export & Backup',
      description: 'Export your garden data and sync across devices'
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerContent}>
            <Crown size={32} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Upgrade to Premium
            </Text>
            {feature && (
              <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
                Unlock {feature} and all premium features
              </Text>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              Premium Features
            </Text>
            
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={[styles.featureItem, { borderBottomColor: colors.border }]}>
                <View style={styles.featureIcon}>
                  {feature.icon}
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          <View style={styles.pricingContainer}>
            <Text style={[styles.pricingTitle, { color: colors.text }]}>
              Choose Your Plan
            </Text>

            {/* Yearly Plan (Recommended) */}
            <View style={[styles.pricingCard, styles.recommendedCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.recommendedText, { color: primaryText }]}>
                  BEST VALUE
                </Text>
              </View>
              <Text style={[styles.planTitle, { color: colors.text }]}>Premium Yearly</Text>
              <Text style={[styles.planPrice, { color: colors.primary }]}>$39.99/year</Text>
              <Text style={[styles.planSavings, { color: successColor }]}>Save 33% vs monthly</Text>
              <Text style={[styles.planEquivalent, { color: textSecondary }]}>
                Just $3.33/month
              </Text>
              
              <Pressable
                style={[styles.purchaseButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => handlePurchase(SUBSCRIPTION_PRODUCTS.yearly, true)}
                disabled={loading !== null}
              >
                {loading === SUBSCRIPTION_PRODUCTS.yearly ? (
                  <ActivityIndicator color={primaryText} />
                ) : (
                  <Text style={[styles.purchaseButtonText, { color: primaryText }]}>
                    Start Premium Yearly
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Monthly Plan */}
            <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.planTitle, { color: colors.text }]}>Premium Monthly</Text>
              <Text style={[styles.planPrice, { color: colors.text }]}>$4.99/month</Text>
              <Text style={[styles.planDescription, { color: textSecondary }]}>
                Perfect for trying premium features
              </Text>
              
              <Pressable
                style={[styles.purchaseButton, styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={() => handlePurchase(SUBSCRIPTION_PRODUCTS.monthly)}
                disabled={loading !== null}
              >
                {loading === SUBSCRIPTION_PRODUCTS.monthly ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={[styles.purchaseButtonText, styles.secondaryButtonText, { color: colors.primary }]}>
                    Start Premium Monthly
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleRestore}
              disabled={loading !== null}
              style={styles.restoreButton}
            >
              {loading === 'restore' ? (
                <ActivityIndicator size="small" color={textSecondary} />
              ) : (
                <Text style={[styles.restoreButtonText, { color: textSecondary }]}>
                  Restore Purchases
                </Text>
              )}
            </Pressable>
            
            <Text style={[styles.disclaimerText, { color: textSecondary }]}>
              Cancel anytime. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -40, // Compensate for close button
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginVertical: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  featureIcon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  pricingContainer: {
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  pricingCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    marginBottom: 16,
    position: 'relative',
  },
  recommendedCard: {
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: 24,
    right: 24,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 12,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  planSavings: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  planEquivalent: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  planDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    borderWidth: 2,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    // color set dynamically
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});