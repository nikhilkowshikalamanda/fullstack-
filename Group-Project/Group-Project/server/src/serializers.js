// Decides WHICH fields each audience may see. This is the privacy boundary:
//   publicIssue  -> anyone (no e-mail, no complaint ID, no admin names, no internal notes)
//   trackedIssue -> the reporter after e-mail verification
//   adminIssue   -> logged-in administrator
const toUrl = (rel) => (rel ? `/${rel}` : null);
const actor = (by) => (by === 'citizen' ? 'Citizen' : by === 'system' ? 'System' : 'Administrator');

export function publicIssue(i) {
  return {
    id: i.id,
    title: i.title,
    description: i.description,
    category: i.category,
    status: i.status,
    address: i.location.address,
    lat: i.location.lat,
    lng: i.location.lng,
    photoUrl: toUrl(i.photo),
    resolutionNote: i.resolutionNote,
    resolutionPhotoUrl: toUrl(i.resolutionPhoto),
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    history: i.statusHistory.map((h) => ({ status: h.status, at: h.at })), // no notes, no names
  };
}

export function trackedIssue(i) {
  return {
    ...publicIssue(i),
    complaintId: i.complaintId,
    flaggedCount: i.flaggedCount,
    history: i.statusHistory.map((h) => ({
      status: h.status,
      at: h.at,
      note: h.note,
      by: actor(h.by),
      photoUrl: toUrl(h.photo),
    })),
  };
}

export function adminIssue(i, detail = false) {
  const base = {
    id: i.id,
    complaintId: i.complaintId,
    title: i.title,
    category: i.category,
    status: i.status,
    address: i.location.address,
    flaggedCount: i.flaggedCount,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
  if (!detail) return base;
  return {
    ...base,
    description: i.description,
    lat: i.location.lat,
    lng: i.location.lng,
    reporterEmail: i.reporterEmail, // only administrators see this, and only in the detail view
    photoUrl: toUrl(i.photo),
    resolutionNote: i.resolutionNote,
    resolutionPhotoUrl: toUrl(i.resolutionPhoto),
    history: i.statusHistory.map((h) => ({ ...h, photoUrl: toUrl(h.photo) })),
  };
}
