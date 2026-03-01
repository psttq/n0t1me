import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { Settings } from '../models/types';
import { recalculateOnSettingsChange } from '../services/distributionService';

const router = Router();

// GET /api/settings - получить настройки
router.get('/', (req: Request, res: Response) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as Settings;
  res.json(settings);
});

// PUT /api/settings - обновить настройки
router.put('/', (req: Request, res: Response) => {
  const {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
    workDuration,
    breakDuration
  } = req.body;

  const updates: string[] = [];
  const values: any[] = [];

  if (monday !== undefined) { updates.push('monday = ?'); values.push(monday); }
  if (tuesday !== undefined) { updates.push('tuesday = ?'); values.push(tuesday); }
  if (wednesday !== undefined) { updates.push('wednesday = ?'); values.push(wednesday); }
  if (thursday !== undefined) { updates.push('thursday = ?'); values.push(thursday); }
  if (friday !== undefined) { updates.push('friday = ?'); values.push(friday); }
  if (saturday !== undefined) { updates.push('saturday = ?'); values.push(saturday); }
  if (sunday !== undefined) { updates.push('sunday = ?'); values.push(sunday); }
  if (workDuration !== undefined) { 
    if (workDuration < 1 || workDuration > 120) {
      return res.status(400).json({ error: 'workDuration must be between 1 and 120' });
    }
    updates.push('workDuration = ?'); 
    values.push(workDuration); 
  }
  if (breakDuration !== undefined) { 
    if (breakDuration < 1 || breakDuration > 60) {
      return res.status(400).json({ error: 'breakDuration must be between 1 and 60' });
    }
    updates.push('breakDuration = ?'); 
    values.push(breakDuration); 
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');

  db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE id = 1`).run(...values);

  // Пересчитываем план после изменения настроек
  recalculateOnSettingsChange();

  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as Settings;
  res.json(settings);
});

export default router;
