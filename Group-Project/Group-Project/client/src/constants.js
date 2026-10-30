// Values shared by many components.
export const CATEGORIES = [
  { value: 'pothole', label: 'Pothole / road damage', icon: '🕳️', hint: 'Cracks, potholes, sunken roads' },
  { value: 'garbage', label: 'Garbage', icon: '🗑️', hint: 'Overflowing bins, illegal dumping' },
  { value: 'streetlight', label: 'Streetlight', icon: '💡', hint: 'Lights that are off or flickering' },
  { value: 'drainage', label: 'Drainage', icon: '🌧️', hint: 'Blocked drains, waterlogging' },
  { value: 'water_leakage', label: 'Water leakage', icon: '🚰', hint: 'Leaking pipes and taps' },
  { value: 'other', label: 'Other', icon: '📌', hint: 'Any other public problem' },
];

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label || value;

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

// Free map link (OpenStreetMap) - no API key needed.
export function mapLink({ lat, lng, address }) {
  if (lat !== null && lat !== undefined && lng !== null && lng !== undefined && lat !== '' && lng !== '') {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address || '')}`;
}
