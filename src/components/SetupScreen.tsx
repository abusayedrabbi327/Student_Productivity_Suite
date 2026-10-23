import { useState } from 'react';
import { CircularDial } from './CircularDial';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface SetupScreenProps {
  onStart: (
    duration: number,
    goal: string,
    blockNotifications: boolean,
    whiteNoise: boolean,
    focusMode: 'soft' | 'medium' | 'hard',
    blockedApps: string[]
  ) => void;
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [duration, setDuration] = useState(25);
  const [goal, setGoal] = useState('');
  const [blockNotifications, setBlockNotifications] = useState(true);
  const [whiteNoise, setWhiteNoise] = useState(false);
  const [focusMode, setFocusMode] = useState<'soft' | 'medium' | 'hard'>('medium');
  
  // Predefined blocked apps based on mode
  const appsByMode = {
    soft: ['Social Media'],
    medium: ['Social Media', 'Games', 'Shopping'],
    hard: ['Social Media', 'Games', 'Shopping', 'Messaging', 'Entertainment'],
  };

  const handleStart = () => {
    if (goal.trim()) {
      onStart(duration, goal.trim(), blockNotifications, whiteNoise, focusMode, appsByMode[focusMode]);
    }
  };

  const focusModes = [
    {
      id: 'soft' as const,
      name: 'Soft',
      icon: Shield,
      description: 'Block social media',
      color: 'from-green-400 to-green-600',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50',
    },
    {
      id: 'medium' as const,
      name: 'Medium',
      icon: ShieldCheck,
      description: 'Block distractions',
      color: 'from-yellow-400 to-orange-500',
      borderColor: 'border-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'hard' as const,
      name: 'Hard',
      icon: ShieldAlert,
      description: 'Maximum focus',
      color: 'from-red-400 to-red-600',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="size-full bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-start p-4 overflow-auto">
      <div className="w-full max-w-md space-y-5 py-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl text-gray-800">New Session</h1>
        </div>

        {/* Circular Dial */}
        <div className="py-4">
          <CircularDial value={duration} onChange={setDuration} />
        </div>

        {/* Goal Input */}
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="What is your main goal?"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="text-center bg-white border-gray-300 py-5 text-sm sm:text-base shadow-sm"
          />
        </div>

        {/* Focus Mode Selection */}
        <div className="space-y-2.5">
          <label className="text-sm font-medium text-gray-700 block px-1">Focus Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {focusModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setFocusMode(mode.id)}
                className={`
                  relative p-3 rounded-xl transition-all duration-200
                  ${focusMode === mode.id
                    ? `${mode.bgColor} border-2 ${mode.borderColor} shadow-md`
                    : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${mode.color} 
                  flex items-center justify-center mb-2
                `}>
                  <mode.icon size={20} className="text-white" />
                </div>
                <div className="text-xs font-semibold text-gray-900">{mode.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{mode.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Blocked Apps Display */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-700 mb-2">Blocked Apps:</div>
          <div className="flex flex-wrap gap-1.5">
            {appsByMode[focusMode].map((app) => (
              <span
                key={app}
                className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
              >
                {app}
              </span>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="block-notifications" className="text-sm text-gray-700 cursor-pointer font-medium">
              Block Notifications
            </label>
            <Switch
              id="block-notifications"
              checked={blockNotifications}
              onCheckedChange={setBlockNotifications}
            />
          </div>
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="white-noise" className="text-sm text-gray-700 cursor-pointer font-medium">
              White Noise
            </label>
            <Switch
              id="white-noise"
              checked={whiteNoise}
              onCheckedChange={setWhiteNoise}
            />
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <Button
            onClick={handleStart}
            disabled={!goal.trim()}
            className="w-full py-6 text-base sm:text-lg rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
          >
            Start Focus Session
          </Button>
        </div>
      </div>
    </div>
  );
}
