import { supabase } from '../supabase';
import { Feedback, FeedbackFormData, DeviceInfo } from '../../types/feedback';
import { Platform, Dimensions } from 'react-native';
import Constants from 'expo-constants';

class FeedbackService {
  /**
   * Get device information automatically
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    const { width, height } = Dimensions.get('window');
    
    const deviceInfo: DeviceInfo = {
      platform: Platform.OS,
      osVersion: Platform.Version?.toString(),
      appVersion: Constants.expoConfig?.version || '1.0.0',
      screenSize: {
        width,
        height,
      },
    };

    return deviceInfo;
  }

  /**
   * Submit new feedback
   */
  async submitFeedback(formData: FeedbackFormData): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Get device info
      const deviceInfo = await this.getDeviceInfo();

      // Prepare feedback data
      const feedbackData = {
        user_id: user?.id || null,
        user_email: formData.user_email || user?.email || null,
        feedback_type: formData.feedback_type,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        rating: formData.rating,
        device_info: deviceInfo,
        screenshot_url: formData.screenshot_url || null,
        status: 'new',
      };

      // Insert feedback
      const { error } = await supabase
        .from('feedback')
        .insert([feedbackData]);

      if (error) {
        console.error('Error submitting feedback:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get user's feedback history
   */
  async getUserFeedback(): Promise<{ data: Feedback[] | null; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feedback:', error);
        return { data: null, error: error.message };
      }

      return { data: data as Feedback[] };
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export const feedbackService = new FeedbackService();
