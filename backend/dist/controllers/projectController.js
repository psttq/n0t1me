"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const distributionService_1 = require("../services/distributionService");
const router = (0, express_1.Router)();
// GET /api/projects - получить все активные проекты
router.get('/', (req, res) => {
    const includeCompleted = req.query.includeCompleted === 'true';
    let query = 'SELECT * FROM projects';
    if (!includeCompleted) {
        query += " WHERE status = 'active'";
    }
    query += ' ORDER BY createdAt DESC';
    const projects = database_1.db.prepare(query).all();
    // Получаем рекомендации на сегодня
    const dailyRecommendations = (0, distributionService_1.calculateDailyRecommendation)();
    // Добавляем вычисляемые поля
    const projectsWithStats = projects.map(p => {
        const remainingHours = Math.max(0, p.totalHours - p.spentHours);
        const daysLeft = p.status === 'completed' ? 0 : (0, distributionService_1.calculateDaysLeft)(p);
        const progress = p.totalHours > 0 ? (p.spentHours / p.totalHours) * 100 : 0;
        const dailyRec = dailyRecommendations[p.id] || { recommendedToday: 0, spentToday: 0, remainingToday: 0 };
        return {
            ...p,
            remainingHours,
            daysLeft,
            progress: Math.min(100, progress),
            recommendedToday: dailyRec.recommendedToday,
            spentToday: dailyRec.spentToday,
            remainingToday: dailyRec.remainingToday
        };
    });
    res.json(projectsWithStats);
});
// GET /api/projects/daily - получить рекомендации на сегодня
router.get('/daily', (req, res) => {
    const recommendations = (0, distributionService_1.calculateDailyRecommendation)();
    res.json(recommendations);
});
// GET /api/projects/:id - получить проект по ID
router.get('/:id', (req, res) => {
    const project = database_1.db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    const remainingHours = Math.max(0, project.totalHours - project.spentHours);
    const daysLeft = project.status === 'completed' ? 0 : (0, distributionService_1.calculateDaysLeft)(project);
    const progress = project.totalHours > 0 ? (project.spentHours / project.totalHours) * 100 : 0;
    res.json({
        ...project,
        remainingHours,
        daysLeft,
        progress: Math.min(100, progress)
    });
});
// POST /api/projects - создать новый проект
router.post('/', (req, res) => {
    const { name, totalHours, importance } = req.body;
    if (!name || totalHours === undefined || importance === undefined) {
        return res.status(400).json({ error: 'Missing required fields: name, totalHours, importance' });
    }
    // Округляем до 2 знаков после запятой
    const hours = Math.round(totalHours * 100) / 100;
    if (hours <= 0) {
        return res.status(400).json({ error: 'totalHours must be positive' });
    }
    if (importance < 1 || importance > 10) {
        return res.status(400).json({ error: 'importance must be between 1 and 10' });
    }
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    database_1.db.prepare(`
    INSERT INTO projects (id, name, totalHours, importance, spentHours, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 0, 'active', ?, ?)
  `).run(id, name, hours, importance, now, now);
    // Пересчитываем план
    (0, distributionService_1.calculateWeeklyPlan)();
    const project = database_1.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(project);
});
// PUT /api/projects/:id - обновить проект
router.put('/:id', (req, res) => {
    const { name, totalHours, importance, spentHours, status } = req.body;
    const { id } = req.params;
    const existing = database_1.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Project not found' });
    }
    const updates = [];
    const values = [];
    if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
    }
    if (totalHours !== undefined) {
        if (totalHours <= 0) {
            return res.status(400).json({ error: 'totalHours must be positive' });
        }
        updates.push('totalHours = ?');
        values.push(Math.round(totalHours * 100) / 100);
    }
    if (importance !== undefined) {
        if (importance < 1 || importance > 10) {
            return res.status(400).json({ error: 'importance must be between 1 and 10' });
        }
        updates.push('importance = ?');
        values.push(importance);
    }
    if (spentHours !== undefined) {
        updates.push('spentHours = ?');
        values.push(spentHours);
    }
    if (status !== undefined) {
        if (!['active', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        updates.push('status = ?');
        values.push(status);
    }
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);
    database_1.db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    // Пересчитываем план
    (0, distributionService_1.calculateWeeklyPlan)();
    const project = database_1.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(project);
});
// DELETE /api/projects/:id - удалить проект
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const existing = database_1.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Project not found' });
    }
    database_1.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    database_1.db.prepare('DELETE FROM time_entries WHERE projectId = ?').run(id);
    // Пересчитываем план
    (0, distributionService_1.calculateWeeklyPlan)();
    res.status(204).send();
});
// PATCH /api/projects/:id/complete - завершить проект
router.patch('/:id/complete', (req, res) => {
    const { id } = req.params;
    const existing = database_1.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Project not found' });
    }
    database_1.db.prepare(`
    UPDATE projects 
    SET status = 'completed', spentHours = totalHours, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(id);
    const project = database_1.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(project);
});
exports.default = router;
//# sourceMappingURL=projectController.js.map