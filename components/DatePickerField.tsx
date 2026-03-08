import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import { Calendar as CalendarIcon, X } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/lib/theme';

interface DatePickerFieldProps {
  label?: string;
  helpText?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  required?: boolean;
}

export default function DatePickerField({
  label,
  helpText,
  value,
  onChange,
  error,
  required,
}: DatePickerFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select a date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const selectedDateKey = value ? value.toISOString().split('T')[0] : undefined;
  const markedDates = selectedDateKey
    ? { [selectedDateKey]: { selected: true, selectedColor: colors.primary, selectedTextColor: colors.primaryText } }
    : {};

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        {label && (
          <Text style={[styles.label, { color: colors.text }]}>
            {label}{required ? ' *' : ''}
          </Text>
        )}
        {helpText && <Text style={[styles.helpText, { color: colors.textSecondary }]}>{helpText}</Text>}
        <input
          type="date"
          title="Select purchase date"
          placeholder="Select a date"
          aria-label={label || 'Select date'}
          style={{
            background: colors.background,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.border,
            height: 56,
            boxSizing: 'border-box',
            width: '100%',
          } as any}
          value={value ? value.toISOString().split('T')[0] : ''}
          onChange={(e: any) => {
            const date = new Date(e.target.value + 'T00:00:00');
            if (!isNaN(date.getTime())) onChange(date);
          }}
        />
        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}{required ? ' *' : ''}
        </Text>
      )}
      {helpText && <Text style={[styles.helpText, { color: colors.textSecondary }]}>{helpText}</Text>}
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.buttonText, { color: value ? colors.text : colors.textSecondary }]}>
          {formatDate(value)}
        </Text>
        <CalendarIcon size={20} color={colors.primary} />
      </Pressable>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.modalBackground }]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
                <X size={22} color={colors.icon} />
              </Pressable>
            </View>
            <Calendar
              current={selectedDateKey || new Date().toISOString().split('T')[0]}
              markedDates={markedDates}
              onDayPress={(day: any) => {
                const date = new Date(day.dateString + 'T00:00:00');
                onChange(date);
                setOpen(false);
              }}
              theme={{
                backgroundColor: colors.card,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.primaryText,
                todayTextColor: colors.primaryText,
                todayBackgroundColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary + '60',
                dotColor: colors.primary,
                selectedDotColor: colors.primaryText,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
                textMonthFontWeight: '700' as any,
                textDayFontSize: 15,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
});

