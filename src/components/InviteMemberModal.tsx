import { useState, useEffect } from 'react';
import { X, Copy, Check, Users, Search, Shield, UserPlus, CheckCircle2, XCircle, Clock, Link as LinkIcon, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { Group } from './FindGroupView';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DbGroupJoinRequest, DbProfile } from '../lib/supabase';

interface InviteMemberModalProps {
  group: Group;
  onClose: () => void;
  onMemberUpdated?: () => void;
}

export function InviteMemberModal({ group, onClose, onMemberUpdated }: InviteMemberModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'link' | 'search' | 'requests'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Search real students from Supabase
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DbProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Pending Join Requests
  const [requests, setRequests] = useState<DbGroupJoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isLeader = group.leader?.id === currentUser?.id || (group as any).leaderId === currentUser?.id;
  const joinCode = (group as any).joinCode || group.id.substring(0, 6).toUpperCase();
  const joinPassword = (group as any).joinPassword;

  // Construct invite link
  const inviteLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?joinCode=${joinCode}` 
    : `https://uiu.ac.bd/?joinCode=${joinCode}`;

  // Copy helper
  const copyToClipboard = async (text: string, type: 'link' | 'code' | 'pass') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast.success('Invite link copied to clipboard!');
      } else if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        toast.success(`Join Code "${text}" copied!`);
      } else {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
        toast.success('Group Passcode copied!');
      }
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Search students from Supabase
  useEffect(() => {
    let active = true;
    const fetchStudents = async () => {
      setSearching(true);
      try {
        const students = await api.searchRegisteredStudents(searchQuery);
        if (active) {
          // Filter out existing members
          const existingIds = new Set(group.members.map((m) => m.id));
          setSearchResults(students.filter((s) => !existingIds.has(s.id)));
        }
      } catch (err) {
        console.error('Error searching students:', err);
      } finally {
        if (active) setSearching(false);
      }
    };

    const timer = setTimeout(fetchStudents, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, group.members]);

  // Load pending join requests
  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await api.getGroupJoinRequests(group.id);
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [group.id]);

  // Handle direct add from directory
  const handleAddStudent = async (student: DbProfile) => {
    setAddingUserId(student.id);
    try {
      const success = await api.joinGroup(group.id, student.id);
      if (success) {
        toast.success(`Added ${student.full_name} to "${group.name}"!`);
        await api.logActivity(
          group.id,
          currentUser?.id || student.id,
          currentUser?.full_name || 'Team Leader',
          'member_joined',
          `added ${student.full_name} to the team`
        );
        onMemberUpdated?.();
      } else {
        toast.error('Could not add member. Group may be full.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error adding student');
    } finally {
      setAddingUserId(null);
    }
  };

  // Handle Accept/Reject Join Request
  const handleRequestResponse = async (req: DbGroupJoinRequest, accept: boolean) => {
    setProcessingId(req.id);
    try {
      const success = await api.respondToJoinRequest(
        req.id,
        group.id,
        req.user_id,
        req.user_name,
        accept
      );

      if (success) {
        if (accept) {
          toast.success(`Accepted ${req.user_name} into the team!`);
          onMemberUpdated?.();
        } else {
          toast.info(`Declined join request from ${req.user_name}.`);
        }
        await loadRequests();
      } else {
        toast.error('Action failed. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">Team Access & Invites</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{group.name} • {group.course}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors shadow-sm border border-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-100/90 p-1 rounded-xl mt-5 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'link'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LinkIcon size={14} />
              <span>Share Link & Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search size={14} />
              <span>UIU Students</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                activeTab === 'requests'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={14} />
              <span>Join Requests</span>
              {requests.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                  {requests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Share Link & Passcode */}
        {activeTab === 'link' && (
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Shareable Invite Link */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon size={14} className="text-blue-600" /> Direct Joining Link
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant Team Join
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Send this secure link to your UIU team members. When opened, it connects them straight to this group.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-700 font-mono truncate focus:outline-none"
                />
                <Button
                  onClick={() => copyToClipboard(inviteLink, 'link')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </Button>
              </div>
            </div>

            {/* Quick Join Code & Passcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Join Code */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                    Group Join Code
                  </span>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Teammates can paste this code into the Find Group search bar.
                  </p>
                </div>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-2.5">
                  <span className="text-sm font-extrabold text-blue-700 tracking-wider font-mono">
                    {joinCode}
                  </span>
                  <button
                    onClick={() => copyToClipboard(joinCode, 'code')}
                    className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Group Password / Passcode */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Lock size={12} className="text-amber-600" /> Group Passcode
                  </span>
                  <p className="text-[11px] text-gray-500 mb-2">
                    {joinPassword ? 'Protected by creator secret passcode.' : 'No passcode set (open / request-based).'}
                  </p>
                </div>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-2.5">
                  <span className="text-xs font-bold text-gray-800 font-mono">
                    {joinPassword || 'None (Open)'}
                  </span>
                  {joinPassword && (
                    <button
                      onClick={() => copyToClipboard(joinPassword, 'pass')}
                      className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Copy Passcode"
                    >
                      {copiedPass ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Security Explanation */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Shield size={14} className="text-blue-600" /> Authentic Peer Verification
              </p>
              <p className="text-blue-700/90 leading-relaxed text-[11px]">
                Unauthorized students cannot join without your permission. They must either supply the secret passcode above or submit an official Join Request for you to review and approve.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Live UIU Student Directory (No Mock Data!) */}
        {activeTab === 'search' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search registered UIU students by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs py-2 bg-gray-50 border-gray-300 rounded-xl focus:bg-white"
                autoFocus
              />
            </div>

            <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
              {searching ? (
                <div className="text-center py-8 text-xs text-gray-400">Searching UIU database...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs font-semibold text-gray-600">No matching students found</p>
                  <p className="text-[11px] text-gray-400 mt-1">Try searching by student name or UIU email.</p>
                </div>
              ) : (
                searchResults.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: student.color || '#3b82f6' }}
                        className="w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-sm"
                      >
                        {student.full_name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{student.full_name}</div>
                        <div className="text-[11px] text-gray-500">{student.email}</div>
                        <div className="text-[10px] text-blue-600 font-medium">{student.department}</div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAddStudent(student)}
                      disabled={addingUserId === student.id}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 flex items-center gap-1 shadow-sm"
                    >
                      <UserPlus size={13} />
                      <span>{addingUserId === student.id ? 'Adding...' : 'Add'}</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Creator Approval / Join Requests */}
        {activeTab === 'requests' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Pending Join Requests ({requests.length})
                </h4>
                <p className="text-[11px] text-gray-500">
                  {isLeader ? 'You have administrative control to accept or reject applicants.' : 'Review peers requesting to collaborate.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRequests}
                disabled={loadingRequests}
                className="text-xs rounded-xl h-7"
              >
                Refresh
              </Button>
            </div>

            {loadingRequests ? (
              <div className="text-center py-8 text-xs text-gray-400">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-gray-700">No Pending Requests</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  When students ask to join your group, their requests will appear here for your approval.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {req.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{req.user_name}</div>
                          <div className="text-[11px] text-gray-500">{req.user_email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Clock size={10} /> Pending
                      </span>
                    </div>

                    {req.message && (
                      <div className="bg-gray-50 p-2.5 rounded-xl text-xs text-gray-700 italic border border-gray-100">
                        "{req.message}"
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => handleRequestResponse(req, true)}
                        disabled={processingId === req.id}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20"
                      >
                        <Check size={14} />
                        <span>Accept Member</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestResponse(req, false)}
                        disabled={processingId === req.id}
                        className="flex-1 rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-semibold py-1.5 flex items-center justify-center gap-1.5"
                      >
                        <X size={14} />
                        <span>Decline</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-bold px-5"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}