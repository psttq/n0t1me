import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { TimeEntry } from '../models/types';
import { calculateWeeklyPlan } from '../services/distributionService';

const router = Router();

// GET /api/time-entries - получить все записи времени
router.get('/', (req: Request, res: Response) => {
  const { projectId, startDate, endDate } = req.query;

  let query = 'SELECT * FROM time_entries WHERE 1=1';
  const params: any[] = [];

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

  const entries = db.prepare(query).all(...params) as TimeEntry[];
  res.json(entries);
});

// POST /api/time-entries - создать запись о затраченном времени
router.post('/', (req: Request, res: Response) => {
  const { projectId, duration, notes } = req.body;

  if (!projectId || duration === undefined) {
    return res.status(400).json({ error: 'Missing required fields: projectId, duration' });
  }

  if (duration <= 0) {
    return res.status(400).json({ error: 'duration must be positive' });
  }

  // Проверяем, что проект существует
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  // Создаём запись
  db.prepare(`
    INSERT INTO time_entries (id, projectId, duration, date, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, projectId, duration, now, notes || null);

  // Обновляем spentHours проекта
  db.prepare(`
    UPDATE projects 
    SET spentHours = spentHours + ?, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(duration, projectId);

  // Проверяем, не завершился ли проект
  const updatedProject = db.prepare(`
    SELECT * FROM projects WHERE id = ?
  `).get(projectId) as any;

  if (updatedProject.spentHours >= updatedProject.totalHours) {
    db.prepare(`
      UPDATE projects 
      SET status = 'completed', updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(projectId);
  }

  // Пересчитываем план
  calculateWeeklyPlan();

  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id) as TimeEntry;
  res.status(201).json(entry);
});

// DELETE /api/time-entries/:id - удалить запись времени
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id) as TimeEntry | undefined;
  if (!entry) {
    return res.status(404).json({ error: 'Time entry not found' });
  }

  // Уменьшаем spentHours проекта
  db.prepare(`
    UPDATE projects 
    SET spentHours = MAX(0, spentHours - ?), 
        status = CASE WHEN spentHours - ? >= totalHours THEN 'active' ELSE status END,
        updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(entry.duration, entry.duration, entry.projectId);

  db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);

  // Пересчитываем план
  calculateWeeklyPlan();

  res.status(204).send();
});

export default router;
