"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const distributionService_1 = require("../services/distributionService");
const router = (0, express_1.Router)();
// GET /api/time-entries - получить все записи времени
router.get('/', (req, res) => {
    const { projectId, startDate, endDate } = req.query;
    let query = 'SELECT * FROM time_entries WHERE 1=1';
    const params = [];
    if (projectId) {
        query += ' AND projectId = ?';
        params.push(projectId);
    }
    if (startDate) {
        query += ' AND date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND date <= ?';
        params.push(endDate);
    }
    query += ' ORDER BY date DESC';
    const entries = database_1.db.prepare(query).all(...params);
    res.json(entries);
});
// POST /api/time-entries - создать запись о затраченном времени
router.post('/', (req, res) => {
    const { projectId, duration, notes } = req.body;
    if (!projectId || duration === undefined) {
        return res.status(400).json({ error: 'Missing required fields: projectId, duration' });
    }
    if (duration <= 0) {
        return res.status(400).json({ error: 'duration must be positive' });
    }
    // Проверяем, что проект существует
    const project = database_1.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    // Создаём запись
    database_1.db.prepare(`
    INSERT INTO time_entries (id, projectId, duration, date, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, projectId, duration, now, notes || null);
    // Обновляем spentHours проекта
    database_1.db.prepare(`
    UPDATE projects 
    SET spentHours = spentHours + ?, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(duration, projectId);
    // Проверяем, не завершился ли проект
    const updatedProject = database_1.db.prepare(`
    SELECT * FROM projects WHERE id = ?
  `).get(projectId);
    if (updatedProject.spentHours >= updatedProject.totalHours) {
        database_1.db.prepare(`
      UPDATE projects 
      SET status = 'completed', updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(projectId);
    }
    // Пересчитываем план
    (0, distributionService_1.calculateWeeklyPlan)();
    const entry = database_1.db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
    res.status(201).json(entry);
});
// DELETE /api/time-entries/:id - удалить запись времени
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const entry = database_1.db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
    if (!entry) {
        return res.status(404).json({ error: 'Time entry not found' });
    }
    // Уменьшаем spentHours проекта
    database_1.db.prepare(`
    UPDATE projects 
    SET spentHours = MAX(0, spentHours - ?), 
        status = CASE WHEN spentHours - ? >= totalHours THEN 'active' ELSE status END,
        updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(entry.duration, entry.duration, entry.projectId);
    database_1.db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);
    // Пересчитываем план
    (0, distributionService_1.calculateWeeklyPlan)();
    res.status(204).send();
});
exports.default = router;
//# sourceMappingURL=timeEntryController.js.map