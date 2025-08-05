/**
 * Example React Native Component with Portable Tablet Support
 * 
 * This demonstrates how to implement the responsive system in any React Native app.
 * Copy and adapt this pattern to your own components.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { useResponsive, getResponsiveValue, getResponsiveFontSize } from '../utils/responsive-portable';

// Sample data structure - replace with your own
interface ListItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
}

interface Props {
  data: ListItem[];
  onItemPress?: (item: ListItem) => void;
  onItemEdit?: (item: ListItem) => void;
  onItemDelete?: (item: ListItem) => void;
}

export default function ResponsiveListComponent({ 
  data, 
  onItemPress, 
  onItemEdit, 
  onItemDelete 
}: Props) {
  const responsive = useResponsive();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Dynamic styles based on responsive configuration
  const dynamicStyles = StyleSheet.create({
    container: {
      maxWidth: responsive.isTablet ? responsive.maxContentWidth : '100%',
      alignSelf: responsive.isTablet ? 'center' : 'stretch',
      width: '100%',
    },
    listContent: {
      padding: responsive.spacing.medium,
      paddingBottom: responsive.spacing.large * 2,
    },
    gridRow: {
      justifyContent: responsive.gridColumns > 2 ? 'space-between' : 'flex-start',
      paddingHorizontal: responsive.spacing.small,
    },
    item: {
      width: responsive.gridColumns > 1 ? responsive.cardWidth : '100%',
      marginBottom: responsive.spacing.medium,
      marginHorizontal: responsive.gridColumns > 2 ? 0 : responsive.spacing.small / 2,
    },
    itemContent: {
      padding: responsive.isTablet ? responsive.spacing.large : responsive.spacing.medium,
    },
    title: {
      fontSize: getResponsiveFontSize(18),
      marginBottom: responsive.spacing.small,
    },
    description: {
      fontSize: getResponsiveFontSize(14),
      marginBottom: responsive.spacing.medium,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: responsive.spacing.medium,
      paddingTop: responsive.spacing.medium,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    actionButton: {
      paddingVertical: responsive.spacing.small,
      paddingHorizontal: responsive.spacing.medium,
      borderRadius: 6,
      minWidth: getResponsiveValue(80, 100, 120),
    },
    editButton: {
      backgroundColor: '#4CAF50',
    },
    deleteButton: {
      backgroundColor: '#F44336',
    },
    buttonText: {
      color: 'white',
      fontSize: getResponsiveFontSize(12),
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  const handleItemPress = useCallback((item: ListItem) => {
    if (responsive.isTablet && Platform.OS !== 'web') {
      // On tablets, you might want different behavior
      // For example, show a detail view or enable multi-select
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedItems(newSelected);
    } else {
      onItemPress?.(item);
    }
  }, [responsive.isTablet, selectedItems, onItemPress]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <Pressable
        style={[
          styles.baseItem,
          dynamicStyles.item,
          isSelected && styles.selectedItem,
        ]}
        onPress={() => handleItemPress(item)}
      >
        <View style={dynamicStyles.itemContent}>
          {/* Image - responsive sizing */}
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={[
                styles.itemImage,
                {
                  height: getResponsiveValue(120, 140, 160),
                  marginBottom: responsive.spacing.small,
                }
              ]}
              resizeMode="cover"
            />
          )}
          
          {/* Content */}
          <Text style={[styles.itemTitle, dynamicStyles.title]}>{item.title}</Text>
          <Text style={[styles.itemDescription, dynamicStyles.description]}>
            {item.description}
          </Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          
          {/* Action buttons - show on tablets or web */}
          {(responsive.isTablet || Platform.OS === 'web') && (
            <View style={dynamicStyles.actionButtons}>
              <Pressable
                style={[dynamicStyles.actionButton, dynamicStyles.editButton]}
                onPress={() => onItemEdit?.(item)}
              >
                <Text style={dynamicStyles.buttonText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
                onPress={() => onItemDelete?.(item)}
              >
                <Text style={dynamicStyles.buttonText}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  }, [selectedItems, responsive, onItemEdit, onItemDelete, dynamicStyles, handleItemPress]);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header with responsive layout */}
      <View style={[
        styles.header,
        {
          flexDirection: responsive.isTablet && responsive.isLandscape ? 'row' : 'column',
          alignItems: responsive.isTablet && responsive.isLandscape ? 'center' : 'stretch',
          paddingHorizontal: responsive.spacing.medium,
          paddingVertical: responsive.spacing.large,
        }
      ]}>
        <Text style={[
          styles.headerTitle,
          {
            fontSize: getResponsiveFontSize(24),
            marginBottom: responsive.isTablet && responsive.isLandscape ? 0 : responsive.spacing.small,
            flex: responsive.isTablet && responsive.isLandscape ? 1 : undefined,
          }
        ]}>
          My Items ({data.length})
        </Text>
        
        {/* Show selection info on tablets */}
        {responsive.isTablet && selectedItems.size > 0 && (
          <Text style={[
            styles.selectionInfo,
            { fontSize: getResponsiveFontSize(14) }
          ]}>
            {selectedItems.size} selected
          </Text>
        )}
      </View>
      
      {/* List with responsive grid */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={responsive.gridColumns}
        key={`${responsive.gridColumns}-${responsive.isLandscape}`} // Force re-render on layout change
        columnWrapperStyle={responsive.gridColumns > 1 ? dynamicStyles.gridRow : undefined}
        contentContainerStyle={dynamicStyles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Footer actions for tablets */}
      {responsive.isTablet && selectedItems.size > 0 && (
        <View style={[
          styles.footerActions,
          { 
            paddingHorizontal: responsive.spacing.medium,
            paddingVertical: responsive.spacing.large,
          }
        ]}>
          <Pressable
            style={[styles.footerButton, { backgroundColor: '#2196F3' }]}
            onPress={() => setSelectedItems(new Set())}
          >
            <Text style={styles.footerButtonText}>Clear Selection</Text>
          </Pressable>
          <Pressable
            style={[styles.footerButton, { backgroundColor: '#FF9800' }]}
            onPress={() => {
              // Handle bulk actions
              console.log('Bulk action for:', Array.from(selectedItems));
            }}
          >
            <Text style={styles.footerButtonText}>Bulk Action</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// Base styles that don't change with responsive config
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333333',
  },
  selectionInfo: {
    color: '#666666',
    fontStyle: 'italic',
  },
  baseItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  itemImage: {
    width: '100%',
    borderRadius: 4,
  },
  itemTitle: {
    fontWeight: 'bold',
    color: '#333333',
  },
  itemDescription: {
    color: '#666666',
    lineHeight: 20,
  },
  itemCategory: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  footerButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Export for use in other components
export { ResponsiveListComponent };
