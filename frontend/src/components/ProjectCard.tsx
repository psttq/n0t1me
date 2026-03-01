import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Calendar, Edit2, Trash2, Sun } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const progress = project.progress || 0;
  const remainingHours = project.remainingHours ?? Math.max(0, project.totalHours - project.spentHours);
  const daysLeft = project.daysLeft ?? null;
  const weeklyPlanned = project.weeklyPlannedHours;
  const recommendedToday = project.recommendedToday ?? 0;
  const spentToday = project.spentToday ?? 0;
  const remainingToday = project.remainingToday ?? 0;

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-success';
    if (progress >= 75) return 'bg-primary';
    if (progress >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  const formatDaysLeft = () => {
    if (daysLeft === null) return '—';
    if (daysLeft === 0) return 'Завершён';
    if (daysLeft === 1) return '1 день';
    if (daysLeft < 7) return `${daysLeft} дней`;
    const weeks = Math.ceil(daysLeft / 7);
    return `${weeks} нед.`;
  };

  // Форматирование часов в часы:минуты
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0) {
      return `${h}ч ${m}м`;
    }
    return `${m}м`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{project.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">Важность:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <div
                  key={n}
                  className={`w-2 h-2 rounded-full ${
                    n <= project.importance ? 'bg-warning' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to={`/project/${project.id}`}
            className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(project.id)}
            className="p-2 text-gray-400 hover:text-danger rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Прогресс</span>
          <span className="font-medium text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Осталось</span>
          </div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {formatHours(remainingHours)} / {formatHours(project.totalHours)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Срок</span>
          </div>
          <div className="font-semibold text-gray-900 dark:text-white">{formatDaysLeft()}</div>
        </div>
      </div>

      {/* Weekly Plan */}
      {weeklyPlanned > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
          В неделю: <span className="font-medium text-gray-700 dark:text-gray-300">{formatHours(weeklyPlanned)}</span>
        </div>
      )}

      {/* Daily Recommendation */}
      {recommendedToday > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 mb-1">
            <Sun className="w-3 h-3 text-warning" />
            <span>Сегодня:</span>
          </div>
          <div className="flex justify-between">
            <span>Рекомендуется: <span className="font-medium text-gray-700 dark:text-gray-300">{formatHours(recommendedToday)}</span></span>
            {spentToday > 0 && (
              <span>Осталось: <span className={`font-medium ${remainingToday <= 0 ? 'text-success' : 'text-gray-700 dark:text-gray-300'}`}>{formatHours(remainingToday)}</span></span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <Link
        to={`/timer?project=${project.id}`}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        <Play className="w-4 h-4" />
        Запустить таймер
      </Link>
    </div>
  );
};

export default ProjectCard;
