import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { Project, ProjectWithStats } from '../models/types';
import { calculateWeeklyPlan, calculateDailyRecommendation, getTodaySpentHours, getWeekSpentHours, calculateMinDaysLeft, calculateRealDaysLeft } from '../services/distributionService';

const router = Router();

// GET /api/projects - получить все активные проекты
router.get('/', (req: Request, res: Response) => {
  const includeCompleted = req.query.includeCompleted === 'true';
  
  let query = 'SELECT * FROM projects';
  if (!includeCompleted) {
    query += " WHERE status = 'active'";
  }
  query += ' ORDER BY createdAt DESC';

  const projects = db.prepare(query).all() as Project[];

  // Получаем рекомендации на сегодня
  const dailyRecommendations = calculateDailyRecommendation();

  // Добавляем вычисляемые поля
  const projectsWithStats: ProjectWithStats[] = projects.map(p => {
    const remainingHours = Math.max(0, p.totalHours - p.spentHours);
    // Реальный срок с учётом последовательного завершения других проектов
    const daysLeft = p.status === 'completed' ? 0 : calculateRealDaysLeft(p.id);
    // Минимальный срок (когда все остальные завершены) — для tooltip
    const minDaysLeft = p.status === 'completed' ? 0 : calculateMinDaysLeft(p.id);
    const progress = p.totalHours > 0 ? (p.spentHours / p.totalHours) * 100 : 0;

    const dailyRec = dailyRecommendations[p.id] || { recommendedToday: 0, spentToday: 0, remainingToday: 0 };

    // Рассчитываем недельные показатели
    const weekSpent = getWeekSpentHours(p.id);
    const weekPlanned = p.weeklyPlannedHours;
    const weekRemaining = Math.max(0, weekPlanned - weekSpent);
    const weekProgress = weekPlanned > 0 ? (weekSpent / weekPlanned) * 100 : 0;

    return {
      ...p,
      remainingHours,
      daysLeft,
      minDaysLeft,
      progress: Math.min(100, progress),
      recommendedToday: dailyRec.recommendedToday,
      spentToday: dailyRec.spentToday,
      remainingToday: dailyRec.remainingToday,
      weekPlanned: weekPlanned,
      weekSpent: weekSpent,
      weekRemaining: weekRemaining,
      weekProgress: Math.min(100, weekProgress)
    };
  });

  res.json(projectsWithStats);
});

// GET /api/projects/daily - получить рекомендации на сегодня
router.get('/daily', (req: Request, res: Response) => {
  const recommendations = calculateDailyRecommendation();
  res.json(recommendations);
});

// GET /api/projects/:id - получить проект по ID
router.get('/:id', (req: Request, res: Response) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Project | undefined;

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const remainingHours = Math.max(0, project.totalHours - project.spentHours);
  const daysLeft = project.status === 'completed' ? 0 : calculateRealDaysLeft(project.id);
  const progress = project.totalHours > 0 ? (project.spentHours / project.totalHours) * 100 : 0;

  res.json({
    ...project,
    remainingHours,
    daysLeft,
    progress: Math.min(100, progress)
  });
});

// POST /api/projects - создать новый проект
router.post('/', (req: Request, res: Response) => {
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

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO projects (id, name, totalHours, importance, spentHours, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 0, 'active', ?, ?)
  `).run(id, name, hours, importance, now, now);

  // Пересчитываем план
  calculateWeeklyPlan();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
  res.status(201).json(project);
});

// PUT /api/projects/:id - обновить проект
router.put('/:id', (req: Request, res: Response) => {
  const { name, totalHours, importance, spentHours, status } = req.body;
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const updates: string[] = [];
  const values: any[] = [];

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

  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  // Пересчитываем план
  calculateWeeklyPlan();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
  res.json(project);
});

// DELETE /api/projects/:id - удалить проект
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Project not found' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  db.prepare('DELETE FROM time_entries WHERE projectId = ?').run(id);

  // Пересчитываем план
  calculateWeeklyPlan();

  res.status(204).send();
});

// PATCH /api/projects/:id/complete - завершить проект
router.patch('/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Project not found' });
  }

  db.prepare(`
    UPDATE projects 
    SET status = 'completed', spentHours = totalHours, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(id);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;
  res.json(project);
});

export default router;
