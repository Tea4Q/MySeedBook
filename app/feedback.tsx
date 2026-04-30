import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { router } from 'expo-router';
import { MessageSquare, Star, Send, ArrowLeft } from 'lucide-react-native';
import { feedbackService } from '../lib/services/feedbackService';
import { FeedbackType } from '../types/feedback';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'bug_report', label: 'Bug Report', icon: '🐛' },
  { value: 'feature_request', label: 'Feature Request', icon: '💡' },
  { value: 'general_feedback', label: 'General Feedback', icon: '💬' },
  { value: 'question_support', label: 'Question/Support', icon: '❓' },
  { value: 'complaint', label: 'Complaint', icon: '😞' },
];

export default function FeedbackScreen() {
  const { colors } = useTheme();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general_feedback');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!subject.trim()) {
      Alert.alert('Required Field', 'Please enter a subject for your feedback.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Required Field', 'Please provide a description of your feedback.');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Too Short', 'Please provide more details (at least 10 characters).');
      return;
    }

    setSubmitting(true);

    try {
      const result = await feedbackService.submitFeedback({
        feedback_type: feedbackType,
        subject: subject.trim(),
        description: description.trim(),
        rating: rating,
        user_email: email.trim() || undefined,
      });

      if (result.success) {
        Alert.alert(
          'Thank You! 🎉',
          'Your feedback has been submitted successfully. We appreciate your input!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MessageSquare size={28} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Send Feedback</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feedback Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Feedback Type *</Text>
          <View style={styles.typeGrid}>
            {FEEDBACK_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  { 
                    backgroundColor: colors.card,
                    borderColor: feedbackType === type.value ? colors.primary : colors.border,
                  },
                  feedbackType === type.value && styles.typeButtonSelected,
                ]}
                onPress={() => setFeedbackType(type.value)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    { color: feedbackType === type.value ? colors.primary : colors.text },
                  ]}
                  numberOfLines={2}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Subject *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Brief description of your feedback"
            placeholderTextColor={colors.text + '60'}
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Please provide detailed information about your feedback..."
            placeholderTextColor={colors.text + '60'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={[styles.charCount, { color: colors.text + '60' }]}>
            {description.length}/1000 characters
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            How satisfied are you with the app? (Optional)
          </Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Star
                  size={36}
                  color={rating && star <= rating ? '#FFD700' : colors.text + '40'}
                  fill={rating && star <= rating ? '#FFD700' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Email */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Email (Optional - for follow-up)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="your.email@example.com"
            placeholderTextColor={colors.text + '60'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.text + '60' }]}>
          We read every piece of feedback and use it to improve MySeedBook. Thank you for helping us grow! 🌱
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  typeButtonSelected: {
    borderWidth: 2,
  },
  typeIcon: {
    fontSize: 28,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  starButton: {
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});
