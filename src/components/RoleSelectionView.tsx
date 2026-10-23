import { useState } from 'react';
import { GraduationCap, BookOpen, Users, LogIn, UserPlus, Mail, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner@2.0.3';

interface RoleSelectionViewProps {
  onSelectRole?: (role: 'student' | 'teacher') => void;
}

export function RoleSelectionView({ onSelectRole }: RoleSelectionViewProps) {
  const { loginAsRole, loginWithPassword, registerWithPassword, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'quick' | 'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [showPassword, setShowPassword] = useState(false);

  const handleQuickRole = async (selectedRole: 'student' | 'teacher') => {
    try {
      await loginAsRole(selectedRole);
      if (onSelectRole) onSelectRole(selectedRole);
      toast.success(`Authenticated as ${selectedRole === 'teacher' ? 'Faculty (Dr. Sarah Ahmed)' : 'Student'}`);
    } catch (e: any) {
      toast.error('Failed to log in: ' + e.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both your UIU email and password');
      return;
    }
    const res = await loginWithPassword(email, password);
    if (res.success) {
      toast.success('Successfully authenticated! Welcome back.');
    } else {
      toast.error(res.error || 'Invalid email or password.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const res = await registerWithPassword({
      email,
      password,
      full_name: fullName,
      role,
      department,
    });

    if (res.success) {
      toast.success(`Account registered and authenticated securely! Welcome, ${fullName}!`);
    } else {
      toast.error(res.error || 'Registration failed');
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-start p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-2xl w-full my-auto py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl mb-3 shadow-md border border-blue-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow">
              <BookOpen size={26} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Student Productivity Suite
          </h1>
          <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full shadow-sm border border-gray-200 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-gray-700">
              United International University • Supabase Authenticated
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            Combating academic procrastination and empowering peer accountability
          </p>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 inline-flex gap-1">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              style={authMode === 'login' ? { backgroundColor: '#2563eb', color: '#ffffff' } : { color: '#1f2937', backgroundColor: 'transparent' }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'login' ? 'shadow-md' : 'hover:bg-gray-100'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              style={authMode === 'register' ? { backgroundColor: '#2563eb', color: '#ffffff' } : { color: '#1f2937', backgroundColor: 'transparent' }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'register' ? 'shadow-md' : 'hover:bg-gray-100'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('quick')}
              style={authMode === 'quick' ? { backgroundColor: '#2563eb', color: '#ffffff' } : { color: '#1f2937', backgroundColor: 'transparent' }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'quick' ? 'shadow-md' : 'hover:bg-gray-100'
              }`}
            >
              Quick Demo
            </button>
          </div>
        </div>

        {/* 1. SIGN IN FORM WITH SECURE PASSWORD */}
        {authMode === 'login' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sign In to Your Account</h2>
              <p className="text-xs text-gray-500 mt-1">Authenticate with your UIU email and secret password</p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">UIU Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@uiu.ac.bd or trahman@uiu.ac.bd"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">Account Password</label>
                  <span className="text-[11px] text-gray-400">Demo pwd: Password123!</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your secret password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Explicit, high-visibility SIGN IN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <LogIn size={18} />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </form>

            {/* Switch to Sign Up */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center flex flex-col gap-2.5">
              <p className="text-xs text-gray-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer"
                >
                  Sign Up here
                </button>
              </p>

              <button
                type="button"
                onClick={() => setAuthMode('quick')}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Or use 1-click Quick Demo Access
              </button>
            </div>
          </div>
        )}

        {/* 2. SIGN UP FORM WITH SECURE PASSWORD */}
        {authMode === 'register' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 max-w-lg mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create UIU Account</h2>
              <p className="text-xs text-gray-500 mt-1">Set your password to protect your account</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tahmid Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">UIU Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. trahman@bscse.uiu.ac.bd"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Create Secret Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Select Your Role</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      role === 'student'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users size={15} />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      role === 'teacher'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <GraduationCap size={15} />
                    <span>Faculty Member</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                />
              </div>

              {/* Explicit, high-visibility SIGN UP BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <UserPlus size={18} />
                <span>{loading ? 'Securing Account...' : 'Sign Up & Protect Account'}</span>
              </button>
            </form>

            {/* Switch to Sign In */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center flex flex-col gap-2.5">
              <p className="text-xs text-gray-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer"
                >
                  Sign In here
                </button>
              </p>

              <button
                type="button"
                onClick={() => setAuthMode('quick')}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Or use 1-click Quick Demo Access
              </button>
            </div>
          </div>
        )}

        {/* 3. QUICK DEMO CARDS */}
        {authMode === 'quick' && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Student Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-200 hover:border-blue-400 transition-all flex flex-col justify-between text-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md mx-auto mb-3">
                  <Users size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Student Portal</h3>
                <span className="text-xs text-blue-600 font-semibold block mb-1">student@uiu.ac.bd</span>
                <span className="text-[11px] text-gray-400 block mb-3">Password: Password123!</span>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Focus timers, team Kanban board, study streaks, and project matchmaking.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleQuickRole('student')}
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Continue as Student</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Teacher Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all flex flex-col justify-between text-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md mx-auto mb-3">
                  <GraduationCap size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Faculty Portal</h3>
                <span className="text-xs text-emerald-600 font-semibold block mb-1">sarah.ahmed@uiu.ac.bd</span>
                <span className="text-[11px] text-gray-400 block mb-3">Password: Password123!</span>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Monitor group progress, evaluate member contribution scores, and give feedback.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleQuickRole('teacher')}
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Continue as Faculty</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            UIU Human-Computer Interaction Capstone Project • Secured by Supabase
          </p>
        </div>
      </div>
    </div>
  );
}