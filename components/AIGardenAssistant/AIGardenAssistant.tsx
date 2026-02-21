import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MessageCircle, Send, Lightbulb, Sprout, User, Bot } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { AIMessage, AIConversation, AIGardenContext } from '@/types/ai';
import { Seed, Supplier } from '@/types/database';
import { AIConfig, GARDEN_AI_CONFIG } from '@/config/ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { guestDataManager } from '@/utils/guestDataManager';

interface AIGardenAssistantProps {
  userSeeds?: Seed[];
  userSuppliers?: Supplier[];
  location?: string;
}

export default function AIGardenAssistant({ 
  userSeeds = [], 
  userSuppliers = [],
  location 
}: AIGardenAssistantProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [conversation, setConversation] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Initialize AI configuration
  useEffect(() => {
    checkAPIKeyConfiguration();
  }, []);

  const checkAPIKeyConfiguration = async () => {
    try {
      const storedKey = await AsyncStorage.getItem('openai_api_key');
      if (storedKey) {
        setApiKey(storedKey);
        AIConfig.initialize(storedKey);
        setIsConfigured(true);
        await loadWelcomeMessage();
      } else {
        setShowApiKeyInput(true);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
      setShowApiKeyInput(true);
    }
  };

  const saveAPIKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid OpenAI API key');
      return;
    }
    
    try {
      await AsyncStorage.setItem('openai_api_key', apiKey.trim());
      AIConfig.initialize(apiKey.trim());
      setIsConfigured(true);
      setShowApiKeyInput(false);
      await loadWelcomeMessage();
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const loadWelcomeMessage = async () => {
    const welcomeMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `🌱 Hello! I'm your AI Garden Assistant. I can help you with:

• Plant care and growing advice
• Planting schedules and timing
• Companion planting suggestions
• Problem diagnosis and solutions
• Harvest planning

I can see you have ${userSeeds.length} seeds in your collection. Feel free to ask me about any of them or general gardening questions!`,
      timestamp: new Date(),
    };
    
    setConversation([welcomeMessage]);
  };

  const getGardenContext = (): AIGardenContext => {
    return {
      seeds: userSeeds.map(seed => `${seed.seed_name} (${seed.type})`),
      suppliers: userSuppliers.map(supplier => supplier.supplier_name || 'Unknown').filter(Boolean),
      location: location,
      current_season: getCurrentSeason(),
      garden_goals: 'general gardening', // Could be enhanced later
    };
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month < 3 || month === 11) return 'winter';
    if (month < 6) return 'spring';
    if (month < 9) return 'summer';
    return 'fall';
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !isConfigured) return;

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const client = AIConfig.getClient();
      if (!client) throw new Error('AI client not configured');

      const context = getGardenContext();
      const contextualPrompt = `${GARDEN_AI_CONFIG.system_prompt}

Current user context:
- Seeds: ${context.seeds.join(', ') || 'None yet'}
- Suppliers: ${context.suppliers.join(', ') || 'None'}
- Location: ${context.location || 'Not specified'}
- Current season: ${context.current_season}`;

      const messages = [
        { role: 'system', content: contextualPrompt },
        ...conversation.slice(-10).map(msg => ({ // Keep last 10 messages for context
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: userMessage.content },
      ];

      const response = await client.chat.completions.create({
        model: GARDEN_AI_CONFIG.model,
        messages: messages as any,
        temperature: GARDEN_AI_CONFIG.temperature,
        max_tokens: GARDEN_AI_CONFIG.max_tokens,
      });

      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.choices[0]?.message?.content || 'I apologize, but I couldn\'t process your request. Please try again.',
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, assistantMessage]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message || 'Unknown error'}. Please check your API key and try again.`,
        timestamp: new Date(),
      };
      
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: AIMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          {
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            backgroundColor: isUser ? colors.primary : colors.surface,
            maxWidth: '85%',
          },
        ]}
      >
        <View style={styles.messageHeader}>
          {isUser ? (
            <User size={16} color={colors.background} />
          ) : (
            <Bot size={16} color={colors.text} />
          )}
          <Text style={[
            styles.messageTime,
            { color: isUser ? colors.background : colors.textSecondary }
          ]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[
          styles.messageText,
          { color: isUser ? colors.background : colors.text }
        ]}>
          {message.content}
        </Text>
      </View>
    );
  };

  if (showApiKeyInput) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.apiKeyContainer}>
          <Lightbulb size={48} color={colors.primary} style={styles.centerIcon} />
          <Text style={[styles.title, { color: colors.text }]}>
            AI Garden Assistant Setup
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            To use the AI Garden Assistant, you need an OpenAI API key. This stays on your device and is used only for your garden advice.
          </Text>
          <TextInput
            style={[styles.apiKeyInput, { 
              color: colors.text, 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }]}
            placeholder="Enter your OpenAI API key"
            placeholderTextColor={colors.textSecondary}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={saveAPIKey}
          >
            <Text style={[styles.saveButtonText, { color: colors.background }]}>
              Save & Continue
            </Text>
          </Pressable>
          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            Your API key is stored securely on your device and never shared.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <Sprout size={24} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AI Garden Assistant
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {conversation.map(renderMessage)}
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.textInput, { 
            color: colors.text,
            backgroundColor: colors.background,
            borderColor: colors.border
          }]}
          placeholder="Ask me about your garden..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline={true}
          maxLength={500}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <Pressable
          style={[styles.sendButton, { 
            backgroundColor: inputText.trim() ? colors.primary : colors.border
          }]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading || !isConfigured}
        >
          <Send size={20} color={inputText.trim() ? colors.background : colors.textSecondary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  apiKeyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  centerIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});