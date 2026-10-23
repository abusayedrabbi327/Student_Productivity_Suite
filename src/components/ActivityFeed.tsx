import { MessageCircle, CheckCircle, UserPlus, Clock } from 'lucide-react';

export interface Activity {
  id: string;
  type: 'comment' | 'task_moved' | 'member_added' | 'task_completed';
  user: string;
  message: string;
  timestamp: Date;
  taskTitle?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'comment':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'task_moved':
        return <Clock size={16} className="text-orange-500" />;
      case 'member_added':
        return <UserPlus size={16} className="text-green-500" />;
      case 'task_completed':
        return <CheckCircle size={16} className="text-green-600" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-md max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No recent activity
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{activity.user}</span>{' '}
                        {activity.message}
                        {activity.taskTitle && (
                          <span className="font-semibold"> "{activity.taskTitle}"</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}