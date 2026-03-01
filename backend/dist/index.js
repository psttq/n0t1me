"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const projectController_1 = __importDefault(require("./controllers/projectController"));
const settingsController_1 = __importDefault(require("./controllers/settingsController"));
const timeEntryController_1 = __importDefault(require("./controllers/timeEntryController"));
const statisticsController_1 = __importDefault(require("./controllers/statisticsController"));
const database_1 = require("./db/database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize database
(0, database_1.initDatabase)();
// Routes
app.use('/api/projects', projectController_1.default);
app.use('/api/settings', settingsController_1.default);
app.use('/api/time-entries', timeEntryController_1.default);
app.use('/api/statistics', statisticsController_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map