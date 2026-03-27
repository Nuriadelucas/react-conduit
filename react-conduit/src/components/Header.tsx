import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { defaultImage } from '../lib/defaultImage';

export function Header() {
  const { currentUser, authState } = useAuth();

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <img src="/assets/conduit-logo.svg" alt="Conduit" className="navbar-logo" />
        </Link>

        {authState === 'loading' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <Link to="/" className="nav-link">Home</Link>
            </li>
            <li className="nav-item">
              <span className="nav-link">Loading...</span>
            </li>
          </ul>
        )}

        {authState === 'unauthenticated' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Sign in
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/register" className={({ isActive }) => `nav-link nav-signup${isActive ? ' active' : ''}`}>
                Sign up
              </NavLink>
            </li>
          </ul>
        )}

        {authState === 'authenticated' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/editor" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <i className="ion-compose" />&nbsp;New Article
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <i className="ion-gear-a" />&nbsp;Settings
              </NavLink>
            </li>
            {currentUser && (
              <li className="nav-item">
                <NavLink
                  to={`/profile/${currentUser.username}`}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <img className="user-pic" src={defaultImage(currentUser.image)} alt={currentUser.username} />
                  {currentUser.username}
                </NavLink>
              </li>
            )}
          </ul>
        )}

        {authState === 'unavailable' && (
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/editor" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <i className="ion-compose" />&nbsp;New Article
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <i className="ion-gear-a" />&nbsp;Settings
              </NavLink>
            </li>
            <li className="nav-item">
              <span className="nav-link" title="Auth unavailable - retrying automatically">
                <i className="ion-load-c" />&nbsp;Connecting...
              </span>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
