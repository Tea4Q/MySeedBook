import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Brain, MessageCircle, Settings, ShoppingCart, Mic, Sparkles, Crown } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { AIGardenAssistant } from '@/components/AIGardenAssistant';
import { SmartShoppingAssistant } from '@/components/SmartShoppingAssistant';
import { VoiceNotes } from '@/components/VoiceNotes';
import AISettingsPanel from '@/components/AISettingsPanel';
import PremiumModal from '@/components/PremiumModal';
import AISetupModal from '@/components/AISetupModal';
import { Seed, Supplier } from '@/types/database';
import { getAIFeatures } from '@/config/ai';
import { useAIConfigured } from '@/hooks/useAIConfigured';
import { supabase } from '@/lib/supabase';
import { guestDataManager } from '@/utils/guestDataManager';
import { PRICING_COPY } from '@/lib/pricingCopy';

type ActiveView = 'overview' | 'chat' | 'shopping' | 'voice' | 'settings';

export default function AIScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { isPremium, showUpgradePrompt } = usePremiumFeature();
  
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [userSeeds, setUserSeeds] = useState<Seed[]>([]);
  const [userSuppliers, setUserSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceText, setVoiceText] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const { isConfigured, recheck } = useAIConfigured();
  const [aiFeatures, setAIFeatures] = useState({
    voice_notes: false,
    ai_chat: false,
    smart_shopping: false,
    plant_identification: false,
    disease_diagnosis: false,
    harvest_prediction: false,
  });

  const loadAIFeatures = useCallback(async () => {
    const features = await getAIFeatures();
    setAIFeatures(features);
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (session?.user) {
        // Load authenticated user data
        const [seedsResponse, suppliersResponse] = await Promise.all([
          supabase
            .from('seeds')
            .select('*')
            .eq('user_id', session.user.id)
            .is('deleted_at', null),
          supabase
            .from('suppliers')
            .select('*')
            .eq('user_id', session.user.id)
            .is('deleted_at', null),
        ]);

        if (seedsResponse.data) setUserSeeds(seedsResponse.data);
        if (suppliersResponse.data) setUserSuppliers(suppliersResponse.data);
        
      } else {
        // Load guest data
        const [seeds, suppliers] = await Promise.all([
          guestDataManager.getAllSeeds(),
          guestDataManager.getAllSuppliers(),
        ]);
        
        setUserSeeds(seeds);
        setUserSuppliers(suppliers);
      }
    } catch (error) {
      console.error('Error loading user data for AI:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadUserData();
    loadAIFeatures();
  }, [loadUserData, loadAIFeatures]);

  const showAIUpgradePrompt = (featureName: string) => {
    Alert.alert(
      `Upgrade for ${featureName}`,
      PRICING_COPY.upgradePromptForAIFeature(featureName),
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Upgrade', onPress: () => setShowPremiumModal(true) },
      ]
    );
  };

  const handleVoiceTextExtracted = (text: string) => {
    setVoiceText(text);
    // Could auto-navigate to chat and send the voice text
    if (text.trim()) {
      if (aiFeatures.ai_chat) {
        setActiveView('chat');
      } else {
        showAIUpgradePrompt('AI Garden Chat');
      }
    }
  };

  const handleFeatureNavigation = (viewId: ActiveView, featureName: keyof typeof aiFeatures, displayName: string) => {
    if (!aiFeatures[featureName]) {
      showAIUpgradePrompt(displayName);
      return;
    }
    if (isConfigured === false && viewId !== 'settings') {
      setShowSetupModal(true);
      return;
    }
    setActiveView(viewId);
  };

  const renderFeatureCard = (
    title: string,
    description: string,
    icon: any,
    viewId: ActiveView,
    featureKey: keyof typeof aiFeatures,
    comingSoon: boolean = false
  ) => {
    const hasFeature = aiFeatures[featureKey];
    const isPremiumFeature = !hasFeature && !comingSoon;
    
    return (
      <Pressable
        style={[
          styles.featureCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: comingSoon ? 0.6 : 1,
          },
          activeView === viewId && { borderColor: colors.primary, borderWidth: 2 },
        ]}
        onPress={() => {
          if (comingSoon) return;
          handleFeatureNavigation(viewId, featureKey, title);
        }}
        disabled={comingSoon}
      >
        <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '20' }]}>
          {React.createElement(icon, { size: 24, color: colors.primary })}
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureHeader}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              {title}
            </Text>
            <View style={styles.featureBadges}>
              {isPremiumFeature && (
                <View style={[styles.premiumBadge, { backgroundColor: colors.warning }]}>
                  <Crown size={12} color={colors.background} />
                  <Text style={[styles.premiumText, { color: colors.background }]}>
                    Premium
                  </Text>
                </View>
              )}
              {comingSoon && (
                <View style={[styles.comingSoonBadge, { backgroundColor: colors.textSecondary }]}>
                  <Text style={[styles.comingSoonText, { color: colors.background }]}>
                    Phase 2
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
          {isPremiumFeature && (
            <Text style={[styles.upgradeHint, { color: colors.warning }]}>
              Tap to upgrade for access
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
          <Brain size={32} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AI Garden Assistant
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Phase 1 Features Available
          </Text>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {userSeeds.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Seeds in Collection
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {userSuppliers.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Trusted Suppliers
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {isPremium ? '✓' : '✗'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Premium Status
          </Text>
        </View>
      </View>

      {/* Feature Cards */}
      <View style={styles.featuresGrid}>
        {renderFeatureCard(
          'AI Garden Chat',
          'Get personalized gardening advice and answers to your plant questions.',
          MessageCircle,
          'chat',
          'ai_chat'
        )}
        
        {renderFeatureCard(
          'Smart Shopping',
          'Receive AI-powered recommendations for seeds that complement your garden.',
          ShoppingCart,
          'shopping',
          'smart_shopping'
        )}
        
        {renderFeatureCard(
          'Voice Garden Notes',
          'Record voice notes hands-free while working in your garden.',
          Mic,
          'voice',
          'voice_notes'
        )}
      </View>

      {/* Coming Soon Preview */}
      <View style={styles.comingSoonContainer}>
        <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
          Coming in Phase 2
        </Text>
        <View style={styles.comingSoonGrid}>
          {renderFeatureCard(
            'Plant Health Scanner',
            'Photo-based disease and pest identification.',
            Sparkles,
            'overview',
            'plant_identification',
            true
          )}
          {renderFeatureCard(
            'Smart Planting Calendar',
            'AI-optimized planting schedules based on your location.',
            Sparkles,
            'overview',
            'harvest_prediction',
            true
          )}
        </View>
      </View>
    </View>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'chat':
        return (
          <AIGardenAssistant
            userSeeds={userSeeds}
            userSuppliers={userSuppliers}
            location="Your Garden" // Could be enhanced with actual location
          />
        );
      case 'shopping':
        return (
          <SmartShoppingAssistant
            userSeeds={userSeeds}
            userSuppliers={userSuppliers}
            location="Your Location"
          />
        );
      case 'voice':
        return (
          <View style={styles.voiceContainer}>
            <Text style={[styles.voiceTitle, { color: colors.text }]}>
              Voice Garden Notes
            </Text>
            <Text style={[styles.voiceSubtitle, { color: colors.textSecondary }]}>
              Record voice notes while working in your garden. The text will be extracted automatically.
            </Text>
            
            <VoiceNotes
              onTextExtracted={handleVoiceTextExtracted}
              placeholder="Tap to record garden observations"
              maxDuration={60}
              allowPlayback={true}
            />
            
            {voiceText && (
              <View style={[styles.extractedTextContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.extractedTextLabel, { color: colors.textSecondary }]}>
                  Extracted Text:
                </Text>
                <Text style={[styles.extractedText, { color: colors.text }]}>
                  {voiceText}
                </Text>
                
                <Pressable
                  style={[styles.useTextButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setActiveView('chat');
                    // The chat component could be enhanced to accept initial text
                  }}
                >
                  <MessageCircle size={16} color={colors.background} />
                  <Text style={[styles.useTextButtonText, { color: colors.background }]}>
                    Continue in AI Chat
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      default:
        return renderOverview();
      case 'settings':
        return (
          <AISettingsPanel onConfigured={() => loadAIFeatures()} />
        );
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Brain size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading AI Features...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navigation Bar */}
      {activeView !== 'overview' ? (
        <View style={[styles.navigationBar, { backgroundColor: colors.surface }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => setActiveView('overview')}
          >
            <Text style={[styles.backButtonText, { color: colors.primary }]}>
              ← Back to AI Features
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.navigationBar, { backgroundColor: colors.surface }]}>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.settingsButton} onPress={() => { recheck(); setActiveView('settings'); }}>
            <Settings size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Content */}
      {renderActiveView()}

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="AI Garden Assistant"
      />
      {/* AI Setup Modal */}
      <AISetupModal
        visible={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onOpenSettings={() => { recheck(); setActiveView('settings'); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  navigationBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 4,
  },
  overviewContainer: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  featuresGrid: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  featureBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '600',
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  comingSoonContainer: {
    marginTop: 16,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  comingSoonGrid: {
    gap: 12,
  },
  voiceContainer: {
    flex: 1,
    padding: 16,
    gap: 24,
  },
  voiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  voiceSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  extractedTextContainer: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  extractedTextLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  extractedText: {
    fontSize: 15,
    lineHeight: 22,
  },
  useTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  useTextButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});