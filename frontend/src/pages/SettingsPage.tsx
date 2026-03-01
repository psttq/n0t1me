import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchSettings, saveSettings } from '../store/settingsSlice';
import { fetchProjects } from '../store/projectsSlice';
import { useTheme, PRIMARY_COLORS } from '../hooks/useTheme';
import { Save, Clock, Palette } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: settings, loading } = useAppSelector((state) => state.settings);
  const { primaryColor, setPrimaryColor, theme, getPrimaryColor } = useTheme();

  // Функция для затемнения цвета
  const darkenColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };

  const [formData, setFormData] = useState({
    monday: 2,
    tuesday: 2,
    wednesday: 2,
    thursday: 2,
    friday: 2,
    saturday: 0,
    sunday: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setFormData({
        monday: settings.monday,
        tuesday: settings.tuesday,
        wednesday: settings.wednesday,
        thursday: settings.thursday,
        friday: settings.friday,
        saturday: settings.saturday,
        sunday: settings.sunday,
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, [field]: numValue }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await dispatch(saveSettings(formData)).unwrap();
      dispatch(fetchProjects()); // Refresh projects to recalculate
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Понедельник' },
    { key: 'tuesday', label: 'Вторник' },
    { key: 'wednesday', label: 'Среда' },
    { key: 'thursday', label: 'Четверг' },
    { key: 'friday', label: 'Пятница' },
    { key: 'saturday', label: 'Суббота' },
    { key: 'sunday', label: 'Воскресенье' },
  ];

  const totalWeekly = Object.entries(formData)
    .filter(([key]) => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(key))
    .reduce((sum, [, value]) => sum + (value as number), 0);

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Настройки</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Available Hours */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Доступное время по дням</h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Укажите, сколько часов в день вы готовы уделять работе над проектами
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {days.map((day) => (
              <div key={day.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {day.label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData[day.key as keyof typeof formData]}
                    onChange={(e) => handleChange(day.key, e.target.value)}
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ч.
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <span className="text-sm text-primary font-medium">
              Всего в неделю: {Math.round(totalWeekly * 10) / 10} часов
            </span>
          </div>
        </div>

        {/* Primary Color */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Цвет приложения</h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Выберите основной цвет интерфейса
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {PRIMARY_COLORS.map((color) => {
              const isSelected = primaryColor === color.value;
              const displayColor = theme === 'dark' ? darkenColor(color.value, 30) : color.value;
              return (
                <button
                  key={color.value}
                  onClick={() => {
                    setPrimaryColor(color.value);
                    setSaved(false);
                  }}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    isSelected 
                      ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: displayColor }}
                  title={color.name}
                />
              );
            })}
          </div>

          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Выбран: <span className="font-medium" style={{ color: theme === 'dark' ? darkenColor(primaryColor, 30) : primaryColor }}>
              {PRIMARY_COLORS.find(c => c.value === primaryColor)?.name || 'Голубой'}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Сохранение...' : saved ? 'Сохранено!' : 'Сохранить настройки'}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
