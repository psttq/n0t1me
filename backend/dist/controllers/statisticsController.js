"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
// GET /api/statistics - получить статистику
router.get('/', (req, res) => {
    // Общее время по всем проектам
    const totalStats = database_1.db.prepare(`
    SELECT 
      COUNT(*) as totalProjects,
      SUM(totalHours) as totalPlannedHours,
      SUM(spentHours) as totalSpentHours,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedProjects,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeProjects
    FROM projects
  `).get();
    // Статистика по проектам
    const projectStats = database_1.db.prepare(`
    SELECT 
      id,
      name,
      totalHours,
      spentHours,
      importance,
      status,
      weeklyPlannedHours,
      (totalHours - spentHours) as remainingHours,
      CASE WHEN totalHours > 0 THEN (spentHours * 100.0 / totalHours) ELSE 0 END as progressPercent
    FROM projects
    ORDER BY spentHours DESC
  `).all();
    // Затраты по дням за последние 30 дней
    const dailyStats = database_1.db.prepare(`
    SELECT 
      DATE(date) as date,
      SUM(duration) as totalDuration,
      COUNT(*) as sessionCount
    FROM time_entries
    WHERE date >= DATE('now', '-30 days')
    GROUP BY DATE(date)
    ORDER BY date
  `).all();
    // Распределение времени между проектами
    const totalSpent = database_1.db.prepare(`SELECT SUM(spentHours) as total FROM projects WHERE spentHours > 0`).get();
    const distribution = database_1.db.prepare(`
    SELECT 
      id,
      name,
      spentHours,
      CASE WHEN ? > 0 THEN (spentHours * 100.0 / ?) ELSE 0 END as percent
    FROM projects
    WHERE spentHours > 0
    ORDER BY spentHours DESC
  `).all(totalSpent?.total || 0, totalSpent?.total || 0);
    // Недельная статистика
    const weeklyStats = database_1.db.prepare(`
    SELECT 
      strftime('%Y-%W', date) as week,
      SUM(duration) as totalDuration,
      COUNT(DISTINCT projectId) as projectsWorked
    FROM time_entries
    WHERE date >= DATE('now', '-90 days')
    GROUP BY strftime('%Y-%W', date)
    ORDER BY week DESC
    LIMIT 12
  `).all();
    // Последние активности
    const recentActivity = database_1.db.prepare(`
    SELECT 
      te.id,
      te.projectId,
      p.name as projectName,
      te.duration,
      te.date,
      te.notes
    FROM time_entries te
    JOIN projects p ON te.projectId = p.id
    ORDER BY te.date DESC
    LIMIT 10
  `).all();
    const totalSpentHours = totalStats.totalSpentHours || 0;
    const totalSpentMinutes = Math.round(totalSpentHours * 60);
    res.json({
        overview: {
            totalProjects: totalStats.totalProjects || 0,
            totalPlannedHours: totalStats.totalPlannedHours || 0,
            totalSpentHours: totalSpentHours,
            totalSpentMinutes: totalSpentMinutes,
            completedProjects: totalStats.completedProjects || 0,
            activeProjects: totalStats.activeProjects || 0,
            overallProgress: totalStats.totalPlannedHours > 0
                ? (totalSpentHours / totalStats.totalPlannedHours) * 100
                : 0
        },
        projectStats,
        dailyStats,
        distribution,
        weeklyStats,
        recentActivity
    });
});
exports.default = router;
//# sourceMappingURL=statisticsController.js.map