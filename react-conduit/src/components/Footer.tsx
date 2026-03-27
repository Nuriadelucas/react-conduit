import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer>
      <div className="container">
        <Link to="/" className="logo-font">Conduit</Link>
        <span className="attribution">
          &copy; {new Date().getFullYear()}. An interactive learning project from{' '}
          <a href="https://github.com/gothinkster/realworld">RealWorld OSS Project</a>.
          Code licensed under MIT.
        </span>
      </div>
    </footer>
  );
}
