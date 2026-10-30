// Administrator endpoints. EVERY route below requires a valid admin session (checked on the server).
import { Router } from 'express';
import { readDb, updateDb } from '../db.js';
import { HttpError } from '../errors.js';
import { requireAdmin } from '../middleware.js';
import { handleUpload, discardUpload, relativePath } from '../upload.js';
import { validateStatusUpdate, CATEGORIES, STATUSES } from '../validate.js';
import { adminIssue } from '../serializers.js';
import { computeStats } from '../stats.js';
import { logActivity } from '../activity.js';
import { searchIssues, sortIssues, paginate, str } from '../list.js';

const router = Router();
router.use(requireAdmin);

// GET /api/admin/issues?search=&status=&category=&sort=&page=&limit=
router.get('/issues', async (req, res, next) => {
  try {
    const { issues } = await readDb();
    let list = issues;
    if (CATEGORIES.includes(str(req.query.category))) list = list.filter((i) => i.category === req.query.category);
    if (STATUSES.includes(str(req.query.status))) list = list.filter((i) => i.status === req.query.status);
    list = sortIssues(searchIssues(list, req.query.search, (i) => [i.complaintId, i.reporterEmail]), str(req.query.sort));
    const page = paginate(list, req.query.page, req.query.limit, 100);
    res.json({ ...page, items: page.items.map((i) => adminIssue(i)) });
  } catch (err) { next(err); }
});

// GET /api/admin/issues/:id -> full detail including the reporter's e-mail
router.get('/issues/:id', async (req, res, next) => {
  try {
    const { issues } = await readDb();
    const issue = issues.find((i) => i.id === req.params.id);
    if (!issue) throw new HttpError(404, 'Complaint not found.');
    res.json({ issue: adminIssue(issue, true) });
  } catch (err) { next(err); }
});

// PATCH /api/admin/issues/:id/status   (multipart: status, note, optional resolutionPhoto)
router.patch('/issues/:id/status', handleUpload('resolutionPhoto'), async (req, res, next) => {
  try {
    const { errors, value } = validateStatusUpdate(req.body);
    if (req.file && value.status !== 'resolved') {
      errors.resolutionPhoto = 'A photo can only be attached when marking a complaint as resolved.';
    }
    if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', errors);

    const issue = await updateDb((data) => {
      const found = data.issues.find((i) => i.id === req.params.id);
      if (!found) throw new HttpError(404, 'Complaint not found.');
      if (found.status === value.status && !value.note && !req.file) {
        throw new HttpError(400, 'Nothing to update. Change the status or add a note.');
      }
      const now = new Date().toISOString();
      const photo = req.file ? relativePath(req.file) : null;
      const previous = found.status;
      found.status = value.status;
      found.updatedAt = now;
      found.statusHistory.push({
        status: value.status,
        note: value.note || `Status changed to ${value.status.replace('_', ' ')}.`,
        by: req.admin.username,
        at: now,
        photo,
      });
      if (['resolved', 'rejected'].includes(value.status)) {
        found.resolutionNote = value.note;
        if (photo) found.resolutionPhoto = photo;
      } else {
        found.resolutionNote = '';
        found.resolutionPhoto = null; // old photos stay in the history entries
      }
      logActivity(data, req.admin.username, 'status_update', found, `${previous} -> ${value.status}${value.note ? `: ${value.note}` : ''}`);
      return found;
    });
    res.json({ message: 'Complaint updated.', issue: adminIssue(issue, true) });
  } catch (err) {
    await discardUpload(req);
    next(err);
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const { issues } = await readDb();
    res.json({ stats: computeStats(issues) });
  } catch (err) { next(err); }
});

// GET /api/admin/activity -> latest 50 entries, newest first
router.get('/activity', async (req, res, next) => {
  try {
    const { activity = [] } = await readDb();
    res.json({ items: [...activity].reverse().slice(0, 50) });
  } catch (err) { next(err); }
});

export default router;
