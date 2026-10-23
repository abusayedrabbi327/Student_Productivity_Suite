import { useState } from 'react';
import { SetupScreen } from './SetupScreen';
import { LockedScreen } from './LockedScreen';

type Screen = 'setup' | 'locked';

interface SessionConfig {
  duration: number;
  goal: string;
  blockNotifications: boolean;
  whiteNoise: boolean;
  focusMode: 'soft' | 'medium' | 'hard';
  blockedApps: string[];
}

export function DeepFocusView() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('setup');
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

  const handleStartSession = (
    duration: number,
    goal: string,
    blockNotifications: boolean,
    whiteNoise: boolean,
    focusMode: 'soft' | 'medium' | 'hard',
    blockedApps: string[]
  ) => {
    setSessionConfig({ duration, goal, blockNotifications, whiteNoise, focusMode, blockedApps });
    setCurrentScreen('locked');
  };

  const handleQuit = () => {
    setCurrentScreen('setup');
    setSessionConfig(null);
  };

  return (
    <div className="size-full">
      {currentScreen === 'setup' && (
        <SetupScreen onStart={handleStartSession} />
      )}
      {currentScreen === 'locked' && sessionConfig && (
        <LockedScreen
          duration={sessionConfig.duration}
          goal={sessionConfig.goal}
          focusMode={sessionConfig.focusMode}
          onQuit={handleQuit}
        />
      )}
    </div>
  );
}