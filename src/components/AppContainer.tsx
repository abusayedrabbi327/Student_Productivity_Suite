import { useState } from 'react';
import { RoleSelectionView } from './RoleSelectionView';
import { DashboardView } from './DashboardView';
import { DeepFocusView } from './DeepFocusView';
import { AccountabilityView } from './AccountabilityView';
import { DeadlinePlannerView } from './DeadlinePlannerView';
import { TeacherView } from './TeacherView';
import { FindGroupView } from './FindGroupView';
import { UserProfileView } from './UserProfileView';
import { Toaster } from './ui/sonner';
import { useAuth } from '../context/AuthContext';
import { Home, Timer, Users, Calendar, GraduationCap, Search, User, BarChart3, LogOut, Flame } from 'lucide-react';

type StudentFeature = 'dashboard' | 'focus' | 'team' | 'planner' | 'find' | 'profile';
type TeacherFeature = 'monitor' | 'profile';

export function AppContainer() {
  const { currentUser, userRole, logout } = useAuth();
  const [currentStudentFeature, setCurrentStudentFeature] = useState<StudentFeature>('dashboard');
  const [currentTeacherFeature, setCurrentTeacherFeature] = useState<TeacherFeature>('monitor');

  // Show role selection if not logged in
  if (!currentUser || !userRole) {
    return (
      <div className="size-full">
        <Toaster />
        <RoleSelectionView />
      </div>
    );
  }

  // Student View
  if (userRole === 'student') {
    return (
      <div className="size-full flex flex-col bg-gradient-to-b from-blue-50/50 to-white">
        <Toaster />
        
        {/* Student Navigation */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/70 shadow-sm sticky top-0 z-40">
          <div className="flex flex-col gap-2 px-3 sm:px-4 py-2 sm:py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-bold text-xs sm:text-sm">
                  {currentUser.full_name?.charAt(0) || 'S'}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                    {currentUser.full_name}
                  </h1>
                  <span className="text-[10px] text-gray-500">
                    UIU Student • Level {currentUser.level || 1}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg border border-amber-200 text-amber-700 text-xs font-semibold">
                  <Flame size={13} className="text-amber-500" />
                  <span>{currentUser.streak || 0}d</span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>

            <div className="flex gap-1 sm:gap-1.5 justify-start overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setCurrentStudentFeature('dashboard')}
                className={`
                  flex flex-col sm:flex-row items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[56px] sm:min-w-0 whitespace-nowrap
                  ${currentStudentFeature === 'dashboard'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Home size={15} />
                <span className="text-[10px] sm:text-xs">Home</span>
              </button>
              <button
                onClick={() => setCurrentStudentFeature('focus')}
                className={`
                  flex flex-col sm:flex-row items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[56px] sm:min-w-0 whitespace-nowrap
                  ${currentStudentFeature === 'focus'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Timer size={15} />
                <span className="text-[10px] sm:text-xs">Focus</span>
              </button>
              <button
                onClick={() => setCurrentStudentFeature('team')}
                className={`
                  flex flex-col sm:flex-row items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[56px] sm:min-w-0 whitespace-nowrap
                  ${currentStudentFeature === 'team'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Users size={15} />
                <span className="text-[10px] sm:text-xs">Team</span>
              </button>
              <button
                onClick={() => setCurrentStudentFeature('planner')}
                className={`
                  flex flex-col sm:flex-row items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[56px] sm:min-w-0 whitespace-nowrap
                  ${currentStudentFeature === 'planner'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Calendar size={15} />
                <span className="text-[10px] sm:text-xs">Planner</span>
              </button>
              <button
                onClick={() => setCurrentStudentFeature('find')}
                className={`
                  flex flex-col sm:flex-row items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[56px] sm:min-w-0 whitespace-nowrap
                  ${currentStudentFeature === 'find'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Search size={15} />
                <span className="text-[10px] sm:text-xs">Find</span>
              </button>
              <button
                onClick={() => setCurrentStudentFeature('profile')}
                className={`
                  flex flex-col sm:flex-row items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[56px] sm:min-w-0 whitespace-nowrap
                  ${currentStudentFeature === 'profile'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <User size={15} />
                <span className="text-[10px] sm:text-xs">Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Student Feature Views */}
        <div className="flex-1 overflow-hidden">
          {currentStudentFeature === 'dashboard' && <DashboardView />}
          {currentStudentFeature === 'focus' && <DeepFocusView />}
          {currentStudentFeature === 'team' && <AccountabilityView />}
          {currentStudentFeature === 'planner' && <DeadlinePlannerView />}
          {currentStudentFeature === 'find' && <FindGroupView />}
          {currentStudentFeature === 'profile' && <UserProfileView userRole="student" />}
        </div>
      </div>
    );
  }

  // Teacher View
  return (
    <div className="size-full flex flex-col bg-gradient-to-b from-green-50/50 to-white">
      <Toaster />
      
      {/* Teacher Navigation */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/70 shadow-sm sticky top-0 z-40">
        <div className="flex flex-col gap-2 px-3 sm:px-4 py-2 sm:py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <GraduationCap size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                  {currentUser.full_name}
                </h1>
                <span className="text-[10px] text-gray-500">
                  UIU Faculty Supervisor • {currentUser.department}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
          <div className="flex gap-1.5 sm:gap-2 justify-start">
            <button
              onClick={() => setCurrentTeacherFeature('monitor')}
              className={`
                flex flex-col sm:flex-row items-center justify-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[80px] sm:min-w-0
                ${currentTeacherFeature === 'monitor'
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <BarChart3 size={15} />
              <span className="text-[10px] sm:text-xs">Monitor Groups</span>
            </button>
            <button
              onClick={() => setCurrentTeacherFeature('profile')}
              className={`
                flex flex-col sm:flex-row items-center justify-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[80px] sm:min-w-0
                ${currentTeacherFeature === 'profile'
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <User size={15} />
              <span className="text-[10px] sm:text-xs">Faculty Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Feature Views */}
      <div className="flex-1 overflow-hidden">
        {currentTeacherFeature === 'monitor' && <TeacherView />}
        {currentTeacherFeature === 'profile' && <UserProfileView userRole="teacher" />}
      </div>
    </div>
  );
}