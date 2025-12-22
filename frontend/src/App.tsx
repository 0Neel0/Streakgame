import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import SeasonDetails from './pages/SeasonDetails';
import GithubCallback from './pages/GithubCallback';
import Chat from './pages/Chat';
import Clans from './pages/Clans';
import ClanDetails from './pages/ClanDetails';
import NotificationList from './pages/NotificationList';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Router>
            <div className="font-sans antialiased text-slate-900 dark:text-slate-100">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/github/callback" element={<GithubCallback />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <PrivateRoute>
                      <Chat />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <Admin />
                    </PrivateRoute>
                  }
                />
                <Route path="/season/:id" element={<PrivateRoute><SeasonDetails /></PrivateRoute>} />
                <Route path="/clans" element={<PrivateRoute><Clans /></PrivateRoute>} />
                <Route path="/clan/:id" element={<PrivateRoute><ClanDetails /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><NotificationList /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
