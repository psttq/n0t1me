import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import projectRouter from './controllers/projectController';
import settingsRouter from './controllers/settingsController';
import timeEntryRouter from './controllers/timeEntryController';
import statisticsRouter from './controllers/statisticsController';
import { initDatabase } from './db/database';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/projects', projectRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/time-entries', timeEntryRouter);
app.use('/api/statistics', statisticsRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
