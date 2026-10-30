// Numbers shown on the home page and the admin dashboard.
import { CATEGORIES, STATUSES } from './validate.js';

export function computeStats(issues) {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  let resolutionHours = 0;
  let resolvedWithTime = 0;
  let flagged = 0;
  for (const i of issues) {
    byStatus[i.status] += 1;
    byCategory[i.category] += 1;
    if (i.flaggedCount > 0) flagged += 1;
    if (i.status === 'resolved') {
      resolutionHours += (new Date(i.updatedAt) - new Date(i.createdAt)) / 36e5;
      resolvedWithTime += 1;
    }
  }
  const total = issues.length;
  return {
    total,
    pending: byStatus.pending,
    inProgress: byStatus.in_progress,
    resolved: byStatus.resolved,
    rejected: byStatus.rejected,
    byStatus,
    byCategory,
    flaggedUnresolved: flagged,
    resolutionRate: total ? Math.round((byStatus.resolved / total) * 100) : 0,
    avgResolutionHours: resolvedWithTime ? Math.round(resolutionHours / resolvedWithTime) : null,
  };
}
