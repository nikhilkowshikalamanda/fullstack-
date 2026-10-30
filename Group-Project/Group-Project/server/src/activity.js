// Administrator activity history (stored in the same JSON file). Keeps the latest 500 entries.
import crypto from 'node:crypto';

export function logActivity(data, admin, action, issue, detail) {
  data.activity = data.activity || [];
  data.activity.push({
    id: `act_${crypto.randomBytes(5).toString('hex')}`,
    at: new Date().toISOString(),
    admin,
    action,
    issueId: issue ? issue.id : null,
    complaintId: issue ? issue.complaintId : null,
    detail,
  });
  if (data.activity.length > 500) data.activity.splice(0, data.activity.length - 500);
}
