// A label + input wrapper that shows hints and error messages accessibly.
export const describe = (id, error, hint) => ({
  id,
  'aria-invalid': error ? 'true' : undefined,
  'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});

export default function Field({ id, label, required, hint, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="error-text" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
