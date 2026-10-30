// Small reusable pieces for loading, error and empty states.
export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert">
      <p>{error.message || String(error)}</p>
      {onRetry && <button className="btn btn-small btn-ghost" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
