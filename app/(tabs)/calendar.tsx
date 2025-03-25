import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { format, addMonths, startOfMonth, eachDayOfInterval, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

type PlantingEvent = {
  date: Date;
  seedName: string;
  action: 'plant' | 'harvest';
};

const mockEvents: PlantingEvent[] = [
  {
    date: new Date(2024, 2, 15),
    seedName: 'Brandywine Tomato',
    action: 'plant',
  },
  {
    date: new Date(2024, 7, 15),
    seedName: 'Brandywine Tomato',
    action: 'harvest',
  },
];

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState<PlantingEvent[]>(mockEvents);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const previousMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
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
              {dateEvents.map((event, index) => (
                <View
                  key={index}
                  style={[
                    styles.eventIndicator,
                    { backgroundColor: event.action === 'plant' ? '#2f9e44' : '#e67700' },
                  ]}
                />
              ))}
            </View>
          );
        })}
      </View>

      <ScrollView style={styles.eventList}>
        <Text style={styles.eventListTitle}>Events this month</Text>
        {events
          .filter(
            (event) =>
              event.date.getMonth() === currentDate.getMonth() &&
              event.date.getFullYear() === currentDate.getFullYear()
          )
          .map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <View
                style={[
                  styles.eventDot,
                  { backgroundColor: event.action === 'plant' ? '#2f9e44' : '#e67700' },
                ]}
              />
              <View>
                <Text style={styles.eventDate}>
                  {format(event.date, 'MMMM d, yyyy')}
                </Text>
                <Text style={styles.eventText}>
                  {event.action === 'plant' ? 'Plant' : 'Harvest'} {event.seedName}
                </Text>
              </View>
            </View>
          ))}
      </ScrollView>
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
  eventIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
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
    alignItems: 'center',
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
  },
  eventDate: {
    fontSize: 14,
    color: '#868e96',
  },
  eventText: {
    fontSize: 16,
    color: '#212529',
    marginTop: 2,
  },
});