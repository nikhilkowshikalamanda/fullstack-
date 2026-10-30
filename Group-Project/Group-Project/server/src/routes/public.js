// Public summary endpoints used by the home page.
import { Router } from 'express';
import { readDb } from '../db.js';
import { computeStats } from '../stats.js';

const router = Router();

// GET /api/stats -> totals only, no personal data
router.get('/stats', async (req, res, next) => {
  try {
    const { issues } = await readDb();
    const { total, pending, inProgress, resolved, rejected } = computeStats(issues);
    res.json({ total, pending, inProgress, resolved, rejected });
  } catch (err) { next(err); }
});

// GET /api/announcements
router.get('/announcements', async (req, res, next) => {
  try {
    const { announcements } = await readDb();
    res.json({ items: announcements });
  } catch (err) { next(err); }
});

export default router;
