// Small helpers for searching, sorting and paging lists of issues.
export const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function searchIssues(issues, term, extraFields = () => []) {
  const q = str(term).toLowerCase().slice(0, 100);
  if (!q) return issues;
  return issues.filter((i) =>
    [i.title, i.description, i.location.address, ...extraFields(i)].some((t) => String(t).toLowerCase().includes(q)),
  );
}

export function sortIssues(issues, sort) {
  const by = {
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    updated: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    status: (a, b) => a.status.localeCompare(b.status),
    category: (a, b) => a.category.localeCompare(b.category),
    flagged: (a, b) => b.flaggedCount - a.flaggedCount,
  };
  const compare = by[sort] || ((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
  return [...issues].sort(compare);
}

export function paginate(items, page, limit, maxLimit = 50) {
  const size = Math.min(Math.max(parseInt(limit, 10) || 12, 1), maxLimit);
  const pages = Math.max(Math.ceil(items.length / size), 1);
  const current = Math.min(Math.max(parseInt(page, 10) || 1, 1), pages);
  return { items: items.slice((current - 1) * size, current * size), total: items.length, page: current, pages };
}
