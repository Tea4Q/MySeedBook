import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ShoppingCart, ExternalLink, Star, TrendingUp, Calendar } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { ShoppingRecommendation, AIGardenContext } from '@/types/ai';
import { Seed, Supplier } from '@/types/database';
import { AIConfig, SHOPPING_AI_CONFIG } from '@/config/ai';
import { supabase } from '@/lib/supabase';
import { guestDataManager } from '@/utils/guestDataManager';

interface SmartShoppingAssistantProps {
  userSeeds: Seed[];
  userSuppliers: Supplier[];
  location?: string;
}

export default function SmartShoppingAssistant({
  userSeeds,
  userSuppliers,
  location,
}: SmartShoppingAssistantProps) {
  const { session } = useAuth();
  const { colors } = useTheme();
  
  const [recommendations, setRecommendations] = useState<ShoppingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (userSeeds.length > 0) {
      generateRecommendations();
    }
  }, [userSeeds, userSuppliers]);

  const generateRecommendations = async () => {
    setIsLoading(true);
    
    try {
      const client = AIConfig.getClient();
      if (!client) {
        // Fallback to basic recommendations if no AI configured
        setRecommendations(getFallbackRecommendations());
        setLastUpdated(new Date());
        return;
      }

      const context = buildShoppingContext();
      const prompt = buildShoppingPrompt(context);

      const response = await client.chat.completions.create({
        model: SHOPPING_AI_CONFIG.model,
        messages: [
          { role: 'system', content: SHOPPING_AI_CONFIG.system_prompt },
          { role: 'user', content: prompt },
        ],
        temperature: SHOPPING_AI_CONFIG.temperature,
        max_tokens: SHOPPING_AI_CONFIG.max_tokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No recommendations received');

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(content);
        const recs = Array.isArray(parsed) ? parsed : parsed.recommendations || [];
        setRecommendations(recs.map((rec: any, index: number) => ({
          id: `rec-${Date.now()}-${index}`,
          ...rec,
        })));
      } catch {
        // If JSON parsing fails, extract recommendations from text
        setRecommendations(parseTextRecommendations(content));
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      
      // Fallback to basic recommendations
      setRecommendations(getFallbackRecommendations());
      setLastUpdated(new Date());
      
      Alert.alert(
        'Recommendations Limited', 
        'Using basic recommendations. Configure AI for personalized suggestions.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const buildShoppingContext = (): AIGardenContext => {
    const currentMonth = new Date().getMonth();
    const currentSeason = getCurrentSeason(currentMonth);
    
    return {
      seeds: userSeeds.map(seed => `${seed.seed_name} (${seed.type})`),
      suppliers: userSuppliers.map(s => s.supplier_name).filter(Boolean) as string[],
      location: location,
      current_season: currentSeason,
      garden_goals: analyzeGardenGoals(),
    };
  };

  const buildShoppingPrompt = (context: AIGardenContext): string => {
    return `Based on this garden inventory, suggest 4-6 complementary seeds to buy:

Current Seeds: ${context.seeds.join(', ')}
Trusted Suppliers: ${context.suppliers.join(', ')}
Season: ${context.current_season}
Location: ${context.location || 'Unknown'}

Focus on:
1. Companion plants for existing varieties
2. Succession planting opportunities  
3. Seasonal appropriate varieties
4. Gap filling in nutrition/garden balance
5. Pest management through diversity

Return as JSON array with format:
{
  "seed_name": "Plant Name",
  "supplier": "Recommended Supplier",
  "reason": "Why this seed complements the garden",
  "confidence": 0.85,
  "season_relevance": "high/medium/low",
  "price_range": "$X-Y"
}`;
  };

  const getCurrentSeason = (month: number): string => {
    if (month < 3 || month === 11) return 'winter';
    if (month < 6) return 'spring';
    if (month < 9) return 'summer';
    return 'fall';
  };

  const analyzeGardenGoals = (): string => {
    const types = userSeeds.map(seed => seed.type.toLowerCase());
    const hasVeggies = types.some(type => type.includes('vegetable') || type.includes('tomato') || type.includes('pepper'));
    const hasHerbs = types.some(type => type.includes('herb'));
    const hasFlowers = types.some(type => type.includes('flower'));
    
    if (hasVeggies && hasHerbs && hasFlowers) return 'diverse_garden';
    if (hasVeggies) return 'food_production';
    if (hasFlowers) return 'ornamental';
    return 'general_gardening';
  };

  const getFallbackRecommendations = (): ShoppingRecommendation[] => {
    const season = getCurrentSeason(new Date().getMonth());
    const hasVeggies = userSeeds.some(seed => 
      seed.type.toLowerCase().includes('vegetable') || 
      seed.type.toLowerCase().includes('tomato')
    );
    
    const fallbackRecs: ShoppingRecommendation[] = [];

    if (hasVeggies) {
      fallbackRecs.push({
        id: 'fallback-1',
        seed_name: 'Marigolds',
        supplier: userSuppliers[0]?.supplier_name || 'Any garden center',
        reason: 'Companion flowers that repel pests from vegetables',
        confidence: 0.8,
        season_relevance: season === 'spring' || season === 'summer' ? 'high' : 'medium',
        price_range: '$2-4',
      });
    }

    if (season === 'spring') {
      fallbackRecs.push({
        id: 'fallback-2',
        seed_name: 'Lettuce varieties',
        supplier: userSuppliers[0]?.supplier_name || 'Local supplier',
        reason: 'Cool weather crops perfect for spring planting',
        confidence: 0.9,
        season_relevance: 'high',
        price_range: '$3-6',
      });
    }

    if (!userSeeds.some(seed => seed.type.toLowerCase().includes('herb'))) {
      fallbackRecs.push({
        id: 'fallback-3',
        seed_name: 'Basil',
        supplier: 'Any garden center',
        reason: 'Essential culinary herb that pairs well with tomatoes',
        confidence: 0.85,
        season_relevance: season === 'spring' || season === 'summer' ? 'high' : 'low',
        price_range: '$2-5',
      });
    }

    return fallbackRecs;
  };

  const parseTextRecommendations = (text: string): ShoppingRecommendation[] => {
    // Simple text parsing for when AI doesn't return JSON
    const lines = text.split('\n').filter(line => line.trim());
    const recs: ShoppingRecommendation[] = [];
    
    lines.forEach((line, index) => {
      if (line.includes('•') || line.match(/^\d+\./)) {
        const cleanLine = line.replace(/^[•\d.)\s]+/, '').trim();
        if (cleanLine.length > 10) { // Reasonable recommendation length
          recs.push({
            id: `text-rec-${index}`,
            seed_name: cleanLine.split('-')[0]?.trim() || cleanLine,
            supplier: 'See recommendation',
            reason: cleanLine,
            confidence: 0.7,
            season_relevance: 'medium',
            price_range: 'Varies',
          });
        }
      }
    });

    return recs.slice(0, 6); // Limit to 6 recommendations
  };

  const getSeasonIcon = (relevance: string) => {
    switch (relevance) {
      case 'high': return <TrendingUp size={16} color={colors.success} />;
      case 'medium': return <Calendar size={16} color={colors.warning} />;
      default: return <Calendar size={16} color={colors.textSecondary} />;
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return colors.success;
    if (confidence >= 0.6) return colors.warning;
    return colors.textSecondary;
  };

  const renderRecommendation = ({ item }: { item: ShoppingRecommendation }) => (
    <View style={[styles.recommendationCard, { 
      backgroundColor: colors.surface,
      borderColor: colors.border 
    }]}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.seedName, { color: colors.text }]}>
            {item.seed_name}
          </Text>
          <View style={styles.badgeContainer}>
            {getSeasonIcon(item.season_relevance)}
            <View style={[styles.confidenceBadge, { 
              backgroundColor: getConfidenceColor(item.confidence) 
            }]}>
              <Star size={10} color={colors.background} />
              <Text style={[styles.confidenceText, { color: colors.background }]}>
                {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          </View>
        </View>
        
        {item.price_range && (
          <Text style={[styles.priceRange, { color: colors.primary }]}>
            {item.price_range}
          </Text>
        )}
      </View>

      <Text style={[styles.supplier, { color: colors.textSecondary }]}>
        from {item.supplier}
      </Text>

      <Text style={[styles.reason, { color: colors.text }]}>
        {item.reason}
      </Text>

      <Pressable
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          // In a real app, this could open the supplier's website or add to a shopping list
          Alert.alert(
            'Shopping Suggestion',
            `Look for "${item.seed_name}" at ${item.supplier}. ${item.reason}`
          );
        }}
      >
        <ShoppingCart size={16} color={colors.background} />
        <Text style={[styles.actionButtonText, { color: colors.background }]}>
          Add to List
        </Text>
      </Pressable>
    </View>
  );

  if (userSeeds.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <ShoppingCart size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Build Your Garden First
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Add some seeds to your inventory and I'll suggest complementary varieties to purchase.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ShoppingCart size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Smart Shopping Assistant
          </Text>
        </View>
        
        <Pressable
          style={[styles.refreshButton, { backgroundColor: colors.surface }]}
          onPress={generateRecommendations}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.refreshButtonText, { color: colors.primary }]}>
              Refresh
            </Text>
          )}
        </Pressable>
      </View>

      {/* Last Updated */}
      {lastUpdated && (
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Updated {lastUpdated.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      )}

      {/* Recommendations */}
      <FlatList
        data={recommendations}
        renderItem={renderRecommendation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={generateRecommendations}
        ListEmptyComponent={() => 
          isLoading ? null : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No recommendations available
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  recommendationCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  seedName: {
    fontSize: 18,
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  supplier: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  reason: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});