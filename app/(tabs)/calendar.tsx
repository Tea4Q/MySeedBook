import React, { useState, useEffect, useRef } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  format,
  addMonths,
  startOfMonth,
  eachDayOfInterval,
  endOfMonth,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
} from 'lucide-react-native';
import { supabase } from '@../../lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/lib/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import {useRouter} from 'expo-router';

type EventCategory = 'sow' | 'purchase' | 'harvest' | 'germination';

interface PlantingEvent {
  id: string;
  date: Date;
  seedName: string;
  seedId?: string;
  category: EventCategory;
  notes?: string;
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  sow: '#2f9e44',
  purchase: '#1971c2',
  harvest: '#e67700',
  germination: '#be4bdb',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  sow: 'Sowing Date',
  purchase: 'Purchase Date',
  harvest: 'Harvest Date',
  germination: 'Germination Date',
};

const mockEvents: PlantingEvent[] = [
  {
    id: '1',
    date: new Date(2024, 2, 15),
    seedName: 'Brandywine Tomato',
    seedId: '1',
    category: 'sow',
    notes: 'Start indoors under grow lights',
  },
  {
    id: '2',
    date: new Date(2024, 2, 20),
    seedName: 'Brandywine Tomato',
    seedId: '1',
    category: 'germination',
    notes: 'Expected germination date',
  },
  {
    id: '3',
    date: new Date(2024, 7, 15),
    seedName: 'Brandywine Tomato',
    seedId: '1',
    category: 'harvest',
    notes: 'Begin harvesting when fruits are pink and slightly soft',
  },
];

interface DateCalculation {
  germinationDate: Date;
  harvestDate: Date;
}

// Helper function to parse day ranges (e.g., "7-10" becomes 8.5, "7" becomes 7)
const parseDays = (daysString: string): number => {
  const trimmed = daysString.trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 2) {
      const min = parseInt(parts[0].trim(), 10);
      const max = parseInt(parts[1].trim(), 10);
      if (!isNaN(min) && !isNaN(max)) {
        return Math.round((min + max) / 2); // Use average and round to nearest whole day
      }
    }
  }
  const singleValue = parseInt(trimmed, 10);
  return isNaN(singleValue) ? 7 : singleValue; // Default to 7 if parsing fails
};

const calculateDates = (
  sowDate: Date,
  daysToGerminate: string | number,
  daysToHarvest: string | number
): DateCalculation => {
  const germinationDays = typeof daysToGerminate === 'string' 
    ? parseDays(daysToGerminate) 
    : daysToGerminate;
  const harvestDays = typeof daysToHarvest === 'string' 
    ? parseDays(daysToHarvest) 
    : daysToHarvest;

  return {
    germinationDate: addDays(sowDate, germinationDays),
    harvestDate: addDays(sowDate, harvestDays),
  };
};

