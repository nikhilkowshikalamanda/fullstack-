import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container narrow section">
      <h1>Page not found</h1>
      <p className="lead-dark">The page you are looking for does not exist or was moved.</p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/">Go to the home page</Link>
        <Link className="btn btn-ghost" to="/issues">Browse public issues</Link>
      </div>
    </div>
  );
}
