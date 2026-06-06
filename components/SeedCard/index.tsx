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
import SeedImageCarousel from '@/components/SeedImageCarousel';
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

const SUPABASE_URL = 'https://fodtwysfcqltykejkffn.supabase.co';
const SEED_IMAGE_BUCKET = 'seed-images';
const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&crop=center&auto=format&q=60';

function constructSeedImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith('/storage')) return `${SUPABASE_URL}${path}`;
  return `${SUPABASE_URL}/storage/v1/object/public/${SEED_IMAGE_BUCKET}/${path}`;
}

function getSeedImageUris(seed: Seed): string[] {
  if (!seed.seed_images) {
    return [];
  }

  if (Array.isArray(seed.seed_images)) {
    return seed.seed_images
      .map((image) => {
        if (!image || typeof image !== 'object' || typeof image.url !== 'string') {
          return null;
        }

        const trimmedUrl = image.url.trim();
        return trimmedUrl ? constructSeedImageUrl(trimmedUrl) : null;
      })
      .filter((imageUri): imageUri is string => Boolean(imageUri));
  }

  if (typeof seed.seed_images === 'string' && seed.seed_images.trim()) {
    return [constructSeedImageUrl(seed.seed_images.trim())];
  }

  return [];
}

function getSeedFallbackImageUri(seed: Seed): string {
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

/**
 * Resolves the best image URI for a seed. Falls back to an Unsplash image by type.
 */
function getSeedImageUri(seed: Seed): string {
  const imageUris = getSeedImageUris(seed);
  return imageUris[0] ?? getSeedFallbackImageUri(seed);
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
  const [isCarouselVisible, setIsCarouselVisible] = React.useState(false);
  const seedImageUris = getSeedImageUris(seed);
  const hasUploadedImages = seedImageUris.length > 0;
  const imageUri = getSeedImageUri(seed);

  return (
    <>
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
        <Pressable
          style={styles.imageContainer}
          onPress={hasUploadedImages ? () => setIsCarouselVisible(true) : undefined}
          disabled={!hasUploadedImages}
          accessibilityRole={hasUploadedImages ? 'button' : undefined}
          accessibilityLabel={hasUploadedImages ? `Open ${seed.seed_name} image gallery` : undefined}
        >
          <SmartImage
            uri={imageUri}
            style={styles.seedImage}
            resizeMode="cover"
            fallbackUri={DEFAULT_FALLBACK_IMAGE}
          />
          {hasUploadedImages && (
            <View style={[styles.imageBadge, { backgroundColor: 'rgba(0,0,0,0.58)' }]}>
              <Text style={[styles.imageBadgeText, { fontFamily: fontFamily.medium, color: '#fff' }]}>
                {seedImageUris.length} {seedImageUris.length === 1 ? 'photo' : 'photos'}
              </Text>
            </View>
          )}
        </Pressable>

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
                <Text
                  style={[styles.detailValue, { color: colors.text, fontFamily: fontFamily.semiBold }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
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

      <SeedImageCarousel
        images={seedImageUris}
        visible={isCarouselVisible}
        onClose={() => setIsCarouselVisible(false)}
        seedName={seed.seed_name}
      />
    </>
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
    position: 'relative',
  },
  seedImage: {
    width: '100%',
    height: 200,
  },
  imageBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  imageBadgeText: {
    fontSize: fontSize.xs,
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
    flex: 1,
    textAlign: 'right',
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
