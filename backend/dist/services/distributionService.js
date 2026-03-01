"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateWeeklyPlan = calculateWeeklyPlan;
exports.calculateDaysLeft = calculateDaysLeft;
exports.recalculateOnSettingsChange = recalculateOnSettingsChange;
exports.recalculateOnProjectChange = recalculateOnProjectChange;
exports.getTodaySpentHours = getTodaySpentHours;
exports.getWeekSpentHours = getWeekSpentHours;
exports.calculateDailyRecommendation = calculateDailyRecommendation;
const database_1 = require("../db/database");
/**
 * Алгоритм распределения времени между проектами
 * согласно ТЗ раздел 8
 */
function calculateWeeklyPlan() {
    // 1. Получаем активные проекты
    const projects = database_1.db.prepare(`
    SELECT * FROM projects WHERE status = 'active'
  `).all();
    if (projects.length === 0) {
        return;
    }
    // 2. Получаем настройки доступного времени
    const settings = database_1.db.prepare('SELECT * FROM settings WHERE id = 1').get();
    const weeklyAvailable = settings.monday +
        settings.tuesday +
        settings.wednesday +
        settings.thursday +
        settings.friday +
        settings.saturday +
        settings.sunday;
    if (weeklyAvailable <= 0) {
        return;
    }
    // 3. Вычисляем сумму весов (важность)
    const totalWeight = projects.reduce((sum, p) => sum + p.importance, 0);
    if (totalWeight <= 0) {
        return;
    }
    // 4. Предварительное распределение времени
    const projectData = projects.map(p => ({
        id: p.id,
        remaining: p.totalHours - p.spentHours,
        weight: p.importance,
        weeklyPlanned: 0
    }));
    // Итеративное перераспределение
    let pool = weeklyAvailable;
    let saturatedProjects = new Set();
    // Первичное распределение пропорционально весам
    for (const p of projectData) {
        const rawHours = (p.weight / totalWeight) * weeklyAvailable;
        if (rawHours >= p.remaining) {
            p.weeklyPlanned = p.remaining;
            saturatedProjects.add(p.id);
        }
        else {
            p.weeklyPlanned = rawHours;
        }
    }
    // Перераспределение избытка от насыщенных проектов
    let iterations = 0;
    while (saturatedProjects.size > 0 && iterations < 100) {
        iterations++;
        // Вычисляем избыток
        let excess = 0;
        for (const p of projectData) {
            if (saturatedProjects.has(p.id)) {
                const rawHours = (p.weight / totalWeight) * weeklyAvailable;
                excess += rawHours - p.remaining;
                p.weeklyPlanned = p.remaining;
            }
        }
        if (excess <= 0)
            break;
        // Перераспределяем избыток между ненасыщенными проектами
        const unsaturatedWeight = projectData
            .filter(p => !saturatedProjects.has(p.id))
            .reduce((sum, p) => sum + p.weight, 0);
        if (unsaturatedWeight <= 0)
            break;
        saturatedProjects = new Set();
        for (const p of projectData) {
            if (!saturatedProjects.has(p.id)) {
                const additionalHours = (p.weight / unsaturatedWeight) * excess;
                const newPlanned = p.weeklyPlanned + additionalHours;
                if (newPlanned >= p.remaining) {
                    p.weeklyPlanned = p.remaining;
                    saturatedProjects.add(p.id);
                }
                else {
                    p.weeklyPlanned = newPlanned;
                }
            }
        }
    }
    // 5. Сохраняем результаты
    const updateStmt = database_1.db.prepare(`
    UPDATE projects 
    SET weeklyPlannedHours = ?, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
    const transaction = database_1.db.transaction(() => {
        for (const p of projectData) {
            updateStmt.run(p.weeklyPlanned, p.id);
        }
    });
    transaction();
}
/**
 * Рассчитывает количество оставшихся дней до завершения проекта
 */
function calculateDaysLeft(project) {
    if (project.weeklyPlannedHours <= 0) {
        return null;
    }
    const remainingHours = project.totalHours - project.spentHours;
    if (remainingHours <= 0) {
        return 0;
    }
    return Math.ceil((remainingHours / project.weeklyPlannedHours) * 7);
}
/**
 * Пересчитывает план при изменении настроек
 */
function recalculateOnSettingsChange() {
    calculateWeeklyPlan();
}
/**
 * Пересчитывает план при изменении проекта
 */
function recalculateOnProjectChange() {
    calculateWeeklyPlan();
}
/**
 * Получает день недели (0 = воскресенье, 1 = понедельник, ...)
 */
function getDayOfWeek() {
    return new Date().getDay();
}
/**
 * Получает ключ настройки для текущего дня недели
 */
function getDayKey() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[getDayOfWeek()];
}
/**
 * Получает время, затраченное на проект сегодня
 */
function getTodaySpentHours(projectId) {
    const today = new Date().toISOString().split('T')[0];
    const result = database_1.db.prepare(`
    SELECT COALESCE(SUM(duration), 0) as total
    FROM time_entries
    WHERE projectId = ? AND DATE(date) = ?
  `).get(projectId, today);
    return result.total;
}
/**
 * Получает время, затраченное на проект на этой неделе (с понедельника)
 */
function getWeekSpentHours(projectId) {
    // Получаем начало недели (понедельник)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Если воскресенье, то -6, иначе день недели - 1
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toISOString();
    const result = database_1.db.prepare(`
    SELECT COALESCE(SUM(duration), 0) as total
    FROM time_entries
    WHERE projectId = ? AND date >= ?
  `).get(projectId, mondayStr);
    return result.total;
}
/**
 * Рассчитывает рекомендуемое время на сегодня для каждого проекта
 * с учётом важности, доступного времени и уже затраченного сегодня
 */
function calculateDailyRecommendation() {
    const projects = database_1.db.prepare(`
    SELECT * FROM projects WHERE status = 'active'
  `).all();
    if (projects.length === 0) {
        return {};
    }
    const settings = database_1.db.prepare('SELECT * FROM settings WHERE id = 1').get();
    const todayKey = getDayKey();
    const todayAvailable = settings[todayKey] || 0;
    if (todayAvailable <= 0) {
        return {};
    }
    // Сумма весов всех активных проектов
    const totalWeight = projects.reduce((sum, p) => sum + p.importance, 0);
    if (totalWeight <= 0) {
        return {};
    }
    const recommendations = {};
    for (const project of projects) {
        const spentToday = getTodaySpentHours(project.id);
        // Доля проекта от дневного времени пропорционально важности
        const share = project.importance / totalWeight;
        const recommendedToday = share * todayAvailable;
        // Оставшееся рекомендуемое время на сегодня
        const remainingToday = Math.max(0, recommendedToday - spentToday);
        recommendations[project.id] = {
            recommendedToday: Math.round(recommendedToday * 100) / 100,
            spentToday: Math.round(spentToday * 100) / 100,
            remainingToday: Math.round(remainingToday * 100) / 100
        };
    }
    return recommendations;
}
//# sourceMappingURL=distributionService.js.map