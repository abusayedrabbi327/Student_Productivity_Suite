import { Member } from './MemberAvatar';
import { Task } from './TaskCard';
import { Button } from './ui/button';
import { Bell } from 'lucide-react';

interface StatsViewProps {
  members: Member[];
  tasks: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
  onSendReminder: (memberId: string) => void;
}

export function StatsView({ members, tasks, onSendReminder }: StatsViewProps) {
  // Calculate contribution for each member
  const allTasks = [...tasks.todo, ...tasks.inProgress, ...tasks.done];
  
  const memberStats = members.map((member) => {
    const assignedTasks = allTasks.filter((task) =>
      task.assignees.includes(member.id)
    );
    const completedTasks = tasks.done.filter((task) =>
      task.assignees.includes(member.id)
    );
    
    return {
      member,
      assignedCount: assignedTasks.length,
      completedCount: completedTasks.length,
      contributionPercent: allTasks.length > 0 
        ? Math.round((assignedTasks.length / allTasks.length) * 100)
        : 0,
    };
  });

  // Find members with low contribution
  const lowPerformers = memberStats.filter(
    (stat) => stat.assignedCount === 0 || stat.contributionPercent < 15
  );

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Contribution Visualization */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-6">Team Contribution</h2>
          
          <div className="space-y-6">
            {memberStats.map((stat) => (
              <div key={stat.member.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: stat.member.color }}
                    >
                      {stat.member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {stat.member.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stat.assignedCount} {stat.assignedCount === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {stat.contributionPercent}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stat.contributionPercent}%`,
                      backgroundColor: stat.member.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        {lowPerformers.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Pending Actions</h2>
            
            <div className="space-y-3">
              {lowPerformers.map((stat) => (
                <div
                  key={stat.member.id}
                  className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: stat.member.color }}
                    >
                      {stat.member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{stat.member.name}</span> has{' '}
                      {stat.assignedCount} active {stat.assignedCount === 1 ? 'task' : 'tasks'}
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => onSendReminder(stat.member.id)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Bell size={14} />
                    Send Reminder
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
