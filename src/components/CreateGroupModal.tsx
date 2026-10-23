import { useState } from 'react';
import { X, Users, MapPin, BookOpen, AlignLeft, Hash, Lock, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (group: {
    name: string;
    university: string;
    course: string;
    description: string;
    maxMembers: number;
    tags: string[];
    joinPassword?: string;
    requireApproval?: boolean;
  }) => void;
}

export function CreateGroupModal({ isOpen, onClose, onCreateGroup }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [joinPassword, setJoinPassword] = useState('');
  const [requireApproval, setRequireApproval] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const universities = [
    'UIU - United International University',
  ];

  const courses = [
    'Computer Science',
    'Human-Computer Interaction',
    'Web Development',
    'Data Science',
    'Artificial Intelligence',
    'Software Engineering',
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !university || !course || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    onCreateGroup({
      name: groupName,
      university,
      course,
      description,
      maxMembers,
      tags,
      joinPassword: joinPassword.trim() || undefined,
      requireApproval,
    });

    // Reset form
    setGroupName('');
    setUniversity('');
    setCourse('');
    setDescription('');
    setMaxMembers(5);
    setJoinPassword('');
    setRequireApproval(true);
    setTags([]);
    setTagInput('');
    
    toast.success(`Group "${groupName}" created successfully!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Create New Group</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Group Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <Users size={16} />
              Group Name *
            </label>
            <Input
              type="text"
              placeholder="e.g., HCI Research Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {/* University */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <MapPin size={16} />
              University *
            </label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select university</option>
              {universities.map((uni, idx) => (
                <option key={idx} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <BookOpen size={16} />
              Course *
            </label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select course</option>
              {courses.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <AlignLeft size={16} />
              Description *
            </label>
            <textarea
              placeholder="Describe your group's goals and projects..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Max Members */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <Hash size={16} />
              Maximum Members
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="10"
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-gray-900 w-8 text-center">
                {maxMembers}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Tags (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                variant="outline"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">{tags.length}/5 tags</p>
          </div>

          {/* Group Authenticity & Access Protection */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Group Authenticity & Security</h4>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                Group Passcode / Password (Optional)
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="e.g. HCI2024 or secret PIN (share with your team)"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Anyone with this password or your invite link can join directly.
              </p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-semibold text-gray-800 block">Require Creator Approval</span>
                <span className="text-[11px] text-gray-500 block leading-tight">
                  Students without the password must send a join request. You can accept or decline each request.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              Create Group
            </Button>
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}