import { GraduationCap, Users, TrendingUp, Award, MessageSquare, Send, BarChart3, Eye, BookOpen, Filter, Search, Lightbulb, FolderGit2, ExternalLink } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { UserRole } from './FindGroupView';
import { ContributionView } from './ContributionView';
import { FacultyGroupInspectionView } from './FacultyGroupInspectionView';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

interface MemberContribution {
  id: string;
  name: string;
  role: UserRole;
  tasksCompleted: number;
  focusHours: number;
  lastActive: string;
  color: string;
  contributionScore: number;
}

interface StudentGroup {
  id: string;
  name: string;
  course: string;
  members: MemberContribution[];
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  lastActive: string;
  focusHours: number;
  hasAccess: boolean;
}

export function TeacherView() {
  const { currentUser } = useAuth();
  const [inspectingGroupId, setInspectingGroupId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewContributions, setViewContributions] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherCourses = [
    'All Courses',
    'Human-Computer Interaction',
    'Web Development',
    'Artificial Intelligence',
    'Software Engineering',
  ];

  const loadTeacherData = useCallback(async () => {
    try {
      const data = await api.getTeacherDashboardGroups(selectedCourse);
      setGroups(data);
    } catch (e) {
      console.error('Error loading teacher data:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    loadTeacherData();

    // Realtime channel
    const channel = supabase
      .channel('teacher-monitor-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTeacherData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'focus_sessions' }, () => {
        loadTeacherData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTeacherData]);

  const handleSendFeedback = async () => {
    if (!feedback.trim() || !selectedGroup || !currentUser) return;
    
    const targetGroup = groups.find(g => g.id === selectedGroup);
    const ok = await api.sendTeacherFeedback(selectedGroup, currentUser.id, feedback.trim());
    
    if (ok) {
      toast.success(`Feedback delivered to "${targetGroup?.name}" students!`);
      setFeedback('');
    } else {
      toast.error('Could not deliver feedback');
    }
  };

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.course.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalTasksCompleted = groups.reduce((acc, g) => acc + g.tasksCompleted, 0);
  const totalTasksAll = groups.reduce((acc, g) => acc + g.totalTasks, 0);
  const averageProgress = groups.length > 0
    ? Math.round(groups.reduce((acc, g) => acc + g.progress, 0) / groups.length)
    : 0;

  if (inspectingGroupId && currentUser) {
    return (
      <FacultyGroupInspectionView
        groupId={inspectingGroupId}
        onBack={() => setInspectingGroupId(null)}
        teacher={currentUser}
      />
    );
  }

  return (
    <div className="size-full overflow-y-auto bg-gradient-to-b from-green-50/30 to-white">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 max-w-6xl mx-auto">
        {/* Header */}
        <div 
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-green-500/30"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)', color: '#ffffff' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white">
              <GraduationCap size={26} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Faculty Supervision Portal</h2>
              <p className="text-green-100 text-xs sm:text-sm">
                United International University • Live Academic Oversight
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">Supervised Groups</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{groups.length}</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">Avg Progress</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{averageProgress}%</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-amber-600" />
              <span className="text-xs text-gray-500 font-medium">Tasks Closed</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalTasksCompleted}/{totalTasksAll}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <Input
                type="text"
                placeholder="Search groups by name or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-gray-200"
              />
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none"
            >
              {teacherCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Groups List */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Active Course Groups</h3>

          <div className="grid grid-cols-1 gap-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div 
                    onClick={() => setInspectingGroupId(group.id)}
                    className="cursor-pointer group/title flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-gray-900 text-base sm:text-lg group-hover/title:text-emerald-700 transition-colors">
                        {group.name}
                      </h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Live Workspace
                      </span>
                    </div>
                    <p className="text-xs text-green-700 font-semibold mt-0.5">{group.course}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setInspectingGroupId(group.id)}
                      className="gap-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <FolderGit2 size={14} />
                      <span>Enter Workspace & Inspect Deliverables →</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewContributions(group.id)}
                      className="gap-1.5 text-xs rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Eye size={14} />
                      <span>Contributions</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                      className="gap-1.5 text-xs rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <MessageSquare size={14} />
                      <span>Quick Note</span>
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600">Tasks Completed: {group.tasksCompleted}/{group.totalTasks}</span>
                    <span className="text-green-700 font-bold">{group.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(group.progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Member Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-medium">Team:</span>
                  {group.members.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200 text-xs"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="font-medium text-gray-800">{m.name}</span>
                      <span className="text-[10px] text-gray-500">({m.tasksCompleted} tasks)</span>
                    </div>
                  ))}
                </div>

                {/* Inline Feedback Box */}
                {selectedGroup === group.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <Input
                      type="text"
                      placeholder="Send guidance or feedback to this team..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="rounded-xl border-gray-200 text-xs sm:text-sm"
                    />
                    <Button
                      onClick={handleSendFeedback}
                      className="bg-green-600 hover:bg-green-700 rounded-xl gap-1.5 text-xs font-semibold"
                    >
                      <Send size={14} />
                      <span>Send</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Insight Card */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">Supervisor Insights</h4>
            <p className="text-xs text-gray-700 leading-relaxed">
              Task progress and focus hours update live via Supabase. Encourage students with lower contribution ratios to take ownership of open Kanban items.
            </p>
          </div>
        </div>
      </div>

      {/* Contribution Breakdown Modal */}
      {viewContributions && (() => {
        const group = groups.find(g => g.id === viewContributions);
        return group ? (
          <ContributionView
            groupName={group.name}
            members={group.members}
            onClose={() => setViewContributions(null)}
          />
        ) : null;
      })()}
    </div>
  );
}