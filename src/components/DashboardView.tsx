import { useState, useEffect } from 'react';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  TrendingUp,
  Calendar,
  Zap,
  Award,
  Sparkles,
  Rocket,
  Flame,
  Star,
  Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GamificationPanel, allBadges, getRandomMotivation } from './GamificationSystem';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { DbDailyGoal } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';

export function DashboardView() {
  const { currentUser } = useAuth();
  const [dailyGoals, setDailyGoals] = useState<DbDailyGoal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [taskStats, setTaskStats] = useState({ done: 0, inProgress: 0, todo: 0 });
  const [totalFocusHours, setTotalFocusHours] = useState('0.0h');
  const [weeklyProgress, setWeeklyProgress] = useState<{ day: string; hours: number }[]>([
    { day: 'Mon', hours: 0 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  const motivation = getRandomMotivation();

  // Load real data from Supabase
  useEffect(() => {
    if (!currentUser) return;

    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Goals
        const goals = await api.getDailyGoals(currentUser.id);
        setDailyGoals(goals);

        // 2. Fetch Tasks count for user's relevant groups
        const groups = await api.getGroups();
        const userGroups = groups.filter((g: any) =>
          g.leader_id === currentUser.id ||
          (g.members || []).some((m: any) => m.profiles?.id === currentUser.id || m.user_id === currentUser.id)
        );

        let done = 0;
        let inProgress = 0;
        let todo = 0;

        for (const g of userGroups) {
          const tasks = await api.getTasks(g.id);
          done += tasks.filter(t => t.status === 'done').length;
          inProgress += tasks.filter(t => t.status === 'inProgress').length;
          todo += tasks.filter(t => t.status === 'todo').length;
        }
        setTaskStats({ done, inProgress, todo });

        // 3. Fetch Real Focus Sessions
        const sessions = await api.getRecentFocusSessions(currentUser.id);
        const minutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
        setTotalFocusHours(`${(minutes / 60).toFixed(1)}h`);

        // Compute real weekly progress
        const dayMap: { [key: string]: number } = {
          Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
        };
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        sessions.forEach(s => {
          const d = new Date(s.completed_at);
          const dayName = dayNames[d.getDay()];
          if (dayMap[dayName] !== undefined) {
            dayMap[dayName] += Number((s.duration_minutes / 60).toFixed(1));
          }
        });

        // For demo user with no sessions yet, provide standard benchmark
        if (sessions.length === 0 && currentUser.email === 'student@uiu.ac.bd') {
          setWeeklyProgress([
            { day: 'Mon', hours: 2.5 },
            { day: 'Tue', hours: 3.0 },
            { day: 'Wed', hours: 1.5 },
            { day: 'Thu', hours: 4.0 },
            { day: 'Fri', hours: 2.8 },
            { day: 'Sat', hours: 3.5 },
            { day: 'Sun', hours: 2.0 },
          ]);
        } else {
          setWeeklyProgress([
            { day: 'Mon', hours: dayMap['Mon'] },
            { day: 'Tue', hours: dayMap['Tue'] },
            { day: 'Wed', hours: dayMap['Wed'] },
            { day: 'Thu', hours: dayMap['Thu'] },
            { day: 'Fri', hours: dayMap['Fri'] },
            { day: 'Sat', hours: dayMap['Sat'] },
            { day: 'Sun', hours: dayMap['Sun'] },
          ]);
        }
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser?.id, currentUser?.email]);

  const handleToggleGoal = async (goal: DbDailyGoal) => {
    const updatedStatus = !goal.completed;
    setDailyGoals(prev => prev.map(g => g.id === goal.id ? { ...g, completed: updatedStatus } : g));
    const ok = await api.toggleDailyGoal(goal.id, updatedStatus);
    if (ok) {
      if (updatedStatus && currentUser) {
        toast.success('Goal completed! +25 points awarded');
        api.incrementPointsAndStreak(currentUser.id, 25);
      }
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !currentUser) return;
    const created = await api.addDailyGoal(currentUser.id, newGoalTitle.trim());
    if (created) {
      setDailyGoals(prev => [...prev, created]);
      setNewGoalTitle('');
      setIsAddingGoal(false);
      toast.success('Goal added to Supabase!');
    }
  };

  const userStats = {
    points: currentUser?.points || 0,
    level: currentUser?.level || 1,
    streak: currentUser?.streak || 0,
    badges: allBadges.map(b => {
      const isPointsBadge = b.id === 'point-collector';
      const isStreakBadge = b.id === 'week-warrior';
      const isFirstSession = b.id === 'first-session';
      const isTaskMaster = b.id === 'task-master';

      const points = currentUser?.points || 0;
      const streak = currentUser?.streak || 0;
      const tasksDone = taskStats.done;

      let unlocked = false;
      let progress = 0;

      if (isFirstSession) {
        unlocked = parseFloat(totalFocusHours) > 0 || points > 0;
        progress = unlocked ? 1 : 0;
      } else if (isStreakBadge) {
        unlocked = streak >= 7;
        progress = Math.min(streak, 7);
      } else if (isPointsBadge) {
        unlocked = points >= 1000;
        progress = points;
      } else if (isTaskMaster) {
        unlocked = tasksDone >= 25;
        progress = tasksDone;
      }

      return {
        ...b,
        unlocked,
        progress,
      };
    }),
  };

  const hasTasks = taskStats.done > 0 || taskStats.inProgress > 0 || taskStats.todo > 0;

  const taskDistribution = hasTasks
    ? [
        { name: 'Completed', value: taskStats.done, color: '#10b981' },
        { name: 'In Progress', value: taskStats.inProgress, color: '#f59e0b' },
        { name: 'To Do', value: taskStats.todo, color: '#6b7280' },
      ].filter(t => t.value > 0)
    : [{ name: 'No Tasks', value: 1, color: '#e5e7eb' }];

  const stats = [
    { label: 'Total Points', value: (currentUser?.points || 0).toLocaleString(), icon: Trophy, color: 'from-yellow-400 to-orange-500' },
    { label: 'Focus Hours', value: totalFocusHours, icon: Clock, color: 'from-blue-400 to-blue-600' },
    { label: 'Tasks Done', value: taskStats.done.toString(), icon: CheckCircle2, color: 'from-green-400 to-green-600' },
    { label: 'Streak Days', value: (currentUser?.streak || 0).toString(), icon: Zap, color: 'from-purple-400 to-purple-600' },
  ];

  return (
    <div className="size-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
      <div className="p-4 sm:p-6 space-y-4 pb-20 max-w-5xl mx-auto">
        {/* Welcome Header */}
        <div 
          className="rounded-2xl p-5 sm:p-6 shadow-lg text-white"
          style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)', color: '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 text-white">Welcome, {currentUser?.full_name?.split(' ')[0]}! 👋</h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                UIU Student Suite • {currentUser?.department || 'Computer Science & Engineering'}
              </p>
            </div>
            <Award size={42} className="text-white/80" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-3.5 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2 shadow-sm text-white`}>
                <stat.icon size={18} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Daily Goals (Interactive & synced to Supabase) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Daily Action Goals</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">
                {dailyGoals.filter(g => g.completed).length}/{dailyGoals.length}
              </span>
              <button
                onClick={() => setIsAddingGoal(!isAddingGoal)}
                className="p-1 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                title="Add goal"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {isAddingGoal && (
            <form onSubmit={handleAddGoal} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Enter new goal..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Add
              </button>
            </form>
          )}

          <div className="space-y-2">
            {dailyGoals.length === 0 ? (
              <div className="text-xs text-gray-400 py-3 text-center">No goals set yet. Click + to add your first goal!</div>
            ) : (
              dailyGoals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => handleToggleGoal(goal)}
                  className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg transition-all cursor-pointer select-none border ${
                    goal.completed ? 'bg-green-50/70 border-green-200' : 'bg-gray-50 border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      goal.completed
                        ? 'bg-green-500 border-green-500 shadow-sm'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {goal.completed && <CheckCircle2 size={13} className="text-white" />}
                  </div>
                  <span
                    className={`text-xs sm:text-sm ${
                      goal.completed ? 'text-gray-500 line-through' : 'text-gray-800 font-medium'
                    }`}
                  >
                    {goal.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Focus Hours Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Weekly Study Focus (Hours)</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution (Live from Supabase) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Project Tasks Overview</h3>
          </div>
          
          {hasTasks ? (
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="50%" height={140}>
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 pr-2">
                {taskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="text-xs">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="ml-2 font-bold text-gray-900">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400">
              No tasks assigned yet. Go to the Team tab to add your first deliverable.
            </div>
          )}
        </div>

        {/* Gamification Panel */}
        <GamificationPanel stats={userStats} />

        {/* Motivational Message */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-amber-600" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug">{motivation.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}