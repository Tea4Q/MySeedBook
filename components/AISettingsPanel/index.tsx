import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Bot, Check, ChevronDown, ChevronUp, Eye, EyeOff, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { AIConfig } from '@/config/ai';
import {
  clearAIConfiguration,
  loadAIConfiguration,
  normalizeAIBaseUrl,
  saveAIConfiguration,
  type AIVerificationStatus,
} from '@/config/aiStorage';

interface AISettingsPanelProps {
  onConfigured?: () => void;
}

const PRESET_BACKENDS = [
  { label: 'OpenAI (default)', value: '' },
  { label: 'Ollama (local)', value: 'http://localhost:11434/v1' },
  { label: 'LM Studio (local)', value: 'http://localhost:1234/v1' },
  { label: 'Custom…', value: 'custom' },
];

export default function AISettingsPanel({ onConfigured }: AISettingsPanelProps) {
  const { colors } = useTheme();

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<AIVerificationStatus>('unverified');
  const [hasSavedKey, setHasSavedKey] = useState(false);

  const effectiveBaseUrl = normalizeAIBaseUrl(baseUrl === 'custom' ? customUrl : baseUrl);

  const load = useCallback(async () => {
    const storedConfig = await loadAIConfiguration();
    if (storedConfig.apiKey) {
      setApiKey(storedConfig.apiKey);
      setHasSavedKey(true);
    } else {
      setHasSavedKey(false);
    }
    setVerificationStatus(storedConfig.verificationStatus);

    if (storedConfig.baseUrl) {
      const storedUrl = storedConfig.baseUrl;
      const isPreset = PRESET_BACKENDS.some(
        p => p.value === storedUrl && p.value !== 'custom' && p.value !== ''
      );
      if (isPreset) {
        setBaseUrl(storedUrl);
      } else if (storedUrl) {
        setBaseUrl('custom');
        setCustomUrl(storedUrl);
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter your AI API key.');
      return;
    }
    if (baseUrl === 'custom' && !customUrl.trim()) {
      Alert.alert('URL Required', 'Please enter your custom backend URL.');
      return;
    }
    setIsSaving(true);
    try {
      const savedConfig = await saveAIConfiguration({
        apiKey,
        baseUrl: effectiveBaseUrl,
        verificationStatus: 'unverified',
      });
      AIConfig.initialize(savedConfig.apiKey ?? '', savedConfig.baseUrl ?? undefined, savedConfig.model);
      setHasSavedKey(savedConfig.hasApiKey);

      const verificationResult = await AIConfig.verifyConfiguration({
        apiKey: savedConfig.apiKey,
        baseUrl: savedConfig.baseUrl,
        model: savedConfig.model,
      });

      if (verificationResult.ok) {
        const verifiedConfig = await AIConfig.markVerified();
        setVerificationStatus(verifiedConfig.verificationStatus);
        Alert.alert('Saved', 'AI settings were saved and verified successfully.');
      } else {
        const rejectedConfig = verificationResult.code === 'unauthorized'
          ? await AIConfig.markUnverified('unauthorized')
          : verificationResult.code === 'network_error'
            ? await AIConfig.markUnverified('network_error')
            : verificationResult.code === 'rate_limited'
              ? await AIConfig.markUnverified('rate_limited')
              : await AIConfig.markUnverified('provider_error');
        setVerificationStatus(rejectedConfig.verificationStatus);
        Alert.alert('Saved', verificationResult.message);
      }

      onConfigured?.();
    } catch {
      Alert.alert('Error', 'Failed to save AI settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Save your key before testing.');
      return;
    }
    setIsTesting(true);
    try {
      const verificationResult = await AIConfig.verifyConfiguration({
        apiKey,
        baseUrl: effectiveBaseUrl,
      });
      if (!verificationResult.ok) {
        Alert.alert('Connection Failed', verificationResult.message);
        return;
      }

      Alert.alert('Connection OK', 'Successfully connected to the AI backend.');
    } catch {
      Alert.alert('Connection Failed', 'Could not reach the AI backend. Check your key and URL.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear AI Settings',
      'Remove your saved API key and backend URL?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAIConfiguration();
            AIConfig.invalidateClient();
            setApiKey('');
            setBaseUrl('');
            setCustomUrl('');
            setHasSavedKey(false);
            setVerificationStatus('unverified');
            onConfigured?.();
          },
        },
      ]
    );
  };

  const s = styles(colors);
  const statusText = !hasSavedKey
    ? 'Enter your API key to enable AI features'
    : verificationStatus === 'verified'
      ? 'AI is configured and ready'
      : verificationStatus === 'rejected'
        ? 'Saved key was rejected. Update it in AI Settings.'
        : 'AI settings are saved but still need provider verification';
  const statusColor = !hasSavedKey
    ? colors.warning
    : verificationStatus === 'verified'
      ? colors.primary
      : colors.warning;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {/* Status banner */}
      <View style={[s.statusBanner, { backgroundColor: statusColor + '18' }]}>
        <Bot size={18} color={statusColor} />
        <Text style={[s.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>

      {/* API Key */}
      <Text style={s.label}>AI API Key</Text>
      <Text style={s.hint}>
        Enter the API key for your chosen AI provider. Stored in SecureStore on native devices. On web, browser storage is used.
      </Text>
      <View style={s.row}>
        <TextInput
          style={[s.input, s.flex, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-… or your provider key"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!showKey}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={s.iconBtn} onPress={() => setShowKey(v => !v)}>
          {showKey
            ? <EyeOff size={20} color={colors.textSecondary} />
            : <Eye size={20} color={colors.textSecondary} />}
        </Pressable>
      </View>

      {/* Backend */}
      <Text style={[s.label, { marginTop: 20 }]}>AI Backend / Provider</Text>
      <Text style={s.hint}>
        Use OpenAI by default, or point to any OpenAI-compatible endpoint (Ollama, LM Studio, Anthropic proxy, etc.)
      </Text>

      {/* Preset picker */}
      <Pressable
        style={[s.input, s.presetPicker, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => setShowPresets(v => !v)}
      >
        <Text style={{ color: colors.text, flex: 1 }}>
          {PRESET_BACKENDS.find(p => p.value === baseUrl)?.label ?? 'OpenAI (default)'}
        </Text>
        {showPresets
          ? <ChevronUp size={18} color={colors.textSecondary} />
          : <ChevronDown size={18} color={colors.textSecondary} />}
      </Pressable>

      {showPresets && (
        <View style={[s.dropdown, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {PRESET_BACKENDS.map(preset => (
            <Pressable
              key={preset.value}
              style={[s.dropdownItem, preset.value === baseUrl && { backgroundColor: colors.primary + '18' }]}
              onPress={() => { setBaseUrl(preset.value); setShowPresets(false); }}
            >
              <Text style={{ color: colors.text }}>{preset.label}</Text>
              {preset.value === baseUrl && <Check size={16} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}

      {baseUrl === 'custom' && (
        <>
          <Text style={[s.label, { marginTop: 12 }]}>Custom Base URL</Text>
          <TextInput
            style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={customUrl}
            onChangeText={setCustomUrl}
            placeholder="http://localhost:11434/v1"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </>
      )}

      {/* Actions */}
      <View style={[s.row, { marginTop: 28, gap: 10 }]}>
        <Pressable
          style={[s.btn, s.flex, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator size="small" color={colors.background} />
            : <Text style={[s.btnText, { color: colors.background }]}>Save</Text>}
        </Pressable>

        <Pressable
          style={[s.btn, s.flex, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
          onPress={handleTest}
          disabled={isTesting}
        >
          {isTesting
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[s.btnText, { color: colors.primary }]}>Test</Text>}
        </Pressable>
      </View>

      {hasSavedKey && (
        <Pressable style={[s.row, s.clearBtn]} onPress={handleClear}>
          <Trash2 size={14} color={colors.error} />
          <Text style={[s.clearText, { color: colors.error }]}>Clear saved credentials</Text>
        </Pressable>
      )}

      {/* Help */}
      <View style={[s.helpBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.helpTitle, { color: colors.text }]}>Self-hosted backends</Text>
        <Text style={[s.helpBody, { color: colors.textSecondary }]}>
          Any OpenAI-compatible server works:{'\n'}
          • <Text style={{ fontWeight: '600' }}>Ollama</Text> — run Llama, Mistral, Phi locally{'\n'}
          • <Text style={{ fontWeight: '600' }}>LM Studio</Text> — local model GUI{'\n'}
          • <Text style={{ fontWeight: '600' }}>Custom proxy</Text> — your own relay server
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof import('@/lib/theme').useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 10,
      marginBottom: 24,
    },
    statusText: { fontSize: 14, fontWeight: '500', flex: 1 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
    hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, lineHeight: 18 },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    flex: { flex: 1 },
    iconBtn: { padding: 12 },
    presetPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdown: {
      borderWidth: 1,
      borderRadius: 10,
      marginTop: 4,
      overflow: 'hidden',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    btn: {
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: { fontSize: 15, fontWeight: '600' },
    clearBtn: {
      justifyContent: 'center',
      marginTop: 16,
      gap: 6,
    },
    clearText: { fontSize: 13 },
    helpBox: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 14,
      marginTop: 28,
    },
    helpTitle: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    helpBody: { fontSize: 13, lineHeight: 20 },
  });
