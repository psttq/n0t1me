import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchProjects } from '../store/projectsSlice';
import { setTimerRunning } from '../store/timerSlice';
import { Play, Pause, RotateCcw, Clock, Calendar } from 'lucide-react';

const TimerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: projects } = useAppSelector((state) => state.projects);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Sync timer state with global store for background animation
  useEffect(() => {
    dispatch(setTimerRunning(isRunning));
  }, [isRunning, dispatch]);

  const intervalRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  // Load projects
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Set initial project from URL
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [searchParams]);

  const activeProjects = projects.filter((p) => p.status === 'active');

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  
  // Рекомендуемое время на сегодня для выбранного проекта (в часах)
  const recommendedTodayHours = selectedProject?.recommendedToday ?? 0;
  // Конвертируем в секунды (или минимум 15 минут если есть рекомендация)
  const targetSeconds = recommendedTodayHours > 0 
    ? Math.max(recommendedTodayHours * 3600, 15 * 60) 
    : 25 * 60; // По умолчанию 25 минут если нет рекомендации
    
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  // Timer logic - каждая секунда фиксируется
  const startTimer = useCallback(() => {
    if (!isRunning && selectedProjectId) {
      setIsRunning(true);
      sessionStartRef.current = Date.now();
      
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          const newElapsed = prev + 1;
          
          // Каждую секунду отправляем данные на сервер
          if (selectedProjectId && sessionStartRef.current) {
            const elapsedHours = 1 / 3600; // 1 секунда в часах
            
            fetch('http://localhost:3001/api/time-entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: selectedProjectId,
                duration: elapsedHours,
              }),
            }).then(() => {
              dispatch(fetchProjects());
            }).catch(console.error);
          }
          
          return newElapsed;
        });
      }, 1000);
    }
  }, [isRunning, selectedProjectId, dispatch]);

  const pauseTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      sessionStartRef.current = null;
    }
  }, [isRunning]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    sessionStartRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Функция форматирования часов в часы:минуты
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0) {
      return `${h}ч ${m}м`;
    }
    return `${m}м`;
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatRemaining = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${seconds}с`;
    }
    if (minutes > 0) {
      return `${minutes}м ${seconds}с`;
    }
    return `${seconds}с`;
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    resetTimer();
  };

  // Calculate progress
  const progress = targetSeconds > 0 ? (elapsedSeconds / targetSeconds) * 100 : 0;

  const remainingProjectHours = selectedProject 
    ? Math.max(0, (selectedProject.remainingHours ?? (selectedProject.totalHours - selectedProject.spentHours)))
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Секундомер</h1>

      {/* Project Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Выберите проект</label>
        <select
          value={selectedProjectId}
          onChange={handleProjectChange}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Выберите проект...</option>
          {activeProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({formatHours(project.remainingHours ?? (project.totalHours - project.spentHours))} осталось)
            </option>
          ))}
        </select>
      </div>

      {/* Timer Display */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center transition-all duration-500 ${isRunning ? 'shadow-lg shadow-primary/20 scale-[1.02]' : ''}`}>
        {/* Project Info */}
        {selectedProject && (
          <div className="mb-6">
            <div className="text-lg font-medium text-gray-900 dark:text-white">{selectedProject.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Осталось в проекте: {formatHours(remainingProjectHours)}
            </div>
          </div>
        )}

        {/* Stopwatch - elapsed time */}
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Прошло времени
          </div>
          <div className="text-6xl font-bold text-gray-900 dark:text-white font-mono">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Progress Circle */}
        <div className={`relative w-48 h-48 mx-auto mb-6 ${isRunning ? 'animate-pulse-slow' : ''}`}>
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-100 dark:text-gray-700"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * Math.max(0, 1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 0.3s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Clock className="w-8 h-8 text-primary mb-1" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {progress.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Рекомендуемый сеанс на сегодня
          </div>
          <div className={`text-xl font-semibold ${remainingSeconds <= 60 ? 'text-warning' : 'text-gray-900 dark:text-white'}`}>
            Осталось: {formatRemaining(remainingSeconds)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {recommendedTodayHours > 0 
              ? `Рекомендовано сегодня: ${formatHours(recommendedTodayHours)}`
              : 'Нет рекомендации на сегодня'
            }
          </div>
        </div>

        {/* Weekly Plan */}
        {selectedProject && selectedProject.weeklyPlannedHours > 0 && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Эта неделя
              </span>
            </div>
            <div className="flex justify-between items-start mb-2">
              <div className='text-left'>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatHours(selectedProject.weekRemaining ?? Math.max(0, selectedProject.weeklyPlannedHours - (selectedProject.weekSpent ?? 0)))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  осталось из {formatHours(selectedProject.weeklyPlannedHours)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.min(100, selectedProject.weekProgress ?? 0).toFixed(0)}%
                </div>
              </div>
            </div>
            {/* Weekly Progress Bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, selectedProject.weekProgress ?? 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={!selectedProjectId}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6" />
              Старт
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium text-lg"
            >
              <Pause className="w-6 h-6" />
              Пауза
            </button>
          )}

          <button
            onClick={resetTimer}
            className="flex items-center gap-2 px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-lg"
          >
            <RotateCcw className="w-5 h-5" />
            Сброс
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          За сессию: <span className="font-medium text-gray-900 dark:text-white">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Quick Project Links */}
      {activeProjects.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Быстрый выбор</h3>
          <div className="flex flex-wrap gap-2">
            {activeProjects.slice(0, 5).map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  resetTimer();
                }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedProjectId === project.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerPage;
