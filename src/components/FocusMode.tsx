import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Play, Square, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface FocusState {
  time: number;
  isActive: boolean;
  mode: 'focus' | 'break';
  lastUpdated: number;
}

const focusTime = 25 * 60;
const breakTime = 5 * 60;

export function FocusMode() {
  // Load state from localStorage or use defaults
  const [state, setState] = useState<FocusState>(() => {
    const saved = localStorage.getItem('deskflow_focus_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Calculate elapsed time if timer was active
        if (parsed.isActive) {
          const elapsed = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
          const newTime = Math.max(0, parsed.time - elapsed);
          return {
            ...parsed,
            time: newTime,
            isActive: newTime > 0, // Stop if time ran out
          };
        }
        return parsed;
      } catch {
        // Fallback to defaults if parsing fails
      }
    }
    return {
      time: focusTime,
      isActive: false,
      mode: 'focus' as const,
      lastUpdated: Date.now(),
    };
  });

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('deskflow_sessions');
    return saved ? parseInt(saved) : 0;
  });

  const [currentTask] = useState({
    title: 'Write project report',
    description: 'Finish the report and submit it by the end of the day.',
  });

  const lastSavedRef = useRef<string>('');

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateString = JSON.stringify(state);
    if (stateString !== lastSavedRef.current) {
      localStorage.setItem('deskflow_focus_state', stateString);
      lastSavedRef.current = stateString;
    }
  }, [state]);

  // Timer logic
  useEffect(() => {
    let interval: number | undefined;

    if (state.isActive && state.time > 0) {
      interval = window.setInterval(() => {
        setState((prev) => ({
          ...prev,
          time: prev.time - 1,
          lastUpdated: Date.now(),
        }));
      }, 1000);
    } else if (state.time === 0 && state.isActive) {
      if (state.mode === 'focus') {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        localStorage.setItem('deskflow_sessions', newSessions.toString());
        setState({
          mode: 'break',
          time: breakTime,
          isActive: false,
          lastUpdated: Date.now(),
        });
      } else {
        setState({
          mode: 'focus',
          time: focusTime,
          isActive: false,
          lastUpdated: Date.now(),
        });
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isActive, state.time, state.mode, sessions]);

  const startTimer = () => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      lastUpdated: Date.now(),
    }));
  };

  const stopTimer = () => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      lastUpdated: Date.now(),
    }));
  };

  const resetTimer = () => {
    setState({
      isActive: false,
      time: state.mode === 'focus' ? focusTime : breakTime,
      mode: state.mode,
      lastUpdated: Date.now(),
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1d24] rounded-tl-[32px]">
      <div className="flex-1 p-12">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-4xl text-gray-900 dark:text-white mb-12"
        >
          Focus Mode
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.2, ease: "easeOut" }}
          className="bg-[#f8f9fb] dark:bg-[#252930] rounded-2xl p-8 mb-12 border-2 border-[#e8ecf1] dark:border-[#3a3f4a] transition-colors duration-150"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-2xl text-gray-900 dark:text-white mb-3">{currentTask.title}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">{currentTask.description}</p>
            </div>
          </div>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Timer Display */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <motion.div 
              key={state.time}
              animate={state.isActive ? { scale: [1, 1.01, 1] } : {}}
              transition={{ duration: 1.5, repeat: state.isActive ? Infinity : 0, ease: "easeInOut" }}
              className="text-[120px] leading-none mb-4 text-gray-900 dark:text-white tracking-tight"
            >
              {formatTime(state.time)}
            </motion.div>
            <motion.div 
              className="text-xl text-gray-600 dark:text-gray-400"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {state.mode === 'focus' ? 'Focus Session' : 'Break Time'}
            </motion.div>
          </motion.div>

          {/* Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.2, ease: "easeOut" }}
            className="flex justify-center gap-4 mb-12"
          >
            {!state.isActive ? (
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
                <Button
                  size="lg"
                  onClick={startTimer}
                  className="w-32 h-12 rounded-xl bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white transition-all duration-150 ease-out"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
                <Button
                  size="lg"
                  onClick={stopTimer}
                  variant="destructive"
                  className="w-32 h-12 rounded-xl transition-all duration-150 ease-out"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
                className="w-32 h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-[#252930] dark:border-[#3a3f4a] transition-all duration-150 ease-out"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </motion.div>
          </motion.div>

          {/* Sessions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.25, ease: "easeOut" }}
            className="text-center"
          >
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sessions completed today</div>
            <div className="flex justify-center gap-2">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: 0.25 + i * 0.03, 
                    duration: 0.2,
                    type: "spring", 
                    stiffness: 300,
                    damping: 20
                  }}
                  className={`w-3 h-3 rounded-full transition-colors duration-150 ${
                    i < sessions ? 'bg-[#4c7ce5]' : 'bg-gray-200 dark:bg-[#3a3f4a]'
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 text-gray-600 dark:text-gray-400">{sessions} / 8 sessions</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
