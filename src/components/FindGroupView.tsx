import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Users, MapPin, BookOpen, Plus, UserPlus, Mail, CheckCircle2, 
  Lock, Shield, KeyRound, Clock, ArrowRight, ShieldCheck, X 
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { CreateGroupModal } from './CreateGroupModal';
import { InviteMemberModal } from './InviteMemberModal';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export type UserRole = 'student' | 'team_leader' | 'teacher';

export interface GroupMember {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  university: string;
  course: string;
  description: string;
  members: GroupMember[];
  maxMembers: number;
  tags: string[];
  leader: GroupMember;
  isOpen: boolean;
  activeMembers: number;
  joinCode?: string;
  joinPassword?: string;
  requireApproval?: boolean;
  leaderId?: string;
}

export function FindGroupView() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingGroupIds, setPendingGroupIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Join by Code
  const [quickCode, setQuickCode] = useState('');
  const [quickCodeLoading, setQuickCodeLoading] = useState(false);

  // Password Join Modal
  const [passwordModalGroup, setPasswordModalGroup] = useState<Group | null>(null);
  const [joinPasswordInput, setJoinPasswordInput] = useState('');
  const [joiningWithPassword, setJoiningWithPassword] = useState(false);

  // Request to Join Modal
  const [requestModalGroup, setRequestModalGroup] = useState<Group | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const universities = [
    'All Universities',
    'UIU - United International University',
  ];

  const courses = [
    'All Courses',
    'Computer Science',
    'Human-Computer Interaction',
    'Web Development',
    'Data Science',
    'Artificial Intelligence',
    'Software Engineering',
  ];

  const fetchGroups = useCallback(async () => {
    try {
      const data = await api.getGroups(selectedCourse, searchQuery);
      const formatted: Group[] = data.map((g: any) => {
        const membersList: GroupMember[] = (g.members || []).map((m: any) => ({
          id: m.profiles?.id || m.id,
          name: m.profiles?.id === currentUser?.id ? 'You' : (m.profiles?.full_name || 'Member'),
          role: m.role as UserRole,
          color: m.profiles?.color || '#3b82f6',
        }));

        const leaderProfile = membersList.find(m => m.role === 'team_leader') || membersList[0] || {
          id: g.leader_id || '1',
          name: 'Leader',
          role: 'team_leader' as UserRole,
          color: '#3b82f6',
        };

        return {
          id: g.id,
          name: g.name,
          university: g.university || 'UIU - United International University',
          course: g.course,
          description: g.description || 'UIU collaboration group',
          members: membersList,
          maxMembers: g.max_members || 5,
          tags: g.tags || ['Active'],
          leader: leaderProfile,
          isOpen: g.is_open && membersList.length < (g.max_members || 5),
          activeMembers: membersList.length,
          joinCode: g.join_code,
          joinPassword: g.join_password,
          requireApproval: g.require_approval !== false,
          leaderId: g.leader_id,
        };
      });

      setGroups(formatted);

      if (currentUser) {
        const pending = await api.getUserPendingRequests(currentUser.id);
        setPendingGroupIds(pending);
      }
    } catch (e) {
      console.error('Error fetching groups:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, searchQuery, currentUser?.id]);

  useEffect(() => {
    fetchGroups();

    // Auto-check URL query for ?joinCode=...
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('joinCode');
      if (urlCode) {
        setQuickCode(urlCode.toUpperCase());
      }
    }

    const channel = supabase
      .channel('groups-sync-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        fetchGroups();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => {
        fetchGroups();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_join_requests' }, () => {
        fetchGroups();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGroups]);

  const filteredGroups = groups.filter((group) => {
    const matchesUniversity = selectedUniversity === 'all' || group.university === selectedUniversity;
    return matchesUniversity;
  });

  // Handle Quick Join with Code
  const handleQuickCodeJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim() || !currentUser) return;
    setQuickCodeLoading(true);

    try {
      const found = await api.getGroupByJoinCode(quickCode.trim());
      if (!found) {
        toast.error(`No group found with code "${quickCode.trim().toUpperCase()}". Please verify with your team leader.`);
        setQuickCodeLoading(false);
        return;
      }

      // Check if user is already in group
      const matching = groups.find(g => g.id === found.id);
      if (matching?.members.some(m => m.id === currentUser.id)) {
        toast.info(`You are already a member of "${found.name}"!`);
        setQuickCodeLoading(false);
        return;
      }

      // If group has password, open password dialog
      if (found.join_password) {
        setPasswordModalGroup({
          ...found,
          members: matching?.members || [],
          activeMembers: matching?.activeMembers || 1,
          leader: matching?.leader || { id: found.leader_id, name: 'Leader', role: 'team_leader', color: '#3b82f6' },
          isOpen: true,
          maxMembers: found.max_members,
        });
      } else {
        // Direct join with verified code
        const res = await api.joinGroupWithPassword(found.id, currentUser.id, undefined, quickCode.trim());
        if (res.success) {
          toast.success(`Welcome to "${found.name}"! Joined via invite code.`);
          setQuickCode('');
          fetchGroups();
        } else {
          toast.error(res.error || 'Failed to join group.');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error joining with code');
    } finally {
      setQuickCodeLoading(false);
    }
  };

  // Click on "Join Group" on a card
  const handleGroupCardClick = (group: Group) => {
    if (!currentUser) return;

    if (group.members.some(m => m.id === currentUser.id)) {
      toast.info(`You are already a member of "${group.name}".`);
      return;
    }

    if (pendingGroupIds.includes(group.id)) {
      toast.info('Your join request is currently pending creator review.');
      return;
    }

    // If group has a passcode
    if (group.joinPassword && group.joinPassword.trim() !== '') {
      setPasswordModalGroup(group);
      setJoinPasswordInput('');
    } else if (group.requireApproval) {
      // Group requires approval
      setRequestModalGroup(group);
      setRequestNote('');
    } else {
      // Open group: join directly
      submitDirectJoin(group.id, group.name);
    }
  };

  const submitDirectJoin = async (groupId: string, groupName: string) => {
    if (!currentUser) return;
    const res = await api.joinGroupWithPassword(groupId, currentUser.id);
    if (res.success) {
      toast.success(`Joined "${groupName}" successfully!`);
      fetchGroups();
    } else {
      toast.error(res.error || 'Could not join group');
    }
  };

  // Submit Password in Modal
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalGroup || !currentUser) return;
    setJoiningWithPassword(true);

    try {
      const res = await api.joinGroupWithPassword(
        passwordModalGroup.id, 
        currentUser.id, 
        joinPasswordInput
      );

      if (res.success) {
        toast.success(`Authenticated with passcode! Joined "${passwordModalGroup.name}".`);
        setPasswordModalGroup(null);
        setJoinPasswordInput('');
        fetchGroups();
      } else {
        toast.error(res.error || 'Incorrect group password.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication error');
    } finally {
      setJoiningWithPassword(false);
    }
  };

  // Submit Join Request
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalGroup || !currentUser) return;
    setSubmittingRequest(true);

    try {
      const res = await api.sendJoinRequest(
        requestModalGroup.id,
        currentUser.id,
        currentUser.full_name,
        currentUser.email,
        requestNote.trim() || undefined
      );

      if (res.success) {
        toast.success(`Join request sent to the leader of "${requestModalGroup.name}"!`);
        setRequestModalGroup(null);
        setRequestNote('');
        setPendingGroupIds((prev) => [...prev, requestModalGroup.id]);
        fetchGroups();
      } else {
        toast.error(res.error || 'Failed to send request.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Handle Group Creation
  const handleCreateGroup = async (newGroupData: {
    name: string;
    university: string;
    course: string;
    description: string;
    maxMembers: number;
    tags: string[];
    joinPassword?: string;
    requireApproval?: boolean;
  }) => {
    if (!currentUser) return;
    const created = await api.createGroup({
      name: newGroupData.name,
      university: newGroupData.university,
      course: newGroupData.course,
      description: newGroupData.description,
      max_members: newGroupData.maxMembers,
      tags: newGroupData.tags,
      leader_id: currentUser.id,
      join_password: newGroupData.joinPassword,
      require_approval: newGroupData.requireApproval,
    });

    if (created) {
      toast.success(`Group "${newGroupData.name}" created with secure join code!`);
      fetchGroups();
      setShowCreateModal(false);
    } else {
      toast.error('Failed to create group');
    }
  };

  return (
    <div className="size-full overflow-y-auto bg-gradient-to-b from-blue-50/30 to-white">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 pb-20 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-blue-400/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Student Productivity Groups</h2>
                <p className="text-blue-100/90 text-xs sm:text-sm mt-0.5">
                  Verified peer collaboration with password authentication & creator approval
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg rounded-xl text-xs sm:text-sm gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Create Team Group</span>
            </Button>
          </div>

          {/* Quick Join Bar */}
          <div className="mt-5 pt-4 border-t border-white/15">
            <form onSubmit={handleQuickCodeJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type="text"
                  placeholder="Have an Invite Code or Link? e.g. UIU-4821"
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white/10 placeholder-white/60 text-white rounded-xl border border-white/25 focus:outline-none focus:bg-white/20 focus:border-white transition-all font-mono"
                />
              </div>
              <Button
                type="submit"
                disabled={quickCodeLoading || !quickCode.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20"
              >
                <span>{quickCodeLoading ? 'Verifying...' : 'Join with Code'}</span>
                <ArrowRight size={14} />
              </Button>
            </form>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <Input
                type="text"
                placeholder="Search groups by name, tag, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 text-xs sm:text-sm bg-gray-50/50 focus:bg-white"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 border-gray-200 rounded-xl text-xs font-semibold"
            >
              <Filter size={15} />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Filter by Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none"
                >
                  {courses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Filter by University</label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none"
                >
                  {universities.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Group Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map((group) => {
            const isUserMember = group.members.some(m => m.id === currentUser?.id);
            const isLeader = group.leader?.id === currentUser?.id || group.leaderId === currentUser?.id;
            const isPending = pendingGroupIds.includes(group.id);
            const hasPassword = Boolean(group.joinPassword && group.joinPassword.trim() !== '');

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">{group.name}</h3>
                        {hasPassword && (
                          <span className="p-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200" title="Passcode Protected Group">
                            <Lock size={12} />
                          </span>
                        )}
                        {group.requireApproval && !hasPassword && (
                          <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200" title="Creator Approval Required">
                            <Shield size={12} />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{group.course}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        group.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {group.activeMembers}/{group.maxMembers} Members
                      </span>
                      {group.joinCode && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          Code: {group.joinCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                    {group.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {group.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Members Avatars */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] text-gray-400 font-medium">Members:</span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {group.members.map((m, i) => (
                        <div
                          key={m.id || i}
                          style={{ backgroundColor: m.color }}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white text-white font-bold text-[10px] flex items-center justify-center"
                          title={m.name}
                        >
                          {m.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions with Complete Authenticity */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {isUserMember ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold flex-1 justify-center border border-green-200">
                      <CheckCircle2 size={15} />
                      <span>{isLeader ? 'You (Team Leader)' : 'You are in this team'}</span>
                    </div>
                  ) : isPending ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold flex-1 justify-center border border-amber-200">
                      <Clock size={15} className="animate-spin" />
                      <span>Request Pending Approval</span>
                    </div>
                  ) : group.isOpen ? (
                    <Button
                      onClick={() => handleGroupCardClick(group)}
                      className={`flex-1 rounded-xl text-xs font-semibold py-2 flex items-center justify-center gap-1.5 ${
                        hasPassword 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {hasPassword ? <Lock size={13} /> : <ShieldCheck size={13} />}
                      <span>
                        {hasPassword ? 'Join with Passcode' : group.requireApproval ? 'Request to Join' : 'Join Group'}
                      </span>
                    </Button>
                  ) : (
                    <Button disabled className="flex-1 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold py-2">
                      Group Full
                    </Button>
                  )}

                  {/* Invite & Security Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowInviteModal(true);
                    }}
                    className="rounded-xl border-gray-200 hover:bg-blue-50 hover:text-blue-600 shrink-0"
                    title="Share Invite Link & Manage Access"
                  >
                    <UserPlus size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Users size={32} className="text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-700">No groups match your criteria</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to start a group for your course!</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* Share / Invite / Request Management Modal */}
      {showInviteModal && selectedGroup && (
        <InviteMemberModal
          group={selectedGroup}
          onClose={() => setShowInviteModal(false)}
          onMemberUpdated={fetchGroups}
        />
      )}

      {/* Password Authentication Modal */}
      {passwordModalGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Passcode Protected</h3>
                  <p className="text-xs text-gray-500">{passwordModalGroup.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalGroup(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              This group requires a team passcode set by the group creator. Enter the passcode to join immediately:
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Group Passcode *</label>
                <Input
                  type="password"
                  required
                  placeholder="Enter secret team passcode"
                  value={joinPasswordInput}
                  onChange={(e) => setJoinPasswordInput(e.target.value)}
                  className="text-xs sm:text-sm bg-gray-50 rounded-xl"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const grp = passwordModalGroup;
                    setPasswordModalGroup(null);
                    setRequestModalGroup(grp);
                  }}
                  className="flex-1 rounded-xl text-xs font-semibold text-gray-600"
                >
                  Request to Join
                </Button>
                <Button
                  type="submit"
                  disabled={joiningWithPassword || !joinPasswordInput.trim()}
                  className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  {joiningWithPassword ? 'Verifying...' : 'Unlock & Join'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request to Join Modal */}
      {requestModalGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Request to Join</h3>
                  <p className="text-xs text-gray-500">{requestModalGroup.name}</p>
                </div>
              </div>
              <button
                onClick={() => setRequestModalGroup(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Your request will be sent directly to the team leader for verification and approval.
            </p>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Your Details</label>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-0.5">
                  <div className="font-bold">{currentUser?.full_name}</div>
                  <div className="text-gray-500">{currentUser?.email}</div>
                  <div className="text-[11px] text-blue-600">{currentUser?.department}</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Message to Team Leader (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Hi, I would love to collaborate on the HCI frontend & usability testing deliverables!"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  className="w-full p-3 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestModalGroup(null)}
                  className="flex-1 rounded-xl text-xs font-semibold text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  {submittingRequest ? 'Sending...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}