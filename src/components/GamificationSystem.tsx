import { Trophy, Star, Flame, Target, Award, Zap, Sparkles, Rocket, TrendingUp } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Changed from emoji to icon
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface UserStats {
  points: number;
  level: number;
  streak: number;
  badges: Badge[];
}

export const allBadges: Badge[] = [
  {
    id: 'first-session',
    name: 'First Step',
    description: 'Complete your first focus session',
    icon: 'target',
    unlocked: true,
    progress: 1,
    maxProgress: 1,
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    unlocked: true,
    progress: 7,
    maxProgress: 7,
  },
  {
    id: 'point-collector',
    name: 'Point Collector',
    description: 'Earn 1000 points',
    icon: 'star',
    unlocked: true,
    progress: 1247,
    maxProgress: 1000,
  },
  {
    id: 'task-master',
    name: 'Task Master',
    description: 'Complete 25 tasks',
    icon: 'trophy',
    unlocked: false,
    progress: 12,
    maxProgress: 25,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Start a session before 7 AM',
    icon: 'trending-up',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a session after 10 PM',
    icon: 'zap',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
];

export const motivationalMessages = [
  { icon: 'sparkles', message: 'You\'re doing amazing!' },
  { icon: 'zap', message: 'Keep pushing forward!' },
  { icon: 'rocket', message: 'You\'re unstoppable!' },
  { icon: 'star', message: 'Success is just around the corner!' },
  { icon: 'target', message: 'Focus on your goals!' },
  { icon: 'flame', message: 'You\'re on fire!' },
  { icon: 'sparkles', message: 'Brilliance in progress!' },
  { icon: 'trophy', message: 'Champion mindset!' },
];

export function getRandomMotivation() {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
}

export function calculateLevel(points: number): number {
  return Math.floor(points / 200) + 1;
}

export function getPointsToNextLevel(points: number): number {
  const currentLevel = calculateLevel(points);
  const nextLevelPoints = currentLevel * 200;
  return nextLevelPoints - points;
}

interface GamificationPanelProps {
  stats: UserStats;
  compact?: boolean;
}

export function GamificationPanel({ stats, compact = false }: GamificationPanelProps) {
  const pointsToNext = getPointsToNextLevel(stats.points);
  const levelProgress = ((stats.points % 200) / 200) * 100;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={24} className="text-yellow-300" />
            <div>
              <div className="text-2xl font-bold">{stats.points}</div>
              <div className="text-xs text-purple-100">Points</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame size={24} className="text-orange-300" />
            <div>
              <div className="text-2xl font-bold">{stats.streak}</div>
              <div className="text-xs text-purple-100">Day Streak</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star size={16} className="text-yellow-300" />
          <span>Level {stats.level}</span>
          <div className="flex-1 bg-white/20 rounded-full h-2 ml-2">
            <div
              className="bg-yellow-300 h-2 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level Progress */}
      <div className="bg-white rounded-xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={20} className="text-yellow-500" />
            <span className="font-semibold text-gray-900">Level {stats.level}</span>
          </div>
          <span className="text-xs text-gray-500">{pointsToNext} pts to next level</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-xl p-5 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-purple-500" />
          <h3 className="font-semibold text-gray-900">Badges</h3>
          <span className="text-xs text-gray-500 ml-auto">
            {stats.badges.filter(b => b.unlocked).length}/{stats.badges.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.badges.slice(0, 6).map((badge) => {
            const IconComponent = 
              badge.icon === 'target' ? Target :
              badge.icon === 'flame' ? Flame :
              badge.icon === 'star' ? Star :
              badge.icon === 'trophy' ? Trophy :
              badge.icon === 'trending-up' ? TrendingUp :
              badge.icon === 'zap' ? Zap : Target;
            
            return (
              <div
                key={badge.id}
                className={`
                  relative p-3 rounded-lg text-center transition-all
                  ${badge.unlocked
                    ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300'
                    : 'bg-gray-100 border-2 border-gray-200 opacity-50'
                  }
                `}
              >
                <div className="flex items-center justify-center mb-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    badge.unlocked ? 'bg-purple-500' : 'bg-gray-300'
                  }`}>
                    <IconComponent size={20} className="text-white" />
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-900">{badge.name}</div>
                {badge.maxProgress && !badge.unlocked && (
                  <div className="mt-2 bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-purple-500 h-1 rounded-full"
                      style={{ width: `${(badge.progress! / badge.maxProgress) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}