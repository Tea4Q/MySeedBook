import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { format, addMonths, startOfMonth, eachDayOfInterval, endOfMonth, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';

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

const calculateDates = (sowDate: Date, daysToGerminate: number, daysToHarvest: number): DateCalculation => {
  return {
    germinationDate: addDays(sowDate, daysToGerminate),
    harvestDate: addDays(sowDate, daysToHarvest),
  };
};

export default function CalendarScreen() {
  const params = useLocalSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<PlantingEvent[]>(mockEvents);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<PlantingEvent>>({
    category: 'sow',
    date: new Date(),
    seedId: params.seedId as string,
    seedName: params.seedName as string,
  });
  const [daysToGerminate, setDaysToGerminate] = useState('7');
  const [daysToHarvest, setDaysToHarvest] = useState('80');

  useEffect(() => {
    if (params.seedId && params.seedName) {
      setIsModalVisible(true);
      setNewEvent({
        ...newEvent,
        seedId: params.seedId as string,
        seedName: params.seedName as string,
      });
    }
  }, [params.seedId, params.seedName]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
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

  const handleAddEvent = () => {
    if (!newEvent.seedName || !newEvent.date || !newEvent.category) return;

    const eventToAdd: PlantingEvent = {
      id: Date.now().toString(),
      date: new Date(newEvent.date),
      seedName: newEvent.seedName,
      seedId: newEvent.seedId,
      category: newEvent.category as EventCategory,
      notes: newEvent.notes,
    };

    if (newEvent.category === 'sow') {
      const { germinationDate, harvestDate } = calculateDates(
        new Date(newEvent.date),
        parseInt(daysToGerminate, 10),
        parseInt(daysToHarvest, 10)
      );

      const relatedEvents: PlantingEvent[] = [
        {
          id: Date.now().toString() + '-germination',
          date: germinationDate,
          seedName: newEvent.seedName,
          seedId: newEvent.seedId,
          category: 'germination',
          notes: `Expected germination date for ${newEvent.seedName}`,
        },
        {
          id: Date.now().toString() + '-harvest',
          date: harvestDate,
          seedName: newEvent.seedName,
          seedId: newEvent.seedId,
          category: 'harvest',
          notes: `Estimated harvest date for ${newEvent.seedName}`,
        },
      ];

      setEvents([...events, eventToAdd, ...relatedEvents]);
    } else {
      setEvents([...events, eventToAdd]);
    }

    setIsModalVisible(false);
    setNewEvent({ category: 'sow', date: new Date() });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={previousMonth} style={styles.iconButton}>
          <ChevronLeft size={24} color="#2f9e44" />
        </Pressable>
        <Text style={styles.monthText}>
          {format(currentDate, 'MMMM yyyy')}
        </Text>
        <Pressable onPress={nextMonth} style={styles.iconButton}>
          <ChevronRight size={24} color="#2f9e44" />
        </Pressable>
      </View>

      <View style={styles.calendar}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
        
        {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.emptyDay} />
        ))}

        {days.map((date) => {
          const dateEvents = getEventsForDate(date);
          return (
            <View
              key={date.toISOString()}
              style={[
                styles.day,
                dateEvents.length > 0 && styles.dayWithEvent,
              ]}>
              <Text style={styles.dayText}>{date.getDate()}</Text>
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
            </View>
          );
        })}
      </View>

      <View style={styles.addEventContainer}>
        <Pressable style={styles.addEventButton} onPress={() => setIsModalVisible(true)}>
          <Plus size={24} color="#ffffff" />
          <Text style={styles.addEventText}>Add Event</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.eventList}>
        <Text style={styles.eventListTitle}>Events this month</Text>
        {events
          .filter(
            (event) =>
              event.date.getMonth() === currentDate.getMonth() &&
              event.date.getFullYear() === currentDate.getFullYear()
          )
          .map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <View
                style={[
                  styles.eventDot,
                  { backgroundColor: CATEGORY_COLORS[event.category] },
                ]}
              />
              <View style={styles.eventDetails}>
                <Text style={styles.eventCategory}>
                  {CATEGORY_LABELS[event.category]}
                </Text>
                <Text style={styles.eventDate}>
                  {format(event.date, 'MMMM d, yyyy')}
                </Text>
                <Text style={styles.eventText}>{event.seedName}</Text>
                {event.notes && (
                  <Text style={styles.eventNotes}>{event.notes}</Text>
                )}
              </View>
            </View>
          ))}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Event</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#666666" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Seed Name</Text>
                <TextInput
                  style={styles.input}
                  value={newEvent.seedName}
                  onChangeText={(text) => setNewEvent({ ...newEvent, seedName: text })}
                  placeholder="Enter seed name"
                  editable={!params.seedName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Type</Text>
                <View style={styles.categoryContainer}>
                  {(Object.keys(CATEGORY_COLORS) as EventCategory[]).map((category) => (
                    <Pressable
                      key={category}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor:
                            newEvent.category === category
                              ? CATEGORY_COLORS[category]
                              : '#ffffff',
                        },
                      ]}
                      onPress={() => setNewEvent({ ...newEvent, category })}>
                      <Text
                        style={[
                          styles.categoryButtonText,
                          {
                            color:
                              newEvent.category === category
                                ? '#ffffff'
                                : '#666666',
                          },
                        ]}>
                        {CATEGORY_LABELS[category]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {newEvent.category === 'sow' && (
                <View style={styles.calculationContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Days to Germination</Text>
                    <TextInput
                      style={styles.input}
                      value={daysToGerminate}
                      onChangeText={setDaysToGerminate}
                      keyboardType="numeric"
                      placeholder="Enter days to germination"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Days to Harvest</Text>
                    <TextInput
                      style={styles.input}
                      value={daysToHarvest}
                      onChangeText={setDaysToHarvest}
                      keyboardType="numeric"
                      placeholder="Enter days to harvest"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newEvent.notes}
                  onChangeText={(text) => setNewEvent({ ...newEvent, notes: text })}
                  placeholder="Add any notes about this event"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Pressable style={styles.addButton} onPress={handleAddEvent}>
                <Text style={styles.addButtonText}>Add Event</Text>
              </Pressable>
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e6f3e6',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: '#ffffff',
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#868e96',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayText: {
    fontSize: 16,
    color: '#212529',
  },
  dayWithEvent: {
    backgroundColor: '#f1f3f5',
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
    borderTopColor: '#e9ecef',
  },
  addEventButton: {
    backgroundColor: '#2f9e44',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addEventText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventList: {
    flex: 1,
    padding: 16,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212529',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
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
    color: '#666666',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
    color: '#868e96',
    marginBottom: 4,
  },
  eventText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
  eventNotes: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
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
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
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
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calculationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2f9e44',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
