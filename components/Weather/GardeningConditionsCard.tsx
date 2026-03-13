import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { GardeningConditions } from '../../types/weather';
import { useTheme, ThemeColors } from '@/lib/theme';

interface GardeningConditionsCardProps {
  conditions: GardeningConditions;
  onRecommendationPress?: (recommendation: string) => void;
}

export const GardeningConditionsCard: React.FC<GardeningConditionsCardProps> = ({ 
  conditions, 
  onRecommendationPress 
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const getSuitabilityColor = (suitability: string): string => {
    switch (suitability) {
      case 'excellent': return '#27AE60';
      case 'good': return '#2ECC71';
      case 'fair': return '#F39C12';
      case 'poor': return '#E74C3C';
      case 'unsuitable': return '#C0392B';
      default: return '#95A5A6';
    }
  };

  const getSuitabilityIcon = (suitability: string): keyof typeof FontAwesome5.glyphMap => {
    switch (suitability) {
      case 'excellent': return 'smile';
      case 'good': return 'smile';
      case 'fair': return 'meh';
      case 'poor': return 'frown';
      case 'unsuitable': return 'sad-tear';
      default: return 'question';
    }
  };

  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case 'ideal': return '#27AE60';
      case 'good': return '#2ECC71';
      case 'needed': return '#3498DB';
      case 'optional': return '#95A5A6';
      case 'challenging': return '#F39C12';
      case 'protect': return '#E67E22';
      case 'avoid': return '#E74C3C';
      case 'delay': return '#E74C3C';
      case 'workable': return '#27AE60';
      case 'soggy': return '#3498DB';
      case 'frozen': return '#9B59B6';
      case 'dry': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  const getConditionIcon = (condition: string, type: string): keyof typeof FontAwesome5.glyphMap => {
    if (type === 'planting') {
      switch (condition) {
        case 'ideal': return 'seedling';
        case 'good': return 'seedling';
        case 'challenging': return 'exclamation-triangle';
        case 'avoid': return 'times';
        default: return 'seedling';
      }
    }
    
    if (type === 'watering') {
      switch (condition) {
        case 'needed': return 'tint';
        case 'optional': return 'tint';
        case 'avoid': return 'ban';
        default: return 'tint';
      }
    }
    
    if (type === 'harvesting') {
      switch (condition) {
        case 'ideal': return 'apple-alt';
        case 'good': return 'apple-alt';
        case 'protect': return 'shield-alt';
        case 'delay': return 'clock';
        default: return 'apple-alt';
      }
    }
    
    if (type === 'soil') {
      switch (condition) {
        case 'workable': return 'mountain';
        case 'soggy': return 'water';
        case 'frozen': return 'snowflake';
        case 'dry': return 'sun';
        default: return 'mountain';
      }
    }
    
    return 'info';
  };

  const formatConditionText = (condition: string): string => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.suitabilityContainer}>
          <FontAwesome5 
            name={getSuitabilityIcon(conditions.suitability)} 
            size={24} 
            color={getSuitabilityColor(conditions.suitability)}
            style={styles.suitabilityIcon}
          />
          <View>
            <Text style={styles.suitabilityLabel}>Garden Conditions</Text>
            <Text style={[
              styles.suitabilityValue, 
              { color: getSuitabilityColor(conditions.suitability) }
            ]}>
              {formatConditionText(conditions.suitability)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.conditionsGrid}>
        <View style={styles.conditionItem}>
          <FontAwesome5 
            name={getConditionIcon(conditions.conditions.planting, 'planting')} 
            size={18} 
            color={getConditionColor(conditions.conditions.planting)}
          />
          <Text style={styles.conditionLabel}>Planting</Text>
          <Text style={[
            styles.conditionValue,
            { color: getConditionColor(conditions.conditions.planting) }
          ]}>
            {formatConditionText(conditions.conditions.planting)}
          </Text>
        </View>

        <View style={styles.conditionItem}>
          <FontAwesome5 
            name={getConditionIcon(conditions.conditions.watering, 'watering')} 
            size={18} 
            color={getConditionColor(conditions.conditions.watering)}
          />
          <Text style={styles.conditionLabel}>Watering</Text>
          <Text style={[
            styles.conditionValue,
            { color: getConditionColor(conditions.conditions.watering) }
          ]}>
            {formatConditionText(conditions.conditions.watering)}
          </Text>
        </View>

        <View style={styles.conditionItem}>
          <FontAwesome5 
            name={getConditionIcon(conditions.conditions.harvesting, 'harvesting')} 
            size={18} 
            color={getConditionColor(conditions.conditions.harvesting)}
          />
          <Text style={styles.conditionLabel}>Harvesting</Text>
          <Text style={[
            styles.conditionValue,
            { color: getConditionColor(conditions.conditions.harvesting) }
          ]}>
            {formatConditionText(conditions.conditions.harvesting)}
          </Text>
        </View>

        <View style={styles.conditionItem}>
          <FontAwesome5 
            name={getConditionIcon(conditions.conditions.soil, 'soil')} 
            size={18} 
            color={getConditionColor(conditions.conditions.soil)}
          />
          <Text style={styles.conditionLabel}>Soil</Text>
          <Text style={[
            styles.conditionValue,
            { color: getConditionColor(conditions.conditions.soil) }
          ]}>
            {formatConditionText(conditions.conditions.soil)}
          </Text>
        </View>
      </View>

      {conditions.warnings.length > 0 && (
        <View style={styles.warningsSection}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="exclamation-triangle" size={16} color="#E74C3C" />
            <Text style={styles.sectionTitle}>Warnings</Text>
          </View>
          {conditions.warnings.map((warning, index) => (
            <Text key={index} style={styles.warningText}>
              • {warning}
            </Text>
          ))}
        </View>
      )}

      {conditions.recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="lightbulb" size={16} color="#F39C12" />
            <Text style={styles.sectionTitle}>Recommendations</Text>
          </View>
          {conditions.recommendations.map((recommendation, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.recommendationItem}
              onPress={() => onRecommendationPress?.(recommendation)}
            >
              <Text style={styles.recommendationText}>
                • {recommendation}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {Object.keys(conditions.bestTimes).length > 0 && (
        <View style={styles.bestTimesSection}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="clock" size={16} color="#3498DB" />
            <Text style={styles.sectionTitle}>Best Times</Text>
          </View>
          {Object.entries(conditions.bestTimes).map(([activity, time]) => (
            <View key={activity} style={styles.bestTimeItem}>
              <Text style={styles.bestTimeActivity}>
                {formatConditionText(activity)}:
              </Text>
              <Text style={styles.bestTimeText}>{time}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      margin: 16,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      marginBottom: 20,
    },
    suitabilityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    suitabilityIcon: {
      marginRight: 12,
    },
    suitabilityLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
    },
    suitabilityValue: {
      fontSize: 20,
      fontWeight: 'bold',
      textTransform: 'capitalize',
    },
    conditionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    conditionItem: {
      width: '48%',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    conditionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 4,
    },
    conditionValue: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    warningsSection: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: '#FDF2F2',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#E74C3C',
    },
    recommendationsSection: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: '#FFFBF0',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#F39C12',
    },
    bestTimesSection: {
      padding: 12,
      backgroundColor: '#F0F8FF',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#3498DB',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    warningText: {
      fontSize: 14,
      color: colors.error,
      lineHeight: 20,
      marginBottom: 4,
    },
    recommendationItem: {
      marginBottom: 4,
    },
    recommendationText: {
      fontSize: 14,
      color: colors.warning,
      lineHeight: 20,
    },
    bestTimeItem: {
      marginBottom: 8,
    },
    bestTimeActivity: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textTransform: 'capitalize',
    },
    bestTimeText: {
      fontSize: 14,
      color: '#2980B9',
      marginTop: 2,
      lineHeight: 18,
    },
  });
}