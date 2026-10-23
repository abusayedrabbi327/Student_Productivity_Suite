import { useState, useEffect } from 'react';
import { User, Mail, MapPin, BookOpen, Award, Clock, CheckCircle, Settings, Users, TrendingUp, MessageSquare, Eye, BarChart3, Edit3 } from 'lucide-react';
import { UserRole } from './FindGroupView';
import { Button } from './ui/button';
import { GamificationPanel, allBadges } from './GamificationSystem';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { toast } from 'sonner@2.0.3';

interface UserProfileViewProps {
  userRole?: 'student' | 'teacher';
}

export function UserProfileView({ userRole = 'student' }: UserProfileViewProps) {
  const { currentUser, refreshProfile } = useAuth();
  const isTeacher = (currentUser?.role || userRole) === 'teacher';

  const [groups, setGroups] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(currentUser?.bio || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setBioText(currentUser.bio || '');

    async function loadProfileData() {
      try {
        if (isTeacher) {
          const teacherGroups = await api.getTeacherDashboardGroups();
          setGroups(teacherGroups);
        } else {
          const allGroups = await api.getGroups();
          const userGroups = allGroups.filter((g: any) =>
            (g.members || []).some((m: any) => m.profiles?.id === currentUser.id || m.user_id === currentUser.id)
          );
          setGroups(userGroups);

          // Get recent activities for user's primary group
          if (userGroups.length > 0) {
            const acts = await api.getActivities(userGroups[0].id);
            setActivities(acts);
          }
        }
      } catch (e) {
        console.error('Error loading profile groups:', e);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [currentUser?.id, isTeacher]);

  const handleSaveBio = async () => {
    if (!currentUser) return;
    const updated = await api.updateProfile(currentUser.id, { bio: bioText.trim() });
    if (updated) {
      toast.success('Bio updated in Supabase!');
      setIsEditingBio(false);
      refreshProfile();
    } else {
      toast.error('Failed to update bio');
    }
  };

  const userStats = {
    points: currentUser?.points || 0,
    level: currentUser?.level || 1,
    streak: currentUser?.streak || 0,
    badges: allBadges.map(b => ({
      ...b,
      unlocked: b.id === 'first-session' || (currentUser?.points || 0) >= 1000 || (currentUser?.streak || 0) >= 7,
      progress: b.id === 'point-collector' ? (currentUser?.points || 0) : b.progress,
    })),
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'teacher':
        return { label: 'Teacher', color: 'bg-green-100 text-green-700 border-green-300' };
      case 'team_leader':
        return { label: 'Leader', color: 'bg-blue-100 text-blue-700 border-blue-300' };
      case 'student':
        return { label: 'Student', color: 'bg-gray-100 text-gray-700 border-gray-300' };
      default:
        return { label: 'Member', color: 'bg-gray-100 text-gray-700 border-gray-300' };
    }
  };

  return (
    <div className="size-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
      <div className="p-4 sm:p-6 space-y-4 pb-20 max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div
              style={{ backgroundColor: currentUser?.color || (isTeacher ? '#10b981' : '#3b82f6') }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0"
            >
              {currentUser?.full_name?.charAt(0) || (isTeacher ? 'F' : 'S')}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{currentUser?.full_name || 'UIU User'}</h2>
                  <p className="text-xs sm:text-sm text-gray-500">{currentUser?.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold self-center sm:self-start ${
                  isTeacher ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isTeacher ? 'Faculty Member' : 'Undergraduate Student'}
                </span>
              </div>

              {/* Bio with inline edit */}
              <div className="mt-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                {isEditingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      rows={2}
                      className="w-full text-xs sm:text-sm p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingBio(false)} className="text-xs">Cancel</Button>
                      <Button size="sm" onClick={handleSaveBio} className="text-xs bg-blue-600 hover:bg-blue-700">Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="italic">{currentUser?.bio || 'Passionate UIU member collaborating on human-computer interaction and academic excellence.'}</p>
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="text-gray-400 hover:text-blue-600 p-1 flex-shrink-0"
                      title="Edit Bio"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Institution Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Institution</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-800">{currentUser?.university || 'UIU'}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Department</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-800">{currentUser?.department || 'CSE'}</span>
            </div>
          </div>
        </div>

        {/* Student Gamification or Teacher Stats */}
        {!isTeacher && (
          <GamificationPanel stats={userStats} compact={true} />
        )}

        {/* Groups */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className={isTeacher ? "text-green-600" : "text-blue-600"} />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                {isTeacher ? 'Supervised Course Groups' : 'My Project Teams'}
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-semibold">{groups.length} groups</span>
          </div>

          <div className="space-y-2">
            {groups.length === 0 ? (
              <div className="text-xs text-gray-400 py-3 text-center">No groups joined yet. Visit the Find tab to join or start a group!</div>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div>
                    <div className="font-semibold text-gray-900 text-xs sm:text-sm">{group.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{group.course}</div>
                  </div>
                  {isTeacher ? (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                      {group.progress || 0}% Done
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {!isTeacher && activities.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Recent Team Activity</h3>
            </div>
            <div className="space-y-2.5">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-center gap-2.5 text-xs text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-bold">{act.user_name}</span>
                  <span>{act.message}</span>
                  {act.task_title && <span className="text-gray-500 italic font-medium">"{act.task_title}"</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}