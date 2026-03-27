import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Editor = lazy(() => import('./pages/Editor'));
const Article = lazy(() => import('./pages/Article'));

function RequireAuth() {
  const { authState } = useAuth();
  if (authState === 'loading') return <div className="container" style={{ marginTop: '2rem' }}>Loading...</div>;
  if (authState === 'unauthenticated') return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireGuest() {
  const { authState } = useAuth();
  if (authState === 'loading') return null;
  if (authState === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}

function AppLayout() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <Suspense fallback={<div className="container" style={{ marginTop: '2rem' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />

          <Route element={<RequireGuest />}>
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/settings" element={<Settings />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/editor/:slug" element={<Editor />} />
          </Route>

          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/profile/:username/favorites" element={<Profile />} />
          <Route path="/article/:slug" element={<Article />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
