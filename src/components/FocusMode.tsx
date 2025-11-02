import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function FocusMode() {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(25 * 60);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('deskflow_sessions');
    return saved ? parseInt(saved) : 0;
  });
  const [currentTask] = useState({
    title: 'Write project report',
    description: 'Finish the report and submit it by the end of the day.',
  });

  const focusTime = 25 * 60;
  const breakTime = 5 * 60;

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && time > 0) {
      interval = window.setInterval(() => {
        setTime((time) => time - 1);
      }, 1000);
    } else if (time === 0) {
      if (mode === 'focus') {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        localStorage.setItem('deskflow_sessions', newSessions.toString());
        setMode('break');
        setTime(breakTime);
      } else {
        setMode('focus');
        setTime(focusTime);
      }
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time, mode, sessions]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTime(mode === 'focus' ? focusTime : breakTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1d24] rounded-tl-[32px]">
      <div className="flex-1 p-12">
        <h1 className="text-4xl text-gray-900 dark:text-white mb-12">Focus Mode</h1>

        <div className="bg-[#f8f9fb] dark:bg-[#252930] rounded-2xl p-8 mb-12 border-2 border-[#e8ecf1] dark:border-[#3a3f4a]">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl text-gray-900 dark:text-white mb-3">{currentTask.title}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">{currentTask.description}</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Timer Display */}
          <div className="text-center mb-12">
            <div className="text-[120px] leading-none mb-4 text-gray-900 dark:text-white tracking-tight">
              {formatTime(time)}
            </div>
            <div className="text-xl text-gray-600 dark:text-gray-400">
              {mode === 'focus' ? 'Focus Session' : 'Break Time'}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-12">
            <Button
              size="lg"
              onClick={toggleTimer}
              className="w-32 h-12 rounded-xl bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white"
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={resetTimer}
              className="w-32 h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>

          {/* Sessions */}
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sessions completed today</div>
            <div className="flex justify-center gap-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < sessions ? 'bg-[#4c7ce5]' : 'bg-gray-200 dark:bg-[#3a3f4a]'
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 text-gray-600 dark:text-gray-400">{sessions} / 8 sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