export default function CalendarScreen() {
  const { colors } = useTheme(); // Add theme support
  const params = useLocalSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<PlantingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [markedRange, setMarkedRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const lastTap = useRef<number | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<PlantingEvent>>({
    category: 'sow',
    date: new Date(),
  });
  const [daysToGerminate, setDaysToGerminate] = useState('7');
  const [daysToHarvest, setDaysToHarvest] = useState('80');

  // Fetch event when component loads
  useEffect(() => {
    fetchEvents();
  }, []);

  // When the month changes, fetch events for the new month
  useEffect(() => {
    fetchEventsForMonth(currentDate);
  }, [currentDate]);

  useEffect(() => {
    if (isModalVisible) {
      fetchEventsForMonth(currentDate); // Fetch events for the current month when modal opens
      fetchEventsForMonth(currentDate); // Fetch events for the current month when modal opens
    }
  }, [isModalVisible]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*');

      if (error) throw error;
      if (!data) return;

      // Convert date string from database to date
      const formattedEvents = data.map((event: any) => ({
        ...event,
        date: new Date(event.date), // Convert event_date to Date
        category: event.category as EventCategory,
      }));

      setEvents(formattedEvents || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Optionally, fetch events for the current month for best performance
  const fetchEventsForMonth = async (date: Date) => {
    const startDate = startOfMonth(date).toISOString();
    const endDate = endOfMonth(date).toISOString();
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', startDate)
        .lte('event_date', endDate);
      // Convert date string from database to date
      // and format the events
      if (error) throw error;
      if (!data) return;

      const formattedEvents = data.map((event: any) => ({
        ...event,
        id: event.id,
        date: new Date(event.event_date),
        seedName: event.seed_name,
        seedId: event.seed_id,
        category: event.category as EventCategory,
        notes: event.notes,
      }));

      setEvents(formattedEvents || []);
    } catch (error) {
      console.error('Error fetching events for month:', error);
      alert('Failed to load events for the month. Please try again later.');
    }
  };

  // Fetch seed growth data (days to germinate/harvest) by seedId
  const fetchSeedGrowthData = async (seedId: string) => {
    try {
      const { data: seedData, error } = await supabase
        .from('seeds')
        .select('days_to_germinate, days_to_harvest')
        .eq('id', seedId)
        .maybeSingle();
      if (error) {
        console.error('Error fetching seed data:', error);  

        // Keep default values if fetch fails
        setDaysToGerminate('7');
        setDaysToHarvest('80');
        return;
      }
      if (seedData) {
        setDaysToGerminate(String(seedData.days_to_germinate ?? '7'));
        setDaysToHarvest(String(seedData.days_to_harvest ?? '80'));
      } else {
        // Seed not found, keep default values
        setDaysToGerminate('7');
        setDaysToHarvest('80');
      }
    } catch (error) {
      setDaysToGerminate('7');
      setDaysToHarvest('80');
    }
  };

  // Open add event modal if coming from double press in inventory
  useEffect(() => {
    if (params.openAddEvent === 'true') {
      openAddEventModal({ seedId: params.seedId as string, seedName: params.seedName as string });
    } else if (params.seedId && params.seedName) {
      setIsModalVisible(true); // If you still want to show the event list modal
      openAddEventModal({ seedId: params.seedId as string, seedName: params.seedName as string });
    }
    // else do nothing (default state)
  }, [params.openAddEvent, params.seedId, params.seedName]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(addMonths(currentDate, -1));

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const handleDatePress = (date: Date) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double-tap detected: open add event modal and pre-fill date
      openAddEventModal({ date });
      lastTap.current = null;
    } else {
      // Single tap: highlight the date
      lastTap.current = now;
      setMarkedRange({ start: date, end: null }); // Highlight the tapped date
    }
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    return events.filter(
      (event) =>
        event.date.getDate() === selectedDate.getDate() &&
        event.date.getMonth() === selectedDate.getMonth() &&
        event.date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleAddEvent = async () => {
    try {
      // Validate required fields
      if (!newEvent.seedName || !newEvent.date || !newEvent.category) {
        alert('Please fill in all fields.');
        return;
      }
      if (!newEvent.seedId || newEvent.seedId === '') {
        alert('Seed ID is required.');
        return;
      }

      // Insert the main event
      const { data: mainEventData, error: mainEventError } = await supabase
        .from('calendar_events')
        .insert({
          seed_id: newEvent.seedId,
          seed_name: newEvent.seedName,
          event_date: newEvent.date.toISOString(),
          category: newEvent.category,
          notes: newEvent.notes,
        })
        .select();

      if (mainEventError) {
        console.error('Error inserting event:', mainEventError);
        alert('Error adding event. Please try again.');
        return;
      }

      // If it's a sow event, calculate germination and harvest dates and insert them as well
      if (newEvent.category === 'sow') {
        const { germinationDate, harvestDate } = calculateDates(
          new Date(newEvent.date),
          daysToGerminate,
          daysToHarvest
        );

        // Insert germination event
        const { error: germError } = await supabase
          .from('calendar_events')
          .insert({
            seed_id: newEvent.seedId,
            seed_name: newEvent.seedName,
            event_date: germinationDate.toISOString(),
            category: 'germination',
            notes: `Expected germination date for ${newEvent.seedName}`,
          });
        if (germError) {
          console.error('Error inserting germination event:', germError);
          alert('Error adding germination event.');
          return;
        }

        // Insert harvest event
        const { error: harvestError } = await supabase
          .from('calendar_events')
          .insert({
            seed_id: newEvent.seedId,
            seed_name: newEvent.seedName,
            event_date: harvestDate.toISOString(),
            category: 'harvest',
            notes: `Estimated harvest date for ${newEvent.seedName}`,
          });
        if (harvestError) {
          console.error('Error inserting harvest event:', harvestError);
          alert('Error adding harvest event.');
          return;
        }
      }

      await fetchEventsForMonth(currentDate); // Refresh the events list
      setIsAddEventModalVisible(false); // Close the modal
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Error adding event. Please try again.');
    }
  };

  const handleDateChange = (date: Date) => {
    setNewEvent((prev) => ({ ...prev, date }));
    setShowDatePicker(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Remove the event from the local state
      setEvents(events.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Centralized function to open Add Event modal with pre-filled data
  const openAddEventModal = ({ seedId, seedName, date }: { seedId?: string; seedName?: string; date?: Date }) => {
    setNewEvent({
      category: 'sow',
      date: date || new Date(),
      seedId: seedId || '',
      seedName: seedName || '',
    });
    setIsAddEventModalVisible(true);
    // Optionally fetch seed growth data if seedId is provided
    if (seedId) {
      fetchSeedGrowthData(seedId);
    } else {
      setDaysToGerminate('7');
      setDaysToHarvest('80');
    }
  };

  // Inject responsive CSS for web to ensure row wraps vertically on mobile devices
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'calendar-modal-responsive-row';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @media (max-width: 600px) {
            .row {
              flex-direction: column !important;
              gap: 0 !important;
            }
            .row > div {
              max-width: 100% !important;
              min-width: 0 !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Inject responsive CSS for web to ensure Add Event modal row wraps on mobile
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Only inject once
      if (!document.getElementById('add-event-modal-responsive-css')) {
        const style = document.createElement('style');
        style.id = 'add-event-modal-responsive-css';
        style.textContent = `
          /* Responsive: Stack Add Event modal row vertically on small screens */
          .add-event-modal-row {
            flex-direction: row;
          }
          @media (max-width: 600px) {
            .add-event-modal-row {
              flex-direction: column !important;
              align-items: stretch !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Clean Header with Navigation */}
        <View style={styles.calendarHeader}>
          <Pressable onPress={previousMonth} style={[styles.iconButton, { backgroundColor: colors.surface }]}>
            <ChevronLeft size={24} color={colors.icon} />
          </Pressable>
          <Text style={[styles.monthText, { color: colors.text }]}>
            {format(currentDate, 'MMMM yyyy')}
          </Text>
          <Pressable onPress={nextMonth} style={[styles.iconButton, { backgroundColor: colors.surface }]}>
            <ChevronRight size={24} color={colors.icon} />
          </Pressable>
        </View>

        <View style={[styles.calendar, { backgroundColor: colors.card }]}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={[styles.weekDay, { color: colors.textSecondary }]}>
              {day}
            </Text>
          ))}

          {days.map((date) => {
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isInRange =
              markedRange.start &&
              markedRange.end &&
              date >= markedRange.start &&
              date <= markedRange.end;
            const isStart =
              markedRange.start &&
              date.getTime() === markedRange.start.getTime();
            const isEnd =
              markedRange.end && date.getTime() === markedRange.end.getTime();

            const dateEvents = events.filter(
              (event) =>
                event.date.getDate() === date.getDate() &&
                event.date.getMonth() === date.getMonth() &&
                event.date.getFullYear() === date.getFullYear()
            );

            return (
              
              <Pressable
                key={date.toISOString()}
                style={[
                  styles.day,
                  !isCurrentMonth && [styles.dayOtherMonth, { opacity: 0.4 }],
                  isInRange && [styles.dayInRange, { backgroundColor: colors.success + '40' }], // 40 = 25% opacity
                  isStart && [styles.dayStart, { backgroundColor: colors.primary + '80' }], // 80 = 50% opacity  
                  isEnd && [styles.dayEnd, { backgroundColor: colors.error + '80' }], // 80 = 50% opacity
                  dateEvents.length > 0 && [styles.dayWithEvent, { backgroundColor: colors.surface }],
                ]}
                onPress={() => handleDatePress(date)}
              >
                <Text style={[
                  styles.dayText, 
                  { color: isCurrentMonth ? colors.text : colors.textSecondary }
                ]}>
                  {date.getDate()}
                </Text>
                <View style={styles.eventIndicators}>
                  {dateEvents.map((event) => (
                    <View
                      key={event.id}
                      style={[
                        styles.eventIndicator,
                        { backgroundColor: CATEGORY_COLORS[event.category] },
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.resetButton, { backgroundColor: colors.error }]}
          onPress={() => setMarkedRange({ start: null, end: null })}
        >
          <Text style={[styles.resetButtonText, { color: colors.primaryText }]}>Reset Range</Text>
        </Pressable>

        {/* Add Event Button */}
        <View style={[styles.addEventContainer, { borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.addEventButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              openAddEventModal({});
            }}
          >
            <Plus size={24} color={colors.primaryText} />
            <Text style={[styles.addEventText, { color: colors.primaryText }]}>Add Event</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading events...</Text>
          </View>
        ) : (
          <ScrollView style={styles.eventList}>
            <Text style={[styles.eventListTitle, { color: colors.text }]}>Events this month</Text>
            {events
              .filter(
                (event) =>
                  event.date.getMonth() === currentDate.getMonth() &&
                  event.date.getFullYear() === currentDate.getFullYear()
              )
              .map((event) => (
                <View key={event.id} style={[styles.eventItem, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.eventDot,
                      { backgroundColor: CATEGORY_COLORS[event.category] },
                    ]}
                  />
                  <View style={styles.eventDetails}>
                    <Text style={[styles.eventCategory, { color: colors.textSecondary }]}>
                      {CATEGORY_LABELS[event.category]}
                    </Text>
                    <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                      {format(event.date, 'MMMM d, yyyy')}
                    </Text>
                    <Text style={[styles.eventText, { color: colors.text }]}>{event.seedName}</Text>
                    {event.notes && (
                      <Text style={[styles.eventNotes, { color: colors.textSecondary }]}>{event.notes}</Text>
                    )}
                  </View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 size={20} color={colors.error} />
                  </Pressable>
                </View>
              ))}
          </ScrollView>
        )}
      </KeyboardAwareScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={isAddEventModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddEventModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Event</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsAddEventModalVisible(false)}
              >
                <X size={24} color={colors.icon} />
              </Pressable>
            </View>

            { /* Show Event List */}
            <ScrollView style={styles.modalScroll}>
              {/* Add Event Form */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Seed Name</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground, 
                    color: colors.inputText,
                    borderColor: colors.inputBorder 
                  }]}
                  value={newEvent.seedName ?? ''}
                  onChangeText={(text) =>
                    setNewEvent({ ...newEvent, seedName: text })
                  }
                  placeholder="Enter seed name"
                  placeholderTextColor={colors.textSecondary}
                  editable={true}
                />
              </View>

              {/* Event Type  Event Date Row */}
              <View style={styles.row}>
                <View style={styles.rowInputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Event Type</Text>
                  <View style={styles.categoryContainer}>
                    {(Object.keys(CATEGORY_COLORS) as EventCategory[]).map(
                      (category) => (
                        <Pressable
                          key={category}
                          style={[
                            styles.categoryButton,
                            {
                              backgroundColor:
                                newEvent.category === category
                                  ? CATEGORY_COLORS[category]
                                  : colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => setNewEvent({ ...newEvent, category })}
                        >
                          <Text
                            style={[
                              styles.categoryButtonText,
                              {
                                color:
                                  newEvent.category === category
                                    ? colors.primaryText
                                    : colors.text,
                              },
                            ]}
                          >
                            {CATEGORY_LABELS[category]}
                          </Text>
                        </Pressable>
                      )
                    )}
                  </View>
                </View>
                <View style={styles.rowInputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Event Date</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      className="date-input"
                      value={
                        newEvent.date
                          ? newEvent.date.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        const date = new Date(e.target.value + 'T00:00:00');
                        if (!isNaN(date.getTime())) handleDateChange(date);
                      }}
                      placeholder="Select a date"
                      title="Select event date"
                    />
                  ) : (
                    <>
                      <Pressable
                        style={[styles.datePickerContainer, {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.inputBorder
                        }]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={[styles.dateText, { color: colors.inputText }]}>
                          {newEvent.date
                            ? format(newEvent.date, 'MMM d, yyyy')
                            : 'Select a date'}
                        </Text>
                        <Calendar size={20} color={colors.primary} />
                      </Pressable>
                      {showDatePicker && (
                        <DateTimePicker
                          value={newEvent.date || new Date()}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              handleDateChange(selectedDate);
                            }
                            setShowDatePicker(false);
                          }}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>

              {/* Days to Germination and Harvest */}

              {newEvent.category === 'sow' && (
                <View style={[styles.calculationContainer, { backgroundColor: colors.surface }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Days to Germination</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: colors.inputBackground, 
                        color: colors.inputText,
                        borderColor: colors.inputBorder 
                      }]}
                      value={daysToGerminate}
                      onChangeText={setDaysToGerminate}
                      placeholder="e.g., 7 or 7-10"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Days to Harvest</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: colors.inputBackground, 
                        color: colors.inputText,
                        borderColor: colors.inputBorder 
                      }]}
                      value={daysToHarvest}
                      onChangeText={setDaysToHarvest}
                      placeholder="e.g., 80 or 80-90"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              )}

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: colors.inputBackground, 
                    color: colors.inputText,
                    borderColor: colors.inputBorder 
                  }]}
                  value={newEvent.notes}
                  onChangeText={(text) =>
                    setNewEvent({ ...newEvent, notes: text })
                  }
                  placeholder="Add any notes about this event"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>


              {/* Submit Button */}
              <Pressable style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddEvent}>
                <Text style={[styles.addButtonText, { color: colors.primaryText }]}>Add Event</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Events Modal*/}
      <Modal
        visible={isEventModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEventModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Events for{' '}
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
              </Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsEventModalVisible(false)}
              >
                <X size={24} color={colors.icon} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {getEventsForSelectedDate().length > 0 ? (
                getEventsForSelectedDate().map((event) => (
                  <View key={event.id} style={[styles.eventItem, { backgroundColor: colors.surface }]}>
                    <View
                      style={[
                        styles.eventDot,
                        { backgroundColor: CATEGORY_COLORS[event.category] },
                      ]}
                    />
                    <View style={styles.eventDetails}>
                      <Text style={[styles.eventCategory, { color: colors.textSecondary }]}>
                        {CATEGORY_LABELS[event.category]}
                      </Text>
                      <Text style={[styles.eventText, { color: colors.text }]}>{event.seedName}</Text>
                      {event.notes && (
                        <Text style={[styles.eventNotes, { color: colors.textSecondary }]}>{event.notes}</Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>No events for this day.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayText: {
    fontSize: 16,
  },
  dayOtherMonth: {
    // Style for dates from previous/next month
  },
  dayWithEvent: {
    borderRadius: 8,
  },
  dayInRange: {
    borderRadius: 8,
  },
  dayStart: {
    borderRadius: 8,
  },
  dayEnd: {
    borderRadius: 8,
  },
  eventIndicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  eventIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  addEventContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addEventText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8, // Add space between columns
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  rowInputGroup: {
    flex: 1,
    gap: 8, // Add space between label and input
    alignItems: 'center', // Center content horizontally
  },
  eventList: {
    flex: 1,
    padding: 16,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  eventDetails: {
    flex: 1,
  },
  eventCategory: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventText: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventNotes: {
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', // Changed from 'flex-end' to 'center'
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalScroll: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    gap: 8,
  },
  categoryButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calculationContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerButton: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  // Add a compact, centered modal date picker wrapper
  modalDatePickerWrapper: {
    width: 220, // Changed from '100%' to 220 for a compact input
    maxWidth: '90%', // Prevents overflow on small screens
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    // display: 'block', // Ensures input is block-level
    marginLeft: 'auto', // Center horizontally
    marginRight: 'auto',
  },
  dateText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  noEventsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

// Injected CSS for date input on web - using safer CSS injection
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'calendar-date-input-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .date-input {
        width: 220px !important;
        max-width: 90% !important;
        font-size: 16px !important;
        padding: 12px !important;
        border-radius: 8px !important;
        border: 1px solid #e9ecef !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.08) !important;
        display: block !important;
        margin-left: auto !important;
        margin-right: auto !important;
        background-color: var(--input-background, #f8f9fa) !important;
        color: var(--input-text, #212529) !important;
      }
    `;
    document.head.appendChild(style);
  }
}
