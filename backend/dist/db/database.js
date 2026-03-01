"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDatabase = initDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '../../data/projects.db');
const db = new better_sqlite3_1.default(dbPath);
exports.db = db;
function initDatabase() {
    // Create projects table
    db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      totalHours REAL NOT NULL,
      importance INTEGER NOT NULL CHECK (importance >= 1 AND importance <= 10),
      spentHours REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
      weeklyPlannedHours REAL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Create time_entries table
    db.exec(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      duration REAL NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
    // Create settings table
    db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      monday REAL DEFAULT 2,
      tuesday REAL DEFAULT 2,
      wednesday REAL DEFAULT 2,
      thursday REAL DEFAULT 2,
      friday REAL DEFAULT 2,
      saturday REAL DEFAULT 0,
      sunday REAL DEFAULT 0,
      workDuration INTEGER DEFAULT 25,
      breakDuration INTEGER DEFAULT 5,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Insert default settings if not exists
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!settings) {
        db.prepare(`
      INSERT INTO settings (id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, workDuration, breakDuration)
      VALUES (1, 2, 2, 2, 2, 2, 0, 0, 25, 5)
    `).run();
    }
    console.log('Database initialized successfully');
}
//# sourceMappingURL=database.js.map