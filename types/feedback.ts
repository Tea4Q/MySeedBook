export type FeedbackType = 
  | 'bug_report'
  | 'feature_request'
  | 'general_feedback'
  | 'question_support'
  | 'complaint';

export type FeedbackStatus = 
  | 'new'
  | 'reviewing'
  | 'in_progress'
  | 'completed'
  | 'closed';

export interface DeviceInfo {
  platform: string;
  osVersion?: string;
  appVersion?: string;
  deviceModel?: string;
  screenSize?: {
    width: number;
    height: number;
  };
}

export interface Feedback {
  id: string;
  user_id: string | null;
  user_email: string | null;
  feedback_type: FeedbackType;
  subject: string;
  description: string;
  rating: number | null;
  device_info: DeviceInfo | null;
  screenshot_url: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
}

export interface FeedbackFormData {
  feedback_type: FeedbackType;
  subject: string;
  description: string;
  rating: number | null;
  user_email?: string;
  screenshot_url?: string;
}
