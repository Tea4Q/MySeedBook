import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  ChevronRight,
  Edit3,
  Tally4,
  Trash2,
  Truck,
  Leaf,
  Flower2,
  Wheat,
  Carrot,
  Apple,
  Cherry,
} from 'lucide-react-native';
import { SmartImage } from '@/components/SmartImage';
import { Seed } from '@/types/database';
import { useTheme } from '@/lib/theme';
import { spacing, radius, shadows, fontFamily, fontSize } from '@/lib/tokens';

interface SeedCardProps {
  seed: Seed;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isHighlighted?: boolean;
  isDeleting?: boolean;
  cardWidth?: number;
  isTablet?: boolean;
}

/**
 * Resolves the best image URI for a seed. Falls back to an Unsplash image by type.
 */
function getSeedImageUri(seed: Seed): string {
  const supabaseUrl = 'https://fodtwysfcqltykejkffn.supabase.co';
  const bucketName = 'seed-images';

  const constructUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/storage')) return `${supabaseUrl}${path}`;
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
  };

  if (seed.seed_images) {
    if (Array.isArray(seed.seed_images) && seed.seed_images.length > 0) {
      const first = seed.seed_images[0];
      if (first && typeof first === 'object' && typeof first.url === 'string') {
        return constructUrl(first.url);
      }
    } else if (typeof seed.seed_images === 'string' && seed.seed_images.trim()) {
      return constructUrl(seed.seed_images);
    }
  }

  const type = (seed.type || '').toLowerCase();
  if (type.includes('tomato'))
    return 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
  if (type.includes('pea'))
    return 'https://images.unsplash.com/photo-1587049693270-c7560da11218?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
  if (type.includes('herb'))
    return 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
  if (type.includes('flower'))
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
  return 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
}

function getSeedTypeIcon(type: string): React.ReactNode {
  const t = type.toLowerCase();
  if (t.includes('vegetable')) return <Carrot size={16} color="#4CAF50" />;
  if (t.includes('fruit')) return <Apple size={16} color="#FF9800" />;
  if (t.includes('flower')) return <Flower2 size={16} color="#E91E63" />;
  if (t.includes('herb')) return <Leaf size={16} color="#8BC34A" />;
  if (t.includes('grain')) return <Wheat size={16} color="#FFEB3B" />;
  if (t.includes('cherry')) return <Cherry size={16} color="#FF5722" />;
  return null;
}

export function SeedCard({
  seed,
  onPress,
  onEdit,
  onDelete,
  isHighlighted = false,
  isDeleting = false,
  cardWidth,
  isTablet = false,
}: SeedCardProps) {
  const { colors } = useTheme();
  const imageUri = getSeedImageUri(seed);

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: isHighlighted ? colors.success : colors.card,
          shadowColor: colors.shadowColor,
          width: cardWidth,
          marginHorizontal: cardWidth ? spacing.sm : spacing.md,
        },
      ]}
      onPress={onPress}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <SmartImage
          uri={imageUri}
          style={styles.seedImage}
          resizeMode="cover"
          fallbackUri="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&crop=center&auto=format&q=60"
        />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.seedName, { color: colors.text, fontFamily: fontFamily.bold }]}>
            {seed.seed_name}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
            {getSeedTypeIcon(seed.type)}
            <Text style={[styles.typeText, { color: colors.primary, fontFamily: fontFamily.medium }]}>
              {seed.type}
            </Text>
          </View>
        </View>

        <ScrollView
          style={[styles.descriptionScroll, { backgroundColor: colors.surface, borderRadius: radius.sm }]}
          contentContainerStyle={styles.descriptionContent}
          showsVerticalScrollIndicator
          nestedScrollEnabled
          scrollEventThrottle={16}
          bounces
          alwaysBounceVertical={false}
        >
          <Text style={[styles.descriptionText, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
            {seed.description || 'No description available.'}
          </Text>
        </ScrollView>
      </View>

      {/* Bottom detail strip */}
      <View style={styles.bottom}>
        <View style={[styles.detailStrip, { backgroundColor: colors.surface }]}>
          <View style={styles.detailRow}>
            <Tally4 size={14} color={colors.textSecondary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: fontFamily.medium }]}>
              Quantity:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text, fontFamily: fontFamily.semiBold }]}>
              {seed.quantity} {seed.quantity_unit}
            </Text>
          </View>
          {seed.suppliers && (
            <View style={styles.detailRow}>
              <Truck size={14} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontFamily: fontFamily.medium }]}>
                Supplier:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text, fontFamily: fontFamily.semiBold }]}>
                {seed.suppliers.supplier_name}
              </Text>
            </View>
          )}
          <View style={styles.seasonRow}>
            <View style={[styles.seasonTag, { backgroundColor: colors.success }]}>
              <Text style={[styles.seasonText, { color: '#fff', fontFamily: fontFamily.semiBold }]}>
                Plant: {seed.planting_season}
              </Text>
            </View>
            <View style={[styles.seasonTag, { backgroundColor: colors.warning }]}>
              <Text style={[styles.seasonText, { color: '#fff', fontFamily: fontFamily.semiBold }]}>
                Harvest: {seed.harvest_season}
              </Text>
            </View>
          </View>
        </View>

        {/* Web action buttons */}
        {Platform.OS === 'web' && onEdit && onDelete && (
          <View style={[styles.webActions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.webHint, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              Double-click for calendar · Swipe or use buttons below
            </Text>
            <View style={styles.webButtonRow}>
              <Pressable
                style={[styles.webBtn, { backgroundColor: colors.warning }]}
                onPress={onEdit}
              >
                <Edit3 size={15} color="#fff" />
                <Text style={[styles.webBtnText, { fontFamily: fontFamily.medium }]}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.webBtn, { backgroundColor: colors.error, opacity: isDeleting ? 0.6 : 1 }]}
                onPress={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Trash2 size={15} color="#fff" />
                )}
                <Text style={[styles.webBtnText, { fontFamily: fontFamily.medium }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Chevron — mobile non-tablet only */}
      {Platform.OS !== 'web' && !isTablet && (
        <ChevronRight size={24} color={colors.textSecondary} style={styles.chevron} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    height: 680,
    ...shadows.md,
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  seedImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  seedName: {
    fontSize: fontSize.lg,
    flex: 1,
    flexWrap: 'wrap',
    marginRight: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: fontSize.sm,
  },
  descriptionScroll: {
    flex: 1,
    maxHeight: 200,
    minHeight: 180,
  },
  descriptionContent: {
    padding: spacing.sm,
    minHeight: 200,
  },
  descriptionText: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.4,
  },
  bottom: {},
  detailStrip: {
    margin: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
  },
  detailValue: {
    fontSize: fontSize.sm,
    marginLeft: 'auto',
  },
  seasonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  seasonTag: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  seasonText: {
    fontSize: fontSize.xs,
  },
  webActions: {
    margin: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 400,
    alignSelf: 'center',
  },
  webHint: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  webButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  webBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  webBtnText: {
    color: '#fff',
    fontSize: fontSize.sm,
  },
  chevron: {
    marginLeft: 'auto',
  },
});
