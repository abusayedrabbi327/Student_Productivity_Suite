import { supabase, DbProfile, DbGroup, DbGroupMember, DbGroupJoinRequest, DbTask, DbTaskComment, DbActivity, DbDailyGoal, DbTeacherFeedback, DbDeadline, DbCalendarEvent } from './supabase';

export const api = {
  // Profiles
  async getProfile(id: string): Promise<DbProfile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async getAllProfiles(): Promise<DbProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    return data || [];
  },

  async updateProfile(id: string, updates: Partial<DbProfile>): Promise<DbProfile | null> {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }
    return data;
  },

  async incrementPointsAndStreak(userId: string, addedPoints: number, addStreak = false) {
    const profile = await this.getProfile(userId);
    if (!profile) return;
    const newPoints = (profile.points || 0) + addedPoints;
    const newLevel = Math.floor(newPoints / 200) + 1;
    const newStreak = addStreak ? (profile.streak || 0) + 1 : profile.streak;
    await this.updateProfile(userId, { points: newPoints, level: newLevel, streak: newStreak });
  },

  // Groups
  async getGroups(courseFilter?: string, searchQuery?: string): Promise<(DbGroup & { members: (DbGroupMember & { profiles: DbProfile })[] })[]> {
    let query = supabase.from('groups').select(`
      *,
      members:group_members(
        *,
        profiles(*)
      )
    `).order('created_at', { ascending: false });

    if (courseFilter && courseFilter !== 'all' && courseFilter !== 'All Courses') {
      query = query.eq('course', courseFilter);
    }
    if (searchQuery && searchQuery.trim()) {
      query = query.ilike('name', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
    return (data as any) || [];
  },

  async createGroup(group: {
    name: string;
    university: string;
    course: string;
    description: string;
    max_members: number;
    tags: string[];
    leader_id: string;
    join_password?: string;
    require_approval?: boolean;
    join_code?: string;
  }): Promise<DbGroup | null> {
    const joinCode = group.join_code || `UIU-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGroup = {
      name: group.name,
      university: group.university,
      course: group.course,
      description: group.description,
      max_members: group.max_members,
      tags: group.tags,
      leader_id: group.leader_id,
      join_code: joinCode,
      require_approval: group.require_approval !== undefined ? group.require_approval : true,
      join_password: group.join_password?.trim() ? group.join_password.trim() : null,
    };

    const { data, error } = await supabase.from('groups').insert([newGroup]).select().single();
    if (error) {
      console.error('Error creating group:', error);
      return null;
    }
    // Automatically add leader to group_members
    await supabase.from('group_members').insert([{
      group_id: data.id,
      user_id: group.leader_id,
      role: 'team_leader',
      tasks_completed: 0,
      focus_hours: 0,
      contribution_score: 100,
    }]);

    // Automatically grant access to teacher
    const teachers = await supabase.from('profiles').select('id').eq('role', 'teacher');
    if (teachers.data && teachers.data.length > 0) {
      for (const t of teachers.data) {
        await supabase.from('teacher_access').insert([{
          group_id: data.id,
          teacher_id: t.id,
        }]).select();
      }
    }

    return data;
  },

  async joinGroup(groupId: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('group_members').insert([{
      group_id: groupId,
      user_id: userId,
      role: 'student',
      tasks_completed: 0,
      focus_hours: 0,
      contribution_score: 50,
    }]);
    if (error) {
      if (error.code === '23505') return true; // Already a member
      console.error('Error joining group:', error);
      return false;
    }
    return true;
  },

  async joinGroupWithPassword(
    groupId: string, 
    userId: string, 
    passwordAttempt?: string, 
    joinCodeAttempt?: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: group, error: grpError } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (grpError || !group) {
      return { success: false, error: 'Group not found.' };
    }

    if (group.join_password && group.join_password.trim() !== '') {
      const trimmedInput = (passwordAttempt || '').trim();
      const trimmedPass = group.join_password.trim();
      const codeMatch = joinCodeAttempt && group.join_code && joinCodeAttempt.trim().toUpperCase() === group.join_code.trim().toUpperCase();

      if (trimmedInput !== trimmedPass && !codeMatch) {
        return { success: false, error: 'Incorrect group password. Please ask the creator or submit a join request.' };
      }
    }

    const success = await this.joinGroup(groupId, userId);
    if (!success) {
      return { success: false, error: 'Failed to join group. You may already be a member.' };
    }

    // Auto-resolve pending join request
    await supabase.from('group_join_requests')
      .update({ status: 'accepted' })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    return { success: true };
  },

  async sendJoinRequest(
    groupId: string, 
    userId: string, 
    userName: string, 
    userEmail: string, 
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from('group_join_requests').upsert([{
      group_id: groupId,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      message: message || 'Hello! I would like to join this project team.',
      status: 'pending'
    }], { onConflict: 'group_id,user_id' });

    if (error) {
      console.error('Error sending join request:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async getGroupJoinRequests(groupId: string): Promise<DbGroupJoinRequest[]> {
    const { data, error } = await supabase
      .from('group_join_requests')
      .select('*, profiles(*)')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching join requests:', error);
      return [];
    }
    return data || [];
  },

  async getUserPendingRequests(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('group_join_requests')
      .select('group_id')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching user pending requests:', error);
      return [];
    }
    return (data || []).map(r => r.group_id);
  },

  async respondToJoinRequest(
    requestId: string, 
    groupId: string, 
    userId: string, 
    userName: string, 
    accept: boolean
  ): Promise<boolean> {
    const status = accept ? 'accepted' : 'rejected';
    const { error } = await supabase
      .from('group_join_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.error('Error responding to join request:', error);
      return false;
    }

    if (accept) {
      const joined = await this.joinGroup(groupId, userId);
      if (joined) {
        await this.logActivity(groupId, userId, userName, 'member_joined', 'joined the project team via creator approval');
      }
      return joined;
    }
    return true;
  },

  async searchRegisteredStudents(query: string): Promise<DbProfile[]> {
    let q = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name')
      .limit(15);

    if (query.trim()) {
      q = q.or(`full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%,department.ilike.%${query.trim()}%`);
    }

    const { data, error } = await q;
    if (error) {
      console.error('Error searching registered students:', error);
      return [];
    }
    return data || [];
  },

  async getGroupByJoinCode(code: string): Promise<DbGroup | null> {
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('groups')
      .select('*, leader:profiles(*)')
      .or(`join_code.ilike.${cleanCode},id.eq.${code.trim()}`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data;
  },

  // Tasks
  async getTasks(groupId: string): Promise<DbTask[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    return data || [];
  },

  async createTask(groupId: string, title: string, createdBy: string, assignees: string[] = []): Promise<DbTask | null> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ group_id: groupId, title, status: 'todo', assignees, created_by: createdBy }])
      .select()
      .single();
    if (error) {
      console.error('Error creating task:', error);
      return null;
    }
    return data;
  },

  async updateTaskStatus(taskId: string, status: 'todo' | 'inProgress' | 'done'): Promise<boolean> {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
    if (error) {
      console.error('Error updating task status:', error);
      return false;
    }
    return true;
  },

  async toggleTaskAssignee(taskId: string, memberId: string, currentAssignees: string[]): Promise<string[]> {
    const newAssignees = currentAssignees.includes(memberId)
      ? currentAssignees.filter(id => id !== memberId)
      : [...currentAssignees, memberId];

    const { error } = await supabase.from('tasks').update({ assignees: newAssignees }).eq('id', taskId);
    if (error) {
      console.error('Error updating task assignee:', error);
      return currentAssignees;
    }
    return newAssignees;
  },

  // Task Comments
  async getTaskComments(taskId: string): Promise<DbTaskComment[]> {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching task comments:', error);
      return [];
    }
    return data || [];
  },

  async addTaskComment(taskId: string, userId: string, authorName: string, authorColor: string, text: string): Promise<DbTaskComment | null> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert([{
        task_id: taskId,
        user_id: userId,
        author_name: authorName,
        author_color: authorColor,
        text,
      }])
      .select()
      .single();
    if (error) {
      console.error('Error adding task comment:', error);
      return null;
    }
    return data;
  },

  // Activities Feed
  async getActivities(groupId: string): Promise<DbActivity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
    return data || [];
  },

  async logActivity(groupId: string, userId: string, userName: string, type: string, message: string, taskTitle?: string): Promise<void> {
    await supabase.from('activities').insert([{
      group_id: groupId,
      user_id: userId,
      user_name: userName,
      type,
      message,
      task_title: taskTitle || null,
    }]);
  },

  // Daily Goals
  async getDailyGoals(userId: string): Promise<DbDailyGoal[]> {
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching daily goals:', error);
      return [];
    }
    return data || [];
  },

  async toggleDailyGoal(goalId: string, completed: boolean): Promise<boolean> {
    const { error } = await supabase.from('daily_goals').update({ completed }).eq('id', goalId);
    if (error) {
      console.error('Error toggling goal:', error);
      return false;
    }
    return true;
  },

  async addDailyGoal(userId: string, title: string): Promise<DbDailyGoal | null> {
    const { data, error } = await supabase.from('daily_goals').insert([{ user_id: userId, title, completed: false }]).select().single();
    if (error) {
      console.error('Error adding daily goal:', error);
      return null;
    }
    return data;
  },

  // Focus Sessions
  async logFocusSession(userId: string, durationMinutes: number, goal: string, focusMode: string, blockNotifications = true, whiteNoise = false) {
    const { data, error } = await supabase.from('focus_sessions').insert([{
      user_id: userId,
      duration_minutes: durationMinutes,
      goal,
      focus_mode: focusMode,
      block_notifications: blockNotifications,
      white_noise: whiteNoise,
    }]).select().single();
    
    if (error) {
      console.error('Error logging focus session:', error);
      return null;
    }

    // Award 5 points per focus minute
    await this.incrementPointsAndStreak(userId, durationMinutes * 5);
    return data;
  },

  async getRecentFocusSessions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);
    if (error) {
      console.error('Error fetching focus sessions:', error);
      return [];
    }
    return data || [];
  },

  // Teacher Monitoring
  async getTeacherDashboardGroups(courseFilter?: string): Promise<any[]> {
    let query = supabase.from('groups').select(`
      *,
      members:group_members(
        *,
        profiles(*)
      ),
      tasks(*)
    `);

    if (courseFilter && courseFilter !== 'all' && courseFilter !== 'All Courses') {
      query = query.eq('course', courseFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching teacher groups:', error);
      return [];
    }

    // Calculate aggregated metrics from real tasks and members
    return (data || []).map((g: any) => {
      const totalTasks = g.tasks?.length || 0;
      const completedTasks = g.tasks?.filter((t: any) => t.status === 'done').length || 0;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const totalFocusHours = g.members?.reduce((sum: number, m: any) => sum + Number(m.focus_hours || 0), 0) || 0;

      return {
        id: g.id,
        name: g.name,
        course: g.course,
        hasAccess: true,
        progress,
        tasksCompleted: completedTasks,
        totalTasks,
        focusHours: totalFocusHours,
        lastActive: 'Active today',
        members: (g.members || []).map((m: any) => ({
          id: m.profiles?.id || m.id,
          name: m.profiles?.full_name || 'Student',
          role: m.role,
          tasksCompleted: m.tasks_completed || 0,
          focusHours: Number(m.focus_hours || 0),
          lastActive: m.last_active || 'Recent',
          color: m.profiles?.color || '#3b82f6',
          contributionScore: m.contribution_score || 75,
        })),
      };
    });
  },

  async sendTeacherFeedback(groupId: string, teacherId: string, message: string): Promise<boolean> {
    const { error } = await supabase.from('teacher_feedback').insert([{
      group_id: groupId,
      teacher_id: teacherId,
      message,
    }]);
    if (error) {
      console.error('Error sending teacher feedback:', error);
      return false;
    }
    return true;
  },

  async grantTeacherAccess(groupId: string, teacherId: string): Promise<boolean> {
    const { error } = await supabase.from('teacher_access').insert([{
      group_id: groupId,
      teacher_id: teacherId,
    }]);
    if (error && error.code !== '23505') { // ignore duplicate
      console.error('Error granting teacher access:', error);
      return false;
    }
    return true;
  },

  // Deadlines & Calendar API
  async getDeadlines(userId: string): Promise<DbDeadline[]> {
    const { data, error } = await supabase
      .from('deadlines')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    if (error) {
      console.error('Error fetching deadlines:', error);
      return [];
    }
    return data || [];
  },

  async createDeadline(deadline: { user_id: string; title: string; due_date: string; sessions_needed: number }): Promise<DbDeadline | null> {
    const { data, error } = await supabase
      .from('deadlines')
      .insert([deadline])
      .select()
      .single();
    if (error) {
      console.error('Error creating deadline:', error);
      return null;
    }
    return data;
  },

  async deleteDeadline(id: string): Promise<boolean> {
    const { error } = await supabase.from('deadlines').delete().eq('id', id);
    if (error) {
      console.error('Error deleting deadline:', error);
      return false;
    }
    return true;
  },

  async getCalendarEvents(userId: string): Promise<DbCalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });
    if (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
    return data || [];
  },

  async addCalendarEvent(event: {
    user_id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time: string;
    type?: string;
  }): Promise<DbCalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([{
        ...event,
        type: event.type || 'existing'
      }])
      .select()
      .single();
    if (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
    return data;
  },

  async addMultipleCalendarEvents(events: {
    user_id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time: string;
    type?: string;
  }[]): Promise<boolean> {
    const { error } = await supabase
      .from('calendar_events')
      .insert(events);
    if (error) {
      console.error('Error creating multiple calendar events:', error);
      return false;
    }
    return true;
  },

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
    return true;
  },

  // Full Group Inspection for Faculty Oversight
  async getGroupInspectionDetails(groupId: string): Promise<{
    group: any;
    tasks: any[];
    activities: any[];
    feedback: any[];
  } | null> {
    const { data: group, error: grpErr } = await supabase
      .from('groups')
      .select(`
        *,
        members:group_members(*, profiles(*)),
        leader:profiles!groups_leader_id_fkey(*)
      `)
      .eq('id', groupId)
      .single();

    if (grpErr || !group) return null;

    const [tasks, activities, feedback] = await Promise.all([
      this.getTasks(groupId),
      this.getActivities(groupId),
      supabase.from('teacher_feedback').select('*, teacher:profiles(*)').eq('group_id', groupId).order('created_at', { ascending: false })
    ]);

    return {
      group,
      tasks,
      activities,
      feedback: feedback.data || []
    };
  }
};
