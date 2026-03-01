import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useRedux';
import { createProject, updateProject, fetchProjects } from '../store/projectsSlice';
import { ArrowLeft, Save } from 'lucide-react';

const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [importance, setImportance] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      // Load project data
      fetch(`http://localhost:3001/api/projects/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setName(data.name);
          setTotalHours(data.totalHours.toString());
          setImportance(data.importance);
        })
        .catch(() => {
          setError('Проект не найден');
        });
    }
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Введите название проекта');
      return;
    }

    // Округляем до 2 знаков после запятой
    const hours = Math.round(parseFloat(totalHours) * 100) / 100;
    
    if (isNaN(hours) || hours <= 0) {
      setError('Введите корректное количество часов');
      return;
    }

    if (importance < 1 || importance > 10) {
      setError('Важность должна быть от 1 до 10');
      return;
    }

    setLoading(true);

    try {
      if (isEdit && id) {
        await dispatch(updateProject({ id, data: { name, totalHours: hours, importance } })).unwrap();
      } else {
        await dispatch(createProject({ name, totalHours: hours, importance })).unwrap();
      }
      dispatch(fetchProjects());
      navigate('/');
    } catch (err) {
      setError('Ошибка при сохранении проекта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Редактировать проект' : 'Новый проект'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">{error}</div>
        )}

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название проекта
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Изучение английского языка"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          {/* Total Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Планируемое время (часов)
            </label>
            <input
              type="number"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              placeholder="Например: 40"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Можно указать дробное значение (например, 1.5)</p>
          </div>

          {/* Importance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Важность: <span className="text-primary font-bold">{importance}</span> / 10
            </label>
            <input
              type="range"
              value={importance}
              onChange={(e) => setImportance(parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Низкая</span>
              <span>Средняя</span>
              <span>Высокая</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать проект'}
        </button>
      </form>
    </div>
  );
};

export default ProjectFormPage;
