import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Component,
} from 'react';
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
  Animated,
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
  isToday,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Calendar,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/lib/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarWeatherIcon } from '../../components/Weather/AnimatedWeatherIcon';
import { WeatherDetailModal } from '../../components/Weather/WeatherDetailModal';
import { calendarWeatherService } from '../../lib/services/calendarWeatherService';
import { usePremiumFeature } from '../../hooks/usePremiumFeature';

// ─── Weather error boundary ───────────────────────────────────────────────────
class WeatherIconBoundary extends Component<
  { children: React.ReactNode },
  { crashed: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  render() {
    if (this.state.crashed) return <View style={{ width: 36, height: 36 }} />;
    return this.props.children;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type EventCategory =
  | 'sow'
  | 'purchase'
  | 'harvest'
  | 'germination'
  | 'transplant';

interface PlantingEvent {
  id: string;
  date: Date;
  seedName: string;
  seedId?: string;
  category: EventCategory;
  notes?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<EventCategory, string> = {
  sow: '#2f9e44',
  purchase: '#1971c2',
  harvest: '#e67700',
  germination: '#be4bdb',
  transplant: '#0c8599',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  sow: 'Sowing',
  purchase: 'Purchase',
  harvest: 'Harvest',
  germination: 'Germination',
  transplant: 'Transplant',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseDays = (daysString: string): number => {
  const trimmed = daysString.trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 2) {
      const min = parseInt(parts[0].trim(), 10);
      const max = parseInt(parts[1].trim(), 10);
      if (!isNaN(min) && !isNaN(max)) return Math.round((min + max) / 2);
    }
  }
  const single = parseInt(trimmed, 10);
  return isNaN(single) ? 7 : single;
};

// ─── Legend ───────────────────────────────────────────────────────────────────
function CategoryLegend({ colors }: { colors: any }) {
  return (
    <View style={[legendStyles.wrap, { backgroundColor: colors.surface }]}>
      {(Object.keys(CATEGORY_COLORS) as EventCategory[]).map((cat) => (
        <View key={cat} style={legendStyles.item}>
          <View
            style={[
              legendStyles.dot,
              { backgroundColor: CATEGORY_COLORS[cat] },
            ]}
          />
          <Text style={[legendStyles.label, { color: colors.textSecondary }]}>
            {CATEGORY_LABELS[cat]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const legendStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
function DayPanel({
  date,
  events,
  colors,
  onAddEvent,
  onDeleteEvent,
  onClose,
}: {
  date: Date | null;
  events: PlantingEvent[];
  colors: any;
  onAddEvent: () => void;
  onDeleteEvent: (id: string) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (date) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [date, slideAnim]);

  if (!date) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={[
        panelStyles.panel,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: slideAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Panel header */}
      <View style={[panelStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[panelStyles.dateLabel, { color: colors.text }]}>
          {format(date, 'EEEE, MMMM d')}
        </Text>
        <View style={panelStyles.headerActions}>
          <Pressable
            style={[panelStyles.addBtn, { backgroundColor: colors.primary }]}
            onPress={onAddEvent}
          >
            <Plus size={13} color={colors.primaryText} />
            <Text style={[panelStyles.addBtnText, { color: colors.primaryText }]}>
              Add event
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={panelStyles.closeBtn}>
            <X size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Event list */}
      {events.length === 0 ? (
        <View style={panelStyles.empty}>
          <Text style={[panelStyles.emptyText, { color: colors.textSecondary }]}>
            {'No events — tap "+ Add event" to schedule one'}
          </Text>
        </View>
      ) : (
        events.map((event) => (
          <View
            key={event.id}
            style={[panelStyles.eventRow, { borderBottomColor: colors.border }]}
          >
            <View
              style={[
                panelStyles.pill,
                {
                  backgroundColor: CATEGORY_COLORS[event.category] + '22',
                },
              ]}
            >
              <Text
                style={[
                  panelStyles.pillText,
                  { color: CATEGORY_COLORS[event.category] },
                ]}
              >
                {CATEGORY_LABELS[event.category]}
              </Text>
            </View>
            <View style={panelStyles.eventInfo}>
              <Text
                style={[panelStyles.seedName, { color: colors.text }]}
                numberOfLines={1}
              >
                {event.seedName}
              </Text>
              {event.notes ? (
                <Text
                  style={[panelStyles.noteText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {event.notes}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => onDeleteEvent(event.id)}
              style={panelStyles.delBtn}
              hitSlop={8}
            >
              <Trash2 size={15} color={colors.error} />
            </Pressable>
          </View>
        ))
      )}
    </Animated.View>
  );
}

const panelStyles = StyleSheet.create({
  panel: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  empty: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    flexShrink: 0,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventInfo: {
    flex: 1,
    minWidth: 0,
  },
  seedName: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 11,
    marginTop: 1,
  },
  delBtn: {
    padding: 4,
    flexShrink: 0,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { colors } = useTheme();
  const { checkFeature } = usePremiumFeature();
  const params = useLocalSearchParams();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<PlantingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsError, setEventsError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);

  // Weather
  const [weatherData, setWeatherData] = useState<{ [key: string]: any }>({});
  const [selectedDateWeather, setSelectedDateWeather] = useState<any>(null);
  const [isWeatherModalVisible, setIsWeatherModalVisible] = useState(false);

  // Add event form
  const [newEvent, setNewEvent] = useState<Partial<PlantingEvent>>({
    category: 'sow',
    date: new Date(),
  });
  const [daysToGerminate, setDaysToGerminate] = useState('7');
  const [daysToHarvest, setDaysToHarvest] = useState('80');
  const [seedInventory, setSeedInventory] = useState<
    {
      id: string;
      seed_name: string;
      days_to_germinate?: string | number;
      days_to_harvest?: string | number;
    }[]
  >([]);
  const [showSeedDropdown, setShowSeedDropdown] = useState(false);

  // ── Weather ────────────────────────────────────────────────────────────────
  const fetchWeatherForMonth = useCallback(
    async (date: Date) => {
      if (!checkFeature('weather_integration')) return;
      try {
        const days = eachDayOfInterval({
          start: startOfMonth(date),
          end: endOfMonth(date),
        });
        const monthly: { [key: string]: any } = {};
        for (const day of days) {
          const wd = await calendarWeatherService.getWeatherForDate(day);
          if (wd) monthly[format(day, 'yyyy-MM-dd')] = wd;
        }
        setWeatherData(monthly);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    },
    [checkFeature]
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchEventsForMonth(currentDate);
    fetchWeatherForMonth(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    setEventsError(false);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) return;
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      setEvents(
        (data || []).map((e: any) => ({
          id: e.id,
          date: new Date(e.event_date),
          seedName: e.seed_name,
          seedId: e.seed_id,
          category: e.category as EventCategory,
          notes: e.notes,
        }))
      );
    } catch (error) {
      console.error('Error fetching events:', error);
      setEventsError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsForMonth = async (date: Date) => {
    setLoading(true);
    setEventsError(false);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) return;
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_date', startOfMonth(date).toISOString())
        .lte('event_date', endOfMonth(date).toISOString());
      if (error) throw error;
      setEvents(
        (data || []).map((e: any) => ({
          id: e.id,
          date: new Date(e.event_date),
          seedName: e.seed_name,
          seedId: e.seed_id,
          category: e.category as EventCategory,
          notes: e.notes,
        }))
      );
    } catch (error) {
      console.error('Error fetching month events:', error);
      setEventsError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeedGrowthData = async (seedId: string) => {
    try {
      const { data, error } = await (supabase.from('seeds') as any)
        .select('days_to_germinate, days_to_harvest')
        .eq('id', seedId)
        .maybeSingle();
      if (error || !data) {
        setDaysToGerminate('7');
        setDaysToHarvest('80');
        return;
      }
      setDaysToGerminate(String(data.days_to_germinate ?? '7'));
      setDaysToHarvest(String(data.days_to_harvest ?? '80'));
    } catch {
      setDaysToGerminate('7');
      setDaysToHarvest('80');
    }
  };

  const fetchSeedInventory = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase.from('seeds') as any)
        .select('id, seed_name, days_to_germinate, days_to_harvest')
        .is('deleted_at', null)
        .eq('user_id', user.id)
        .order('seed_name');
      setSeedInventory(data || []);
    } catch {
      /* silent */
    }
  }, []);

  // ── Open add-event modal ───────────────────────────────────────────────────
  const openAddEventModal = useCallback(
    ({
      seedId,
      seedName,
      date,
    }: {
      seedId?: string;
      seedName?: string;
      date?: Date;
    }) => {
      setNewEvent({
        category: 'sow',
        date: date || selectedDate || new Date(),
        seedId: seedId || '',
        seedName: seedName || '',
      });
      setShowSeedDropdown(false);
      setIsAddEventModalVisible(true);
      fetchSeedInventory();
      if (seedId) {
        fetchSeedGrowthData(seedId);
      } else {
        setDaysToGerminate('7');
        setDaysToHarvest('80');
      }
    },
    [fetchSeedInventory, selectedDate]
  );

  // ── Deep-link params ───────────────────────────────────────────────────────
  useEffect(() => {
    let shouldClear = false;
    if (params.openAddEvent === 'true') {
      openAddEventModal({
        seedId: params.seedId as string,
        seedName: params.seedName as string,
      });
      shouldClear = true;
    } else if (params.seedId && params.seedName) {
      openAddEventModal({
        seedId: params.seedId as string,
        seedName: params.seedName as string,
      });
      shouldClear = true;
    }
    if (shouldClear) {
      router.setParams({
        openAddEvent: undefined,
        seedId: undefined,
        seedName: undefined,
      });
    }
  }, [params.openAddEvent, params.seedId, params.seedName, openAddEventModal]);

  // ── Calendar grid days ─────────────────────────────────────────────────────
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(addMonths(currentDate, -1));

  const getEventsForDate = (date: Date) =>
    events.filter(
      (e) =>
        e.date.getDate() === date.getDate() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getFullYear() === date.getFullYear()
    );

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleAddEvent = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        alert('You must be logged in to add events.');
        return;
      }
      if (!newEvent.seedName || !newEvent.date || !newEvent.category) {
        alert('Please fill in all fields.');
        return;
      }

      const { error: mainErr } = await (supabase.from('calendar_events') as any)
        .insert({
          seed_id: newEvent.seedId || null,
          seed_name: newEvent.seedName,
          event_date: newEvent.date.toISOString(),
          category: newEvent.category,
          notes: newEvent.notes,
          user_id: user.id,
        })
        .select();
      if (mainErr) {
        alert('Error adding event. Please try again.');
        return;
      }

      if (newEvent.category === 'sow') {
        const germDate = addDays(
          new Date(newEvent.date),
          parseDays(daysToGerminate)
        );
        await (supabase.from('calendar_events') as any).insert({
          seed_id: newEvent.seedId,
          seed_name: newEvent.seedName,
          event_date: germDate.toISOString(),
          category: 'germination',
          notes: `Expected germination for ${newEvent.seedName}`,
          user_id: user.id,
        });
      }

      if (newEvent.category === 'transplant') {
        const harvestDate = addDays(
          new Date(newEvent.date),
          parseDays(daysToHarvest)
        );
        await (supabase.from('calendar_events') as any).insert({
          seed_id: newEvent.seedId,
          seed_name: newEvent.seedName,
          event_date: harvestDate.toISOString(),
          category: 'harvest',
          notes: `Expected harvest for ${newEvent.seedName} (transplanted)`,
          user_id: user.id,
        });
      }

      await fetchEvents();
      setIsAddEventModalVisible(false);
      // Refresh the panel for the chosen date
      if (newEvent.date) setSelectedDate(new Date(newEvent.date));
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Error adding event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    }
  };

  const handleDateChange = (date: Date) => {
    setNewEvent((prev) => ({ ...prev, date }));
    setShowDatePicker(false);
  };

  // ── Web CSS injection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'calendar-web-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .cal-date-input {
        width: 100%;
        font-size: 15px;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        background: #f8f9fa;
        color: #212529;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Events load error ── */}
        {eventsError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.errorBannerText, { color: colors.text }]}>
              Unable to load events. Check your connection and try again.
            </Text>
            <Pressable
              onPress={() => fetchEventsForMonth(currentDate)}
              style={[styles.errorRetryBtn, { borderColor: colors.primary }]}
            >
              <Text style={[styles.errorRetryText, { color: colors.primary }]}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* ── Month navigation ── */}
        <View style={styles.calendarHeader}>
          <Pressable
            onPress={previousMonth}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <ChevronLeft size={22} color={colors.icon} />
          </Pressable>
          <Text style={[styles.monthText, { color: colors.text }]}>
            {format(currentDate, 'MMMM yyyy')}
          </Text>
          <Pressable
            onPress={nextMonth}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <ChevronRight size={22} color={colors.icon} />
          </Pressable>
        </View>

        {/* ── Calendar grid ── */}
        <View style={[styles.calendar, { backgroundColor: colors.card }]}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <Text
              key={d}
              style={[styles.weekDay, { color: colors.textSecondary }]}
            >
              {d}
            </Text>
          ))}

          {days.map((date) => {
            const inMonth = isSameMonth(date, currentDate);
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayWeather = weatherData[dateKey];
            const dateEvents = getEventsForDate(date);
            const isSelected =
              selectedDate &&
              selectedDate.getDate() === date.getDate() &&
              selectedDate.getMonth() === date.getMonth() &&
              selectedDate.getFullYear() === date.getFullYear();
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <Pressable
                key={date.toISOString()}
                onPress={() => {
                  if (
                    isSelected &&
                    selectedDate?.getTime() === date.getTime()
                  ) {
                    // Tap selected date again to open add-event
                    openAddEventModal({ date });
                  } else {
                    setSelectedDate(date);
                  }
                }}
                style={[
                  styles.day,
                  !inMonth && { opacity: 0.35 },
                  dateEvents.length > 0 && [
                    styles.dayWithEvent,
                    { backgroundColor: colors.surface },
                  ],
                  isSelected && [
                    styles.daySelected,
                    {
                      backgroundColor: colors.primary + '18',
                      borderColor: colors.primary,
                    },
                  ],
                  isToday && !isSelected && styles.dayToday,
                ]}
              >
                <View style={styles.dayContent}>
                  {/* Weather icon (premium) */}
                  {checkFeature('weather_integration') && inMonth ? (
                    dayWeather ? (
                      <View style={styles.weatherIconContainer}>
                        <Pressable
                          onPress={() => {
                            setSelectedDateWeather(dayWeather);
                            setSelectedDate(date);
                            setIsWeatherModalVisible(true);
                          }}
                        >
                          <WeatherIconBoundary>
                            <CalendarWeatherIcon
                              weatherCode={
                                dayWeather.condition?.icon ||
                                dayWeather.condition?.main ||
                                dayWeather.weather?.[0]?.id ||
                                'unknown'
                              }
                              size="small"
                            />
                          </WeatherIconBoundary>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.weatherIconPlaceholder} />
                    )
                  ) : null}

                  {/* Date number */}
                  <View
                    style={[
                      styles.dateCircle,
                      isToday && [
                        styles.todayCircle,
                        { backgroundColor: colors.primary },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isToday
                            ? colors.primaryText
                            : inMonth
                            ? colors.text
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </View>

                {/* Event dots */}
                <View style={styles.eventIndicators}>
                  {dateEvents.slice(0, 4).map((event) => (
                    <View
                      key={event.id}
                      style={[
                        styles.eventIndicator,
                        { backgroundColor: CATEGORY_COLORS[event.category] },
                      ]}
                    />
                  ))}
                  {dateEvents.length > 4 && (
                    <View
                      style={[
                        styles.eventIndicator,
                        { backgroundColor: colors.textSecondary },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Legend ── */}
        <CategoryLegend colors={colors} />

        {/* ── Day detail panel (replaces event list + reset button) ── */}
        {selectedDate && (
          <DayPanel
            date={selectedDate}
            events={getEventsForDate(selectedDate)}
            colors={colors}
            onAddEvent={() => openAddEventModal({ date: selectedDate })}
            onDeleteEvent={handleDeleteEvent}
            onClose={() => setSelectedDate(null)}
          />
        )}

        {/* ── Global "Add Event" FAB ── */}
        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => openAddEventModal({})}
        >
          <Plus size={22} color={colors.primaryText} />
          <Text style={[styles.fabText, { color: colors.primaryText }]}>
            Add Event
          </Text>
        </Pressable>

        {/* ── Loading indicator ── */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text
              style={[styles.loadingText, { color: colors.textSecondary }]}
            >
              Loading events…
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* ════════════════════════════════════════════════
          Add Event Modal
      ════════════════════════════════════════════════ */}
      <Modal
        visible={isAddEventModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddEventModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.modalBackground },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add New Event
              </Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsAddEventModalVisible(false)}
              >
                <X size={22} color={colors.icon} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Seed name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Seed Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.inputText,
                      borderColor: newEvent.seedId
                        ? colors.primary
                        : colors.inputBorder,
                    },
                  ]}
                  value={newEvent.seedName ?? ''}
                  onChangeText={(text) => {
                    setNewEvent({ ...newEvent, seedName: text, seedId: '' });
                    setShowSeedDropdown(text.trim().length > 0);
                  }}
                  onFocus={() => setShowSeedDropdown(true)}
                  placeholder="Search seed inventory…"
                  placeholderTextColor={colors.textSecondary}
                />
                {showSeedDropdown && (
                  <View
                    style={[
                      styles.seedDropdown,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {seedInventory
                      .filter(
                        (s) =>
                          !(newEvent.seedName ?? '').trim() ||
                          s.seed_name
                            .toLowerCase()
                            .includes((newEvent.seedName ?? '').toLowerCase())
                      )
                      .slice(0, 8)
                      .map((s) => (
                        <Pressable
                          key={s.id}
                          style={[
                            styles.seedDropdownItem,
                            { borderBottomColor: colors.border },
                          ]}
                          onPress={() => {
                            setNewEvent((prev) => ({
                              ...prev,
                              seedName: s.seed_name,
                              seedId: s.id,
                            }));
                            setShowSeedDropdown(false);
                            fetchSeedGrowthData(s.id);
                          }}
                        >
                          <Text style={{ color: colors.text }}>
                            {s.seed_name}
                          </Text>
                        </Pressable>
                      ))}
                    {seedInventory.filter(
                      (s) =>
                        !(newEvent.seedName ?? '').trim() ||
                        s.seed_name
                          .toLowerCase()
                          .includes((newEvent.seedName ?? '').toLowerCase())
                    ).length === 0 && (
                      <View
                        style={[
                          styles.seedDropdownItem,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontStyle: 'italic',
                            fontSize: 13,
                          }}
                        >
                          No seeds found — type to add custom name
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {newEvent.seedId ? (
                  <Text
                    style={{ color: colors.primary, fontSize: 12, marginTop: 4 }}
                  >
                    ✓ Linked to inventory seed
                  </Text>
                ) : null}
              </View>

              {/* ── Event type (pill selector) ── */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Event Type
                </Text>
                <View style={styles.pillRow}>
                  {(Object.keys(CATEGORY_COLORS) as EventCategory[]).map(
                    (cat) => {
                      const active = newEvent.category === cat;
                      return (
                        <Pressable
                          key={cat}
                          style={[
                            styles.categoryPill,
                            {
                              backgroundColor: active
                                ? CATEGORY_COLORS[cat]
                                : CATEGORY_COLORS[cat] + '18',
                              borderColor: CATEGORY_COLORS[cat] + '60',
                            },
                          ]}
                          onPress={() =>
                            setNewEvent({ ...newEvent, category: cat })
                          }
                        >
                          <Text
                            style={[
                              styles.categoryPillText,
                              {
                                color: active
                                  ? '#fff'
                                  : CATEGORY_COLORS[cat],
                              },
                            ]}
                          >
                            {CATEGORY_LABELS[cat]}
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>
              </View>

              {/* ── Event date ── */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Event Date
                </Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    className="cal-date-input"
                    title="Event date"
                    aria-label="Event date"
                    value={
                      newEvent.date
                        ? newEvent.date.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => {
                      const d = new Date(e.target.value + 'T00:00:00');
                      if (!isNaN(d.getTime())) handleDateChange(d);
                    }}
                  />
                ) : (
                  <>
                    <Pressable
                      style={[
                        styles.datePickerContainer,
                        {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.inputBorder,
                        },
                      ]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text
                        style={[styles.dateText, { color: colors.inputText }]}
                      >
                        {newEvent.date
                          ? format(newEvent.date, 'MMM d, yyyy')
                          : 'Select a date'}
                      </Text>
                      <Calendar size={18} color={colors.primary} />
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={newEvent.date || new Date()}
                        mode="date"
                        display="default"
                        onChange={(_, d) => {
                          if (d) handleDateChange(d);
                          setShowDatePicker(false);
                        }}
                      />
                    )}
                  </>
                )}
              </View>

              {/* ── Days to germinate / harvest (sow & transplant only) ── */}
              {(newEvent.category === 'sow' ||
                newEvent.category === 'transplant') && (
                <View
                  style={[
                    styles.growthContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View style={styles.growthRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Days to Germinate
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.inputBackground,
                            color: colors.inputText,
                            borderColor: colors.inputBorder,
                          },
                        ]}
                        value={daysToGerminate}
                        onChangeText={setDaysToGerminate}
                        placeholder="e.g. 7 or 7-10"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="default"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Days to Harvest
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.inputBackground,
                            color: colors.inputText,
                            borderColor: colors.inputBorder,
                          },
                        ]}
                        value={daysToHarvest}
                        onChangeText={setDaysToHarvest}
                        placeholder="e.g. 80 or 80-100"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="default"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* ── Notes ── */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Notes
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.inputText,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  value={newEvent.notes}
                  onChangeText={(text) =>
                    setNewEvent({ ...newEvent, notes: text })
                  }
                  placeholder="Add any notes about this event"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* ── Submit ── */}
              <Pressable
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddEvent}
              >
                <Text
                  style={[styles.addButtonText, { color: colors.primaryText }]}
                >
                  Save Event
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Weather Detail Modal ── */}
      {selectedDate && (
        <WeatherDetailModal
          visible={isWeatherModalVisible}
          onClose={() => setIsWeatherModalVisible(false)}
          date={selectedDate}
          weatherData={selectedDateWeather}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Error banner
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  errorRetryBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  errorRetryText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Header
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },

  // Grid
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Day cell
  day: {
    width: '14.28%',
    minHeight: 56,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 1,
    borderRadius: 8,
  },
  dayWithEvent: {
    borderRadius: 8,
  },
  daySelected: {
    borderRadius: 8,
    borderWidth: 1.5,
  },
  dayToday: {
    // subtle ring handled via dateCircle
  },
  dayContent: {
    alignItems: 'center',
    width: '100%',
  },

  // Weather
  weatherIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    width: '100%',
    marginBottom: 2,
  },
  weatherIconPlaceholder: {
    height: 28,
    width: '100%',
  },

  // Date circle
  dateCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderRadius: 12,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Event dots
  eventIndicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 3,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 32,
  },
  eventIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // FAB
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 12,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
  },
  modalScroll: {
    padding: 16,
  },

  // Form
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  input: {
    borderRadius: 8,
    padding: 11,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Category pills (horizontal)
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  categoryPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Growth fields
  growthContainer: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  growthRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Date picker
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 11,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
  },

  // Submit
  addButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Seed dropdown
  seedDropdown: {
    borderRadius: 8,
    borderWidth: 0.5,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 100,
  },
  seedDropdownItem: {
    padding: 11,
    borderBottomWidth: 0.5,
  },
});