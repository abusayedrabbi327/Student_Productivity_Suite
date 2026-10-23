import { useState, useEffect } from 'react';
import { Sprout, CheckCircle2, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { toast } from 'sonner@2.0.3';

interface LockedScreenProps {
  duration: number; // in minutes
  goal: string;
  onQuit: () => void;
  focusMode?: string;
}

export function LockedScreen({ duration, goal, onQuit, focusMode = 'medium' }: LockedScreenProps) {
  const { currentUser } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isCompleted, setIsCompleted] = useState(false);
  const totalSeconds = duration * 60;

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        handleSessionComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  const handleSessionComplete = async () => {
    setIsCompleted(true);
    if (currentUser) {
      await api.logFocusSession(currentUser.id, duration, goal, focusMode);
      toast.success(`Deep Focus completed! Earned +${duration * 5} points`);
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = 1 - timeRemaining / totalSeconds;
  
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const treeScale = 0.5 + progress * 0.7;

  return (
    <div className="size-full bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-between p-6 py-8 overflow-auto">
      {/* Header with title and goal */}
      <div className="w-full max-w-md text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
          <span>{focusMode.toUpperCase()} FOCUS MODE</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          {isCompleted ? 'Session Complete! 🎉' : 'Deep Focus Active'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-4 font-medium italic">"{goal}"</p>
      </div>

      {/* Countdown Timer Circle */}
      <div className="flex items-center justify-center flex-1 my-6">
        <div className="relative" style={{ width: '240px', height: '240px' }}>
          <svg width="240" height="240" className="absolute inset-0 -rotate-90">
            {/* Background circle */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            
            {/* Progress circle */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke={isCompleted ? "#10b981" : "#3b82f6"}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isCompleted ? (
              <div className="flex flex-col items-center text-center animate-bounce">
                <CheckCircle2 size={54} className="text-emerald-500 mb-1" />
                <span className="text-sm font-bold text-emerald-700">+{duration * 5} Points</span>
              </div>
            ) : (
              <>
                <div className="text-4xl sm:text-5xl font-mono font-bold text-gray-800 mb-2">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                
                <div 
                  className="text-emerald-600 transition-transform duration-500"
                  style={{ transform: `scale(${treeScale})` }}
                >
                  <Sprout size={44} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md text-center pb-4">
        {isCompleted ? (
          <button
            onClick={onQuit}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all"
          >
            Claim Rewards & Return
          </button>
        ) : (
          <button
            onClick={onQuit}
            className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
          >
            Cancel Session
          </button>
        )}
      </div>
    </div>
  );
}