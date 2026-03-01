import { Project } from '../models/types';
/**
 * Алгоритм распределения времени между проектами
 * согласно ТЗ раздел 8
 */
export declare function calculateWeeklyPlan(): void;
/**
 * Рассчитывает количество оставшихся дней до завершения проекта
 * на основе текущего недельного планирования
 */
export declare function calculateDaysLeft(project: Project): number | null;
/**
 * Рассчитывает минимальное количество дней до завершения проекта
 * при условии что все остальные проекты завершены (вся неделя доступна этому проекту)
 */
export declare function calculateMinDaysLeft(projectId: string): number | null;
/**
 * Рассчитывает реальную дату окончания проекта с учётом последовательного
 * завершения других проектов
 */
export declare function calculateRealDaysLeft(targetProjectId: string): number | null;
/**
 * Пересчитывает план при изменении настроек
 */
export declare function recalculateOnSettingsChange(): void;
/**
 * Пересчитывает план при изменении проекта
 */
export declare function recalculateOnProjectChange(): void;
/**
 * Получает время, затраченное на проект сегодня
 */
export declare function getTodaySpentHours(projectId: string): number;
/**
 * Получает время, затраченное на проект на этой неделе (с понедельника)
 */
export declare function getWeekSpentHours(projectId: string): number;
/**
 * Рассчитывает рекомендуемое время на сегодня для каждого проекта
 * с учётом важности, доступного времени и уже затраченного сегодня
 */
export declare function calculateDailyRecommendation(): Record<string, {
    recommendedToday: number;
    spentToday: number;
    remainingToday: number;
}>;
//# sourceMappingURL=distributionService.d.ts.map