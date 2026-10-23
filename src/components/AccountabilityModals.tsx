import React, { useState } from 'react';
import { X, FolderPlus, PlusCircle, UserPlus, Users } from 'lucide-react';
import { Member } from './MemberAvatar';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, course: string, description: string) => void;
}

export function AddProjectModal({ isOpen, onClose, onAdd }: AddProjectModalProps) {
  const [name, setName] = useState('');
  const [course, setCourse] = useState('Human-Computer Interaction');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), course, description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Create Project Team</h3>
              <p className="text-xs text-gray-500">Collaborate with peers on tasks & milestones</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. HCI Smart Attendance System"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Associated Course</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
            >
              <option value="Human-Computer Interaction">Human-Computer Interaction</option>
              <option value="Web Development">Web Development</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Data Science">Data Science</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Project Goal & Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of the team's objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAdd: (title: string, assigneeId?: string) => void;
}

export function AddTaskModal({ isOpen, onClose, members, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), assigneeId || undefined);
    setTitle('');
    setAssigneeId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Add Kanban Task</h3>
              <p className="text-xs text-gray-500">Assign deliverables to team members</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Usability Testing & Survey Forms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Assign Member (Optional)</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
            >
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Add to Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, email?: string) => void;
}

export function AddMemberModal({ isOpen, onClose, onAdd }: AddMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), email.trim() || undefined);
    setName('');
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
              <p className="text-xs text-gray-500">Add a peer to this project board</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Member Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Siyam Ahmed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">UIU Email (Optional)</label>
            <input
              type="email"
              placeholder="e.g. sahmed@bscse.uiu.ac.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
