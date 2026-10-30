// Public issue endpoints (citizens). Reporter e-mails and complaint IDs are never listed publicly.
import { Router } from 'express';
import crypto from 'node:crypto';
import { readDb, updateDb } from '../db.js';
import { HttpError } from '../errors.js';
import { handleUpload, discardUpload, relativePath } from '../upload.js';
import { submitLimiter, trackLimiter, flagLimiter } from '../middleware.js';
import { validateNewIssue, validateFlag, cleanEmail, CATEGORIES, STATUSES, COMPLAINT_ID_PATTERN } from '../validate.js';
import { findSimilar } from '../similar.js';
import { publicIssue, trackedIssue } from '../serializers.js';
import { searchIssues, sortIssues, paginate, str } from '../list.js';

const router = Router();

const sha = (s) => crypto.createHash('sha256').update(s).digest();
const sameEmail = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const NOT_MATCHED = 'No complaint matches that ID and email. Check both and try again.';

// Complaint ID looks like CF-20261023-K7P4X (letters/digits that are easy to read out loud).
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newComplaintId(issues) {
  const used = new Set(issues.map((i) => i.complaintId));
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let id;
  do {
    id = `CF-${day}-${Array.from({ length: 5 }, () => ID_CHARS[crypto.randomInt(ID_CHARS.length)]).join('')}`;
  } while (used.has(id));
  return id;
}

// GET /api/issues?search=&category=&status=&sort=&page=&limit=   (rejected reports are hidden from the public)
router.get('/', async (req, res, next) => {
  try {
    const { issues } = await readDb();
    let list = issues.filter((i) => i.status !== 'rejected');
    if (CATEGORIES.includes(str(req.query.category))) list = list.filter((i) => i.category === req.query.category);
    if (STATUSES.includes(str(req.query.status))) list = list.filter((i) => i.status === req.query.status);
    list = sortIssues(searchIssues(list, req.query.search), str(req.query.sort));
    const page = paginate(list, req.query.page, req.query.limit);
    res.json({ ...page, items: page.items.map(publicIssue) });
  } catch (err) { next(err); }
});

// GET /api/issues/similar?category=&address=&lat=&lng=   -> possible duplicates (shown as a warning)
router.get('/similar', async (req, res, next) => {
  try {
    const category = str(req.query.category);
    const address = str(req.query.address).slice(0, 200);
    if (!CATEGORIES.includes(category) || address.length < 5) return res.json({ items: [] });
    const { issues } = await readDb();
    const found = findSimilar(issues, { category, address, lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng) });
    res.json({ items: found.map(publicIssue) });
  } catch (err) { next(err); }
});

// GET /api/issues/track/:complaintId   (header X-Reporter-Email: the e-mail used when reporting)
// The e-mail goes in a header, not the URL, so it does not end up in browser history or server logs.
router.get('/track/:complaintId', trackLimiter, async (req, res, next) => {
  try {
    const complaintId = str(req.params.complaintId).toUpperCase();
    const email = cleanEmail(req.get('x-reporter-email') || '');
    if (!COMPLAINT_ID_PATTERN.test(complaintId) || !email) throw new HttpError(400, 'Enter a complaint ID (like CF-20261023-K7P4X) and the email used when reporting.');
    const { issues } = await readDb();
    const issue = issues.find((i) => i.complaintId === complaintId);
    // Same message for "wrong ID" and "wrong email" so attackers cannot learn which IDs exist.
    if (!issue || !sameEmail(email, issue.reporterEmail)) throw new HttpError(404, NOT_MATCHED);
    res.json({ issue: trackedIssue(issue) });
  } catch (err) { next(err); }
});

// POST /api/issues   (multipart/form-data, optional file field "photo")
router.post('/', submitLimiter, handleUpload('photo'), async (req, res, next) => {
  try {
    const { errors, value } = validateNewIssue(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', errors);

    const { issue, similar } = await updateDb((data) => {
      const similarIssues = findSimilar(data.issues, { category: value.category, address: value.address, lat: value.lat, lng: value.lng });
      const now = new Date().toISOString();
      const created = {
        id: `iss_${crypto.randomBytes(6).toString('hex')}`,
        complaintId: newComplaintId(data.issues),
        title: value.title,
        description: value.description,
        category: value.category,
        location: { address: value.address, lat: value.lat, lng: value.lng },
        reporterEmail: value.email,
        photo: req.file ? relativePath(req.file) : null,
        status: 'pending',
        statusHistory: [{ status: 'pending', note: 'Complaint received.', by: 'system', at: now }],
        resolutionNote: '',
        resolutionPhoto: null,
        flaggedCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      data.issues.push(created);
      return { issue: created, similar: similarIssues };
    });

    res.status(201).json({
      message: 'Your complaint was submitted. Save your complaint ID to track it.',
      complaintId: issue.complaintId,
      issue: trackedIssue(issue),
      similar: similar.map(publicIssue),
    });
  } catch (err) {
    await discardUpload(req); // do not keep a photo for a report that was not saved
    next(err);
  }
});

// GET /api/issues/:id  -> public detail (no private data)
router.get('/:id', async (req, res, next) => {
  try {
    const { issues } = await readDb();
    const issue = issues.find((i) => i.id === req.params.id && i.status !== 'rejected');
    if (!issue) throw new HttpError(404, 'Issue not found.');
    res.json({ issue: publicIssue(issue) });
  } catch (err) { next(err); }
});

// POST /api/issues/:id/flag-unresolved   body: { email, reason }
// Only the original reporter (verified by e-mail) can re-open a resolved complaint.
router.post('/:id/flag-unresolved', flagLimiter, async (req, res, next) => {
  try {
    const { errors, value } = validateFlag(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', errors);
    const issue = await updateDb((data) => {
      const found = data.issues.find((i) => i.id === req.params.id);
      if (!found || !sameEmail(value.email, found.reporterEmail)) throw new HttpError(404, NOT_MATCHED);
      if (found.status !== 'resolved') throw new HttpError(409, 'Only resolved complaints can be marked as unresolved.');
      const now = new Date().toISOString();
      found.status = 'pending';
      found.flaggedCount += 1;
      found.resolutionNote = '';
      found.resolutionPhoto = null;
      found.updatedAt = now;
      found.statusHistory.push({ status: 'pending', note: `Reporter says the problem is not fixed: ${value.reason}`, by: 'citizen', at: now });
      return found;
    });
    res.json({ message: 'Thank you. The complaint is open again and will be reviewed.', issue: trackedIssue(issue) });
  } catch (err) { next(err); }
});

export default router;
