import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  async function handleLogout() {
    close();
    await logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close} aria-label="CivicFix home">
          <span className="brand-mark" aria-hidden="true" />
          CivicFix
        </Link>
        <button className="nav-toggle" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Menu'}
        </button>
        <nav id="nav-links" className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/report" onClick={close}>Report an issue</NavLink>
          <NavLink to="/track" onClick={close}>Track complaint</NavLink>
          <NavLink to="/issues" onClick={close}>Public issues</NavLink>
          <NavLink to={admin ? '/admin' : '/admin/login'} onClick={close}>Admin</NavLink>
          {admin && <button className="nav-signout" onClick={handleLogout}>Sign out</button>}
        </nav>
      </div>
    </header>
  );
}
