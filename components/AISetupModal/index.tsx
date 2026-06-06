import React, { useState } from 'react';
import {
  Linking, Modal, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { Bot, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

interface AISetupModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    tag: 'Recommended · Voice + Chat',
    tagColor: '#2f9e44',
    description: 'Powers AI garden chat and Whisper voice transcription. Best choice for all features.',
    link: 'https://platform.openai.com/api-keys',
    linkLabel: 'platform.openai.com/api-keys',
    voiceSupport: true,
    steps: [
      'Go to platform.openai.com and sign in (or create a free account)',
      'Click "API keys" in the left sidebar',
      'Click "+ Create new secret key", give it a name like "MySeedBook"',
      'Copy the key — it starts with sk-…',
      'Tap "Open AI Settings" below and paste it in',
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    tag: 'Free · Local · Chat only',
    tagColor: '#1971c2',
    description: 'Run AI models privately on your own computer. No API costs, no internet needed. Voice transcription not supported.',
    link: 'https://ollama.ai',
    linkLabel: 'ollama.ai',
    voiceSupport: false,
    steps: [
      'Download and install Ollama from ollama.ai',
      'Run: ollama pull llama3 (or any model you prefer)',
      'Ollama starts a local server on http://localhost:11434',
      'In AI Settings, select "Ollama (local)" as the backend',
      'Use any placeholder as the API key (e.g. "ollama")',
    ],
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    tag: 'Free · Local · Chat only',
    tagColor: '#1971c2',
    description: 'A desktop GUI for running local AI models. No API costs. Voice transcription not supported.',
    link: 'https://lmstudio.ai',
    linkLabel: 'lmstudio.ai',
    voiceSupport: false,
    steps: [
      'Download LM Studio from lmstudio.ai',
      'Search for and download a model (e.g. Mistral, Phi-3)',
      'Start the local server from the "Local Server" tab',
      'In AI Settings, select "LM Studio (local)" as the backend',
      'Use any placeholder as the API key (e.g. "lmstudio")',
    ],
  },
];

export default function AISetupModal({ visible, onClose, onOpenSettings }: AISetupModalProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<string>('openai');
  const s = styles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={[s.headerIcon, { backgroundColor: colors.primary + '20' }]}>
              <Bot size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: colors.text }]}>Set Up AI Features</Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                AI features need your own API key — you control the cost.
              </Text>
            </View>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Voice note */}
            <View style={[s.voiceNote, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}>
              <Text style={[s.voiceNoteText, { color: colors.primary }]}>
                🎙 Voice transcription requires OpenAI Whisper — only OpenAI supports it.
              </Text>
            </View>

            {/* Provider list */}
            {PROVIDERS.map((p) => {
              const isOpen = expanded === p.id;
              return (
                <View
                  key={p.id}
                  style={[
                    s.card,
                    {
                      borderColor: isOpen ? colors.primary : colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Pressable style={s.cardHeader} onPress={() => setExpanded(isOpen ? '' : p.id)}>
                    <View style={{ flex: 1 }}>
                      <View style={s.nameRow}>
                        <Text style={[s.providerName, { color: colors.text }]}>{p.name}</Text>
                        <View style={[s.tag, { backgroundColor: p.tagColor + '22' }]}>
                          <Text style={[s.tagText, { color: p.tagColor }]}>{p.tag}</Text>
                        </View>
                      </View>
                      <Text style={[s.providerDesc, { color: colors.textSecondary }]}>
                        {p.description}
                      </Text>
                    </View>
                    {isOpen
                      ? <ChevronUp size={18} color={colors.textSecondary} />
                      : <ChevronDown size={18} color={colors.textSecondary} />}
                  </Pressable>

                  {isOpen && (
                    <View style={[s.steps, { borderTopColor: colors.border }]}>
                      {p.steps.map((step, i) => (
                        <View key={i} style={s.stepRow}>
                          <View style={[s.stepNum, { backgroundColor: colors.primary }]}>
                            <Text style={[s.stepNumText, { color: colors.background }]}>{i + 1}</Text>
                          </View>
                          <Text style={[s.stepText, { color: colors.text }]}>{step}</Text>
                        </View>
                      ))}
                      <Pressable style={s.linkRow} onPress={() => Linking.openURL(p.link)}>
                        <ExternalLink size={14} color={colors.primary} />
                        <Text style={[s.linkText, { color: colors.primary }]}>{p.linkLabel}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* CTA */}
          <View style={s.footer}>
            <Pressable
              style={[s.settingsBtn, { backgroundColor: colors.primary }]}
              onPress={() => { onClose(); onOpenSettings(); }}
            >
              <Text style={[s.settingsBtnText, { color: colors.background }]}>Open AI Settings</Text>
            </Pressable>
            <Pressable style={s.cancelBtn} onPress={onClose}>
              <Text style={[s.cancelText, { color: colors.textSecondary }]}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: 17, fontWeight: '700' },
    subtitle: { fontSize: 13, marginTop: 2, lineHeight: 18 },
    closeBtn: { padding: 4 },
    scrollContent: { padding: 16, gap: 10 },
    voiceNote: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 4 },
    voiceNoteText: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    card: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 14,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    providerName: { fontSize: 15, fontWeight: '700' },
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    tagText: { fontSize: 11, fontWeight: '600' },
    providerDesc: { fontSize: 13, lineHeight: 18 },
    steps: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      gap: 10,
      borderTopWidth: 1,
      paddingTop: 14,
    },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    stepNum: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    stepNumText: { fontSize: 11, fontWeight: '700' },
    stepText: { flex: 1, fontSize: 13, lineHeight: 20 },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    linkText: { fontSize: 13, fontWeight: '500' },
    footer: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
    settingsBtn: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsBtnText: { fontSize: 16, fontWeight: '700' },
    cancelBtn: { alignItems: 'center', paddingVertical: 8 },
    cancelText: { fontSize: 14 },
  });
