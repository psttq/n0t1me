"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const distributionService_1 = require("../services/distributionService");
const router = (0, express_1.Router)();
// GET /api/settings - получить настройки
router.get('/', (req, res) => {
    const settings = database_1.db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(settings);
});
// PUT /api/settings - обновить настройки
router.put('/', (req, res) => {
    const { monday, tuesday, wednesday, thursday, friday, saturday, sunday, workDuration, breakDuration } = req.body;
    const updates = [];
    const values = [];
    if (monday !== undefined) {
        updates.push('monday = ?');
        values.push(monday);
    }
    if (tuesday !== undefined) {
        updates.push('tuesday = ?');
        values.push(tuesday);
    }
    if (wednesday !== undefined) {
        updates.push('wednesday = ?');
        values.push(wednesday);
    }
    if (thursday !== undefined) {
        updates.push('thursday = ?');
        values.push(thursday);
    }
    if (friday !== undefined) {
        updates.push('friday = ?');
        values.push(friday);
    }
    if (saturday !== undefined) {
        updates.push('saturday = ?');
        values.push(saturday);
    }
    if (sunday !== undefined) {
        updates.push('sunday = ?');
        values.push(sunday);
    }
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
    database_1.db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE id = 1`).run(...values);
    // Пересчитываем план после изменения настроек
    (0, distributionService_1.recalculateOnSettingsChange)();
    const settings = database_1.db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(settings);
});
exports.default = router;
//# sourceMappingURL=settingsController.js.map