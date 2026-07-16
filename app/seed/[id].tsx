import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ArrowLeft, CalendarDays, CheckCircle2, PencilLine, Sprout } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Seed, PlantingLog } from '@/types/database';
import { guestDataManager } from '@/utils/guestDataManager';
import {
  buildReminderPayload,
  recommendNextSeeds,
} from '@/lib/services/plantingIntelligence';

type PlantingOutcome = 'planted' | 'germinated' | 'sprouted' | 'transplanted' | 'failed' | 'harvested';

const OUTCOMES: PlantingOutcome[] = ['planted', 'germinated', 'sprouted', 'transplanted', 'failed', 'harvested'];

export default function SeedDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { session, isGuest } = useAuth();
  const { colors } = useTheme();
  const seedId = typeof params.id === 'string' ? params.id : '';

  const [seed, setSeed] = useState<Seed | null>(null);
  const [history, setHistory] = useState<PlantingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<PlantingOutcome>('planted');

  const recommendation = useMemo(() => {
    if (!seed) return null;
    return recommendNextSeeds([seed])[0] ?? null;
  }, [seed]);

  const loadSeedData = useCallback(async () => {
    if (!seedId) {
      setError('Missing seed ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (session?.user) {
        const [seedResponse, historyResponse] = await Promise.all([
          supabase
            .from('seeds')
            .select('*')
            .eq('id', seedId)
            .eq('user_id', session.user.id)
            .maybeSingle(),
          supabase
            .from('planting_logs')
            .select('*')
            .eq('seed_id', seedId)
            .eq('user_id', session.user.id)
            .order('logged_at', { ascending: false }),
        ]);

        if (seedResponse.error) throw seedResponse.error;
        if (!seedResponse.data) {
          setError('Seed not found.');
          return;
        }

        setSeed(seedResponse.data as Seed);
        setHistory((historyResponse.data || []) as PlantingLog[]);
        return;
      }

      const allSeeds = await guestDataManager.getAllSeeds();
      const guestSeed = allSeeds.find((item) => item.id === seedId) || null;
      if (!guestSeed) {
        setError('Seed not found.');
        return;
      }

      setSeed(guestSeed);
      setHistory([]);
    } catch (loadError: any) {
      console.error('Error loading seed detail:', loadError);
      setError(loadError?.message || 'Failed to load seed details.');
    } finally {
      setLoading(false);
    }
  }, [seedId, session?.user]);

  useEffect(() => {
    loadSeedData();
  }, [loadSeedData]);

  const handleSaveHistory = async () => {
    if (!seed || !session?.user) {
      Alert.alert('Sign in required', 'Planting history is saved to your account.');
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('planting_logs').insert({
        seed_id: seed.id,
        user_id: session.user.id,
        logged_at: new Date().toISOString(),
        result,
        notes: notes.trim() || null,
      });

      if (insertError) throw insertError;

      setNotes('');
      setResult('planted');
      await loadSeedData();
    } catch (saveError: any) {
      console.error('Error saving planting history:', saveError);
      Alert.alert('Unable to save history', saveError?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openCalendarReminder = () => {
    if (!seed || !recommendation) return;
    const reminder = buildReminderPayload(seed.seed_name, recommendation.reason);
    router.push({
      pathname: '/calendar',
      params: {
        openAddEvent: 'true',
        seedId: seed.id,
        seedName: seed.seed_name,
        category: recommendation.reminderCategory,
        notes: reminder.notes,
        suggestedDate: reminder.suggestedDateISO,
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !seed) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Seed not found.'}</Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { borderColor: colors.border }]}>
          <ArrowLeft size={18} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>{seed.seed_name}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{seed.type}</Text>
        </View>
        <Pressable onPress={openCalendarReminder} style={[styles.iconButton, { borderColor: colors.border }]}>
          <CalendarDays size={18} color={colors.primary} />
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Sprout size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Planting guidance</Text>
        </View>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          {recommendation
            ? `${recommendation.suggestedAction}. ${recommendation.reason}`
            : 'No planting guidance available for this seed yet.'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <CheckCircle2 size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Log planting history</Text>
        </View>
        {!session?.user ? (
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Sign in to save planting outcomes against this seed.</Text>
        ) : (
          <>
            <View style={styles.outcomeRow}>
              {OUTCOMES.map((outcome) => (
                <Pressable
                  key={outcome}
                  onPress={() => setResult(outcome)}
                  style={[
                    styles.outcomeChip,
                    {
                      backgroundColor: result === outcome ? colors.primary : colors.background,
                      borderColor: result === outcome ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.outcomeText, { color: result === outcome ? colors.primaryText : colors.text }]}>
                    {outcome}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Add notes about the result"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => void handleSaveHistory()} disabled={saving}>
              <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>{saving ? 'Saving…' : 'Save planting history'}</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <PencilLine size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>History</Text>
        </View>
        {history.length === 0 ? (
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>No planting history yet.</Text>
        ) : (
          history.map((entry) => (
            <View key={entry.id} style={[styles.historyItem, { borderColor: colors.border }]}>
              <View style={styles.historyTopRow}>
                <Text style={[styles.historyResult, { color: colors.text }]}>{entry.result || 'planted'}</Text>
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                  {format(new Date(entry.logged_at), 'MMM d, yyyy')}
                </Text>
              </View>
              <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>Logged {formatDistanceToNowStrict(new Date(entry.logged_at), { addSuffix: true })}</Text>
              {entry.notes ? <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{entry.notes}</Text> : null}
            </View>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <CalendarDays size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Suggested next reminder</Text>
        </View>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          {recommendation ? `${recommendation.suggestedAction} on ${format(new Date(recommendation.reminderDateISO), 'MMM d, yyyy')}.` : 'No reminder suggestion available.'}
        </Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={openCalendarReminder}>
          <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>Send to calendar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
  },
  headerCopy: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iconButton: {
    padding: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  outcomeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outcomeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  outcomeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  notesInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  historyResult: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: 12,
  },
  historyMeta: {
    fontSize: 12,
  },
});