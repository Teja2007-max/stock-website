import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { TrendingUp, History, LogOut, Newspaper, Briefcase, SlidersHorizontal } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import HistoryPage from './pages/History';
import News from './pages/News';
import PortfolioPage from './pages/Portfolio';
import ScreenerPage from './pages/Screener';
import MarketTicker from './components/MarketTicker';

const NavLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} style={{
      background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
      borderRadius: 10,
      padding: '8px 14px',
      fontSize: '0.82rem',
      fontWeight: active ? 600 : 500,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'all 0.2s',
      textDecoration: 'none',
      color: active ? '#3b82f6' : 'var(--text-secondary)',
      border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
    }}>
      <Icon size={16} /> {label}
    </Link>
  );
};

const Navigation = () => {
  const { user, logout } = React.useContext(AuthContext);

  if (!user) return null;

  return (
    <nav className="navbar" style={{
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendingUp color="#3b82f6" size={26} />
        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Stock<span style={{ color: '#3b82f6' }}>Edge</span>
        </span>
      </Link>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink to="/" icon={TrendingUp} label="Dashboard" />
        <NavLink to="/screener" icon={SlidersHorizontal} label="Screener" />
        <NavLink to="/portfolio" icon={Briefcase} label="Portfolio" />
        <NavLink to="/news" icon={Newspaper} label="News" />
        <NavLink to="/history" icon={History} label="History" />
        <div style={{
          marginLeft: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px 6px 8px',
          background: 'rgba(59,130,246,0.08)',
          borderRadius: 20,
          border: '1px solid rgba(59,130,246,0.15)',
        }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'Outfit',
          }}>
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {user.username}
          </span>
        </div>
        <button onClick={logout} className="btn" style={{
          marginLeft: 4,
          borderRadius: 10,
          padding: '8px 14px',
          fontSize: '0.82rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--accent-red)',
        }}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="spinner"></div>;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="spinner"></div>;
  return user ? <Navigate to="/" /> : children;
};

const AppContent = () => {
  const { user } = React.useContext(AuthContext);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e) => {
      // "/" to focus search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) searchInput.focus();
      }
      // Escape to blur
      if (e.key === 'Escape') {
        document.activeElement?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Router>
      <div className={`app-container ${user ? 'colorful-premium-bg' : ''}`}>
        <Navigation />
        {user && <MarketTicker />}
        <div className="main-content">
          <Routes>
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/history" element={
              <PrivateRoute>
                <HistoryPage />
              </PrivateRoute>
            } />
            <Route path="/news" element={
              <PrivateRoute>
                <News />
              </PrivateRoute>
            } />
            <Route path="/portfolio" element={
              <PrivateRoute>
                <PortfolioPage />
              </PrivateRoute>
            } />
            <Route path="/screener" element={
              <PrivateRoute>
                <ScreenerPage />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
