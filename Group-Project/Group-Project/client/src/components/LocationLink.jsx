import { mapLink } from '../constants.js';

// Location summary + free OpenStreetMap link (no API key, no paid service).
export default function LocationLink({ address, lat, lng }) {
  const hasCoords = lat !== null && lat !== undefined && lng !== null && lng !== undefined;
  return (
    <div className="location">
      <p><strong>{address}</strong></p>
      {hasCoords && <p className="muted">Coordinates: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</p>}
      <a href={mapLink({ lat, lng, address })} target="_blank" rel="noopener noreferrer">
        {hasCoords ? 'Open this spot on OpenStreetMap' : 'Search this place on OpenStreetMap'}
      </a>
    </div>
  );
}
