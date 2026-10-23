import { X, TrendingUp, Clock, CheckCircle2, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';

interface MemberContribution {
  id: string;
  name: string;
  role: string;
  tasksCompleted: number;
  focusHours: number;
  lastActive: string;
  color: string;
  contributionScore: number;
}

interface ContributionViewProps {
  groupName: string;
  members: MemberContribution[];
  onClose: () => void;
}

export function ContributionView({ groupName, members, onClose }: ContributionViewProps) {
  const maxTasks = Math.max(...members.map(m => m.tasksCompleted), 1);
  const maxHours = Math.max(...members.map(m => m.focusHours), 1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Contribution Summary</h3>
            <p className="text-sm text-gray-600 mt-0.5">{groupName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {members.reduce((sum, m) => sum + m.tasksCompleted, 0)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total Tasks</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {members.reduce((sum, m) => sum + m.focusHours, 0).toFixed(1)}h
              </div>
              <div className="text-xs text-gray-600 mt-1">Total Hours</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(members.reduce((sum, m) => sum + m.contributionScore, 0) / members.length)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">Avg Score</div>
            </div>
          </div>

          {/* Individual Contributions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              Individual Contributions
            </h4>
            
            {members
              .sort((a, b) => b.contributionScore - a.contributionScore)
              .map((member) => (
                <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* Member Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-600">{member.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {member.contributionScore}%
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>

                  {/* Contribution Bars */}
                  <div className="space-y-2.5">
                    {/* Tasks Completed */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Tasks Completed
                        </span>
                        <span className="font-semibold">{member.tasksCompleted}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(member.tasksCompleted / maxTasks) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Focus Hours */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Focus Hours
                        </span>
                        <span className="font-semibold">{member.focusHours}h</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${(member.focusHours / maxHours) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Last Active */}
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                      <TrendingUp size={12} />
                      Last active {member.lastActive}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Insights */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Lightbulb size={16} className="text-yellow-700" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Insights</h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {members[0]?.name} is leading the team with the highest contribution score. 
                  Consider recognizing their efforts and encouraging others to match their engagement level.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}