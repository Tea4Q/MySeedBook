import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmartImage } from '@/components/SmartImage';
import { useTheme } from '@/lib/theme';
import { fontFamily, fontSize, radius, spacing } from '@/lib/tokens';

interface SeedImageCarouselProps {
  images: string[];
  visible: boolean;
  onClose: () => void;
  seedName?: string;
  initialIndex?: number;
}

export default function SeedImageCarousel({
  images,
  visible,
  onClose,
  seedName,
  initialIndex = 0,
}: SeedImageCarouselProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const flatListRef = React.useRef<FlatList<string>>(null);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1));
    setCurrentIndex(safeIndex);

    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: safeIndex,
        animated: false,
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [images.length, initialIndex, visible]);

  const handleMomentumScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!width) {
        return;
      }

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      setCurrentIndex(Math.max(0, Math.min(nextIndex, images.length - 1)));
    },
    [images.length, width]
  );

  if (!images.length) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(8, 10, 12, 0.94)' }]}>
          <View
            style={[
              styles.header,
              {
                paddingTop: Math.max(insets.top, spacing.md),
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <View style={styles.headerTextWrap}>
              {!!seedName && (
                <Text
                  style={[styles.seedName, { color: '#FFFFFF', fontFamily: fontFamily.bold }]}
                  numberOfLines={1}
                >
                  {seedName}
                </Text>
              )}
              <Text
                style={[
                  styles.counterText,
                  { color: 'rgba(255,255,255,0.75)', fontFamily: fontFamily.medium },
                ]}
              >
                {currentIndex + 1} / {images.length}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
              accessibilityRole="button"
              accessibilityLabel="Close image gallery"
            >
              <X size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <FlatList
            ref={flatListRef}
            data={images}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={[styles.slide, { width, height: Math.max(height - 140, 320) }]}>
                <SmartImage
                  uri={item}
                  style={styles.slideImage}
                  contentFit="contain"
                  fallbackUri="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=1200&fit=crop&crop=center&auto=format&q=60"
                />
              </View>
            )}
          />

          {images.length > 1 && (
            <View
              style={[
                styles.pagination,
                {
                  paddingBottom: Math.max(insets.bottom, spacing.md),
                },
              ]}
            >
              {images.map((imageUri, index) => (
                <View
                  key={`${imageUri}-dot-${index}`}
                  style={[
                    styles.dot,
                    index === currentIndex
                      ? styles.dotActive
                      : styles.dotInactive,
                    index === currentIndex && { backgroundColor: colors.primary },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  seedName: {
    fontSize: fontSize.lg,
  },
  counterText: {
    fontSize: fontSize.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  dotActive: {
    transform: [{ scale: 1.15 }],
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});