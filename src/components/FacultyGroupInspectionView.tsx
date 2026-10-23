import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, CheckCircle2, Clock, Users, Shield, MessageSquare, Send, 
  Check, AlertCircle, Eye, FileText, Activity as ActivityIcon, UserCheck, Flame
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { api } from '../lib/api';
import { supabase, DbTask, DbActivity, DbTaskComment, DbProfile } from '../lib/supabase';

interface FacultyGroupInspectionViewProps {
  groupId: string;
  onBack: () => void;
  teacher: DbProfile;
}

export function FacultyGroupInspectionView({ groupId, onBack, teacher }: FacultyGroupInspectionViewProps) {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'kanban' | 'members' | 'activity' | 'feedback'>('kanban');

  // Task comments state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskComments, setTaskComments] = useState<DbTaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // New supervisor feedback state
  const [newFeedback, setNewFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const details = await api.getGroupInspectionDetails(groupId);
      if (details) {
        setGroup(details.group);
        setTasks(details.tasks);
        setActivities(details.activities);
        setFeedbackList(details.feedback);
      }
    } catch (err) {
      console.error('Error loading group inspection:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`faculty-inspect-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `group_id=eq.${groupId}` }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, () => {
        if (selectedTaskId) {
          loadComments(selectedTaskId);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `group_id=eq.${groupId}` }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_feedback', filter: `group_id=eq.${groupId}` }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, loadData, selectedTaskId]);

  const loadComments = async (taskId: string) => {
    setLoadingComments(true);
    try {
      const comments = await api.getTaskComments(taskId);
      setTaskComments(comments);
    } catch (err) {
      console.error('Error fetching task comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSelectTask = (task: DbTask) => {
    setSelectedTaskId(task.id);
    setCommentInput('');
    loadComments(task.id);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedTaskId) return;
    setSubmittingComment(true);

    try {
      const added = await api.addTaskComment(
        selectedTaskId,
        teacher.id,
        `${teacher.full_name} (Faculty)`,
        '#10b981',
        commentInput.trim()
      );

      if (added) {
        setTaskComments((prev) => [...prev, added]);
        setCommentInput('');
        toast.success('Supervisor guidance added to deliverable discussion!');
      }
    } catch (err: any) {
      toast.error('Failed to post comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSendGroupFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;
    setSendingFeedback(true);

    try {
      const ok = await api.sendTeacherFeedback(groupId, teacher.id, newFeedback.trim());
      if (ok) {
        toast.success(`Official supervisor directive sent to ${group?.name}!`);
        setNewFeedback('');
        await loadData();
      } else {
        toast.error('Failed to send feedback');
      }
    } catch (err: any) {
      toast.error('Error sending feedback: ' + err.message);
    } finally {
      setSendingFeedback(false);
    }
  };

  if (loading || !group) {
    return (
      <div className="size-full flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Connecting to Live Student Workspace...</p>
      </div>
    );
  }

  // Calculate task splits
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'inProgress');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const progressPercent = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const members = group.members || [];
  const totalFocusHours = members.reduce((sum: number, m: any) => sum + Number(m.focus_hours || 0), 0);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="size-full overflow-y-auto bg-gradient-to-b from-green-50/40 via-white to-gray-50 flex flex-col">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="rounded-xl border-gray-200 hover:bg-gray-100 text-xs font-bold gap-1.5 shrink-0"
          >
            <ArrowLeft size={15} />
            <span>All Groups</span>
          </Button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Faculty Academic Oversight Mode
            </span>
          </div>
        </div>

        {/* Group Header Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{group.name}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {group.course}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leader: <strong className="text-gray-700">{group.leader?.full_name || 'Team Leader'}</strong> • {members.length} Registered Students
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-2.5 rounded-2xl border border-gray-200 shrink-0">
              <div className="px-2.5 sm:px-3 text-center border-r border-gray-200">
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Progress</div>
                <div className="text-sm sm:text-base font-extrabold text-emerald-600">{progressPercent}%</div>
              </div>
              <div className="px-2.5 sm:px-3 text-center border-r border-gray-200">
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Deliverables</div>
                <div className="text-sm sm:text-base font-extrabold text-gray-800">{doneTasks.length}/{tasks.length}</div>
              </div>
              <div className="px-2.5 sm:px-3 text-center">
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Focus Time</div>
                <div className="text-sm sm:text-base font-extrabold text-blue-600">{totalFocusHours.toFixed(1)}h</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 mt-4">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'kanban' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={14} />
              <span>Deliverables (Kanban)</span>
              <span className="bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                {tasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'members' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={14} />
              <span>Student Contributions</span>
              <span className="bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                {members.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'activity' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ActivityIcon size={14} />
              <span>Live Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'feedback' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare size={14} />
              <span>Supervisor Directives</span>
              {feedbackList.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                  {feedbackList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-20">
        {/* Tab 1: Kanban Deliverables */}
        {activeTab === 'kanban' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Student Deliverables & Kanban Board</h3>
                <p className="text-xs text-gray-500">Inspect deliverable status, assignees, and task discussion threads.</p>
              </div>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 font-semibold">
                Live Supabase Synchronized
              </span>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: To Do */}
              <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">To Do</h4>
                  </div>
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    {todoTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {todoTasks.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400">No tasks in To Do</div>
                  ) : (
                    todoTasks.map((task) => renderTaskCard(task))
                  )}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-200/60 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">In Progress</h4>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {inProgressTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {inProgressTasks.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400">No active deliverables in progress</div>
                  ) : (
                    inProgressTasks.map((task) => renderTaskCard(task))
                  )}
                </div>
              </div>

              {/* Column 3: Done */}
              <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200/60 flex flex-col min-h-[350px]">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Completed Deliverables</h4>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {doneTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {doneTasks.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400">No deliverables marked done yet</div>
                  ) : (
                    doneTasks.map((task) => renderTaskCard(task))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Member Accountability */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Student Contributions & Effort Tracking</h3>
              <p className="text-xs text-gray-500">Monitor individual task completion and deep focus hours across team members.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m: any) => {
                const profile = m.profiles || {};
                const name = profile.full_name || 'UIU Student';
                const email = profile.email || 'student@uiu.ac.bd';
                const role = m.role === 'team_leader' ? 'Team Leader' : 'Student';
                const tasksDone = m.tasks_completed || 0;
                const hours = Number(m.focus_hours || 0);
                const score = m.contribution_score || 75;

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ backgroundColor: profile.color || '#3b82f6' }}
                            className="w-10 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center shadow"
                          >
                            {name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{name}</div>
                            <div className="text-[11px] text-gray-500">{email}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.role === 'team_leader' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {role}
                        </span>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Tasks Finished</div>
                          <div className="text-sm font-extrabold text-gray-800">{tasksDone}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Focus Hours</div>
                          <div className="text-sm font-extrabold text-blue-600">{hours.toFixed(1)}h</div>
                        </div>
                      </div>

                      {/* Contribution Score */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                          <span>Contribution Score</span>
                          <span className="text-emerald-600">{score}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(score, 100)}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.success(`Accountability nudge sent to ${name}!`)}
                      className="w-full rounded-xl text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <UserCheck size={14} className="mr-1.5" />
                      <span>Send Accountability Nudge</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Live Activity Stream */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Live Activity & Deliverables Audit Stream</h3>
              <p className="text-xs text-gray-500">Real-time chronology of student task progress and milestone achievements.</p>
            </div>

            {activities.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                <ActivityIcon size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-semibold text-gray-700">No recent team activities recorded</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm divide-y divide-gray-100">
                {activities.map((act) => (
                  <div key={act.id} className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-800">
                        <strong className="text-gray-900">{act.user_name}</strong> {act.message}{' '}
                        {act.task_title && <span className="font-semibold text-blue-600">"{act.task_title}"</span>}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Supervisor Guidance & Directives */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Official Supervisor Guidance & Announcements</h3>
              <p className="text-xs text-gray-500">Provide feedback, approve deliverables, and communicate directives to this group.</p>
            </div>

            {/* Post Feedback Form */}
            <form onSubmit={handleSendGroupFeedback} className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm space-y-3">
              <label className="text-xs font-bold text-gray-800 block">Post New Guidance to Team</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Great progress on the user interviews! Ensure your usability testing results are cross-referenced with your HCI project proposal."
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                className="w-full p-3 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={sendingFeedback || !newFeedback.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-5 py-2 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Send size={14} />
                  <span>{sendingFeedback ? 'Broadcasting...' : 'Broadcast Guidance'}</span>
                </Button>
              </div>
            </form>

            {/* Feedback History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Previous Guidance Messages</h4>
              {feedbackList.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-xs text-gray-400">
                  No guidance messages posted yet for this team.
                </div>
              ) : (
                feedbackList.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800">
                        {item.teacher?.full_name || 'Faculty Supervisor'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed pt-1">
                      {item.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Inspection Drawer / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedTask.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                  selectedTask.status === 'inProgress' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedTask.status === 'done' ? 'Completed Deliverable' : selectedTask.status === 'inProgress' ? 'In Progress' : 'To Do'}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Assignees */}
            <div className="py-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 block mb-1.5">Assigned Deliverable Owners:</span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedTask.assignees || []).length === 0 ? (
                  <span className="text-xs text-gray-400 italic">Unassigned deliverable</span>
                ) : (
                  (selectedTask.assignees || []).map((id: string) => {
                    const foundMember = members.find((m: any) => m.profiles?.id === id || m.user_id === id);
                    const name = foundMember?.profiles?.full_name || 'Student';
                    const color = foundMember?.profiles?.color || '#3b82f6';
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-800">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        {name}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Task Comments Stream */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-[160px]">
              <span className="text-xs font-bold text-gray-700 block">Deliverable Discussion & Supervisor Notes</span>

              {loadingComments ? (
                <div className="text-center py-6 text-xs text-gray-400">Loading comments...</div>
              ) : taskComments.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 italic">No notes on this task yet.</div>
              ) : (
                taskComments.map((c) => (
                  <div key={c.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: c.author_color || '#3b82f6' }}>
                        {c.author_name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="pt-3 border-t border-gray-100 flex gap-2">
              <Input
                type="text"
                placeholder="Post supervisor guidance on this deliverable..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="text-xs rounded-xl"
              />
              <Button
                type="submit"
                disabled={submittingComment || !commentInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-4"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function renderTaskCard(task: DbTask) {
    return (
      <div
        key={task.id}
        onClick={() => handleSelectTask(task)}
        className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm hover:shadow hover:border-emerald-300 transition-all cursor-pointer space-y-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-xs font-bold text-gray-900 leading-tight">{task.title}</h5>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          {/* Assignees */}
          <div className="flex -space-x-1 overflow-hidden">
            {(task.assignees || []).map((id: string) => {
              const found = members.find((m: any) => m.profiles?.id === id || m.user_id === id);
              return (
                <div
                  key={id}
                  style={{ backgroundColor: found?.profiles?.color || '#3b82f6' }}
                  className="w-5 h-5 rounded-full ring-2 ring-white text-[9px] font-bold text-white flex items-center justify-center"
                  title={found?.profiles?.full_name || 'Student'}
                >
                  {(found?.profiles?.full_name || 'S').charAt(0)}
                </div>
              );
            })}
          </div>

          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 hover:underline">
            <MessageSquare size={11} />
            <span>Discussion</span>
          </span>
        </div>
      </div>
    );
  }
}
