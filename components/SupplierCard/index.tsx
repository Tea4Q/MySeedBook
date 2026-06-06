import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Edit } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { spacing, radius, shadows, fontFamily, fontSize } from '@/lib/tokens';

export type Supplier = {
  id: string;
  supplier_name: string;
  description?: string;
  webaddress?: string;
  email?: string;
  phone?: string;
  address?: string;
  specialties?: string[];
  rating?: number;
  supplier_image?: string;
  user_id?: string;
};

interface SupplierCardProps {
  supplier: Supplier;
  onSelect: () => void;
  onEdit?: () => void;
}

export function SupplierCard({ supplier, onSelect, onEdit }: SupplierCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadowColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {supplier.supplier_image ? (
        <Image source={{ uri: supplier.supplier_image }} style={styles.avatar} />
      ) : null}

      <View style={styles.textGroup}>
        <Text
          style={[styles.name, { color: colors.text, fontFamily: fontFamily.semiBold }]}
          numberOfLines={1}
        >
          {supplier.supplier_name}
        </Text>
        {supplier.description ? (
          <Text
            style={[styles.description, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}
            numberOfLines={2}
          >
            {supplier.description}
          </Text>
        ) : null}
      </View>

      {onEdit ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={styles.editBtn}
          hitSlop={8}
        >
          <Edit size={20} color={colors.primary} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  textGroup: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    marginBottom: spacing.xs / 2,
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  editBtn: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
});
