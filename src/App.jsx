// ══════════════════════════════════════════════════════
//  FABER.NET · src/App.jsx  — React Router Shell
// ══════════════════════════════════════════════════════
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import NavBar from './components/NavBar';
import Messenger from './components/Messenger';

import AuthPage      from './pages/AuthPage';
import FeedPage      from './pages/FeedPage';
import ReelsPage     from './pages/ReelsPage';
import TutorialsPage from './pages/TutorialsPage';
import MarketPage    from './pages/MarketPage';
import ProfilePage   from './pages/ProfilePage';
import AdminPage     from './pages/AdminPage';

// Protected route wrapper
function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { user, chatTarget, setChatTarget } = useAuth();
  return (
    <>
      {user && <NavBar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/feed" replace /> : <AuthPage />} />
        <Route path="/feed"      element={<Protected><FeedPage /></Protected>} />
        <Route path="/reels"     element={<Protected><ReelsPage /></Protected>} />
        <Route path="/tutorials" element={<Protected><TutorialsPage /></Protected>} />
        <Route path="/market"    element={<Protected><MarketPage /></Protected>} />
        <Route path="/profile"   element={<Protected><ProfilePage /></Protected>} />
        <Route path="/admin"     element={<Protected><AdminPage /></Protected>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
      {chatTarget && <Messenger initialTarget={chatTarget} onClose={() => setChatTarget(null)} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}