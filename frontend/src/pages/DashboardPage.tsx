import React, { useEffect, useState } from 'react';
import { getStatistics } from '../api';
import { Statistics } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Clock, Target, TrendingUp, CheckCircle } from 'lucide-react';

const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#22D3EE'];

// Функция форматирования часов в часы:минуты
const formatHours = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0) {
    return `${h}ч ${m}м`;
  }
  return `${m}м`;
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatistics()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-gray-900 dark:text-white">Не удалось загрузить статистику</div>;
  }

  const { overview, projectStats, dailyStats, distribution, weeklyStats } = stats;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Статистика</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{overview.totalProjects}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Всего проектов</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{overview.completedProjects}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Завершено</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.floor(overview.totalSpentHours)}ч {Math.round((overview.totalSpentHours % 1) * 60)}м
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Затрачено</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{overview.overallProgress.toFixed(0)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Общий прогресс</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Time by Days */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Затраты по дням</h3>
          {dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#f0f0f0'} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(2)}ч`, 'Время']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('ru')}
                  contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#fff', border: '1px solid #374151' }}
                  labelStyle={{ color: document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#111827' }}
                />
                <Bar dataKey="totalDuration" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Нет данных за последние 30 дней
            </div>
          )}
        </div>

        {/* Distribution Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Распределение времени</h3>
          {distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="spentHours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${((percent || 0)).toFixed(0)}%`}
                  labelLine={false}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}ч`} contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#fff', border: '1px solid #374151' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Нет данных о затратах
            </div>
          )}
        </div>
      </div>

      {/* Weekly Trend */}
      {weeklyStats.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Динамика по неделям</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyStats.reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#f0f0f0'} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}ч`, 'Время']} contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#fff', border: '1px solid #374151' }} />
              <Line 
                type="monotone" 
                dataKey="totalDuration" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Все проекты</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Проект</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Важность</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Затрачено</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Осталось</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Прогресс</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {projectStats.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{project.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === 'completed' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {project.status === 'completed' ? 'Завершён' : 'Активен'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{project.importance}/10</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatHours(project.spentHours)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatHours(Math.max(0, project.totalHours - project.spentHours))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (project.spentHours / project.totalHours) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {((project.spentHours / project.totalHours) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
