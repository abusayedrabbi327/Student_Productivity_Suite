import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface DbProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher';
  university: string;
  department: string;
  course: string;
  points: number;
  level: number;
  streak: number;
  color: string;
  bio: string;
  joined_date: string;
  created_at?: string;
}

export interface DbGroup {
  id: string;
  name: string;
  university: string;
  course: string;
  description: string;
  leader_id: string;
  max_members: number;
  tags: string[];
  is_open: boolean;
  join_code?: string;
  join_password?: string;
  require_approval?: boolean;
  created_at?: string;
}

export interface DbGroupJoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
  profiles?: DbProfile;
}

export interface DbGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'student' | 'team_leader' | 'teacher';
  tasks_completed: number;
  focus_hours: number;
  contribution_score: number;
  last_active: string;
  created_at?: string;
  profiles?: DbProfile;
}

export interface DbTask {
  id: string;
  group_id: string;
  title: string;
  status: 'todo' | 'inProgress' | 'done';
  assignees: string[];
  created_by?: string;
  created_at?: string;
}

export interface DbTaskComment {
  id: string;
  task_id: string;
  user_id: string;
  author_name: string;
  author_color: string;
  text: string;
  created_at: string;
}

export interface DbActivity {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  type: string;
  message: string;
  task_title?: string;
  created_at: string;
}

export interface DbDailyGoal {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at?: string;
}

export interface DbFocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  goal: string;
  focus_mode: string;
  block_notifications: boolean;
  white_noise: boolean;
  completed_at: string;
}

export interface DbTeacherFeedback {
  id: string;
  group_id: string;
  teacher_id: string;
  message: string;
  created_at: string;
}

export interface DbDeadline {
  id: string;
  user_id: string;
  title: string;
  due_date: string;
  sessions_needed: number;
  created_at?: string;
}

export interface DbCalendarEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  type: string;
  created_at?: string;
}
