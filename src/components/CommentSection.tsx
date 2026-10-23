import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export interface Comment {
  id: string;
  user: string;
  userColor: string;
  message: string;
  timestamp: Date;
}

interface CommentSectionProps {
  taskId: string;
  taskTitle: string;
  comments: Comment[];
  onAddComment: (taskId: string, message: string) => void;
}

export function CommentSection({ taskId, taskTitle, comments, onAddComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(taskId, newComment.trim());
      setNewComment('');
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-800">{taskTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{comments.length} comments</span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Comments List */}
          <div className="max-h-60 overflow-y-auto p-3 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: comment.userColor }}
                  >
                    {comment.user[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900">{comment.user}</span>
                      <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{comment.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim()}
                className="px-3"
              >
                <Send size={14} />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
