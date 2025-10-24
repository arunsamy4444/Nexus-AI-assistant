import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import ChatBot from "./components/ChatBot";
import TelegramChat from "./components/TelegramChat";
import ReminderForm from "./components/ReminderForm";
import History from "./components/History";
import Login from "./components/Login";
import Signup from "./components/Signup";
import './App.css';

// Auth Navigation Component
function AuthNavigation({ user, onLogin, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
    closeMenu();
  };

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <>
      <div className="network-bg"></div>
      <div className="network-pattern"></div>
      
      <div className="container">
        <div className="nav-wrapper">
          <div className="nav-brand">
            <h1>Nexus</h1>
            {user && (
              <div className="user-badge">
                <span className="user-avatar">👤</span>
                <span className="user-email">{user.email}</span>
              </div>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            {user ? (
              <>
                <Link 
                  to="/" 
                  className={`nav-button ${isActive('/') ? 'active' : 'secondary'}`}
                >
                  ChatBot
                </Link>
                <Link 
                  to="/telegram" 
                  className={`nav-button ${isActive('/telegram') ? 'active' : 'secondary'}`}
                >
                  Telegram
                </Link>
                <Link 
                  to="/reminders" 
                  className={`nav-button ${isActive('/reminders') ? 'active' : 'secondary'}`}
                >
                  Reminders
                </Link>
                <Link 
                  to="/history" 
                  className={`nav-button ${isActive('/history') ? 'active' : 'secondary'}`}
                >
                  <span>📊</span>
                  History
                </Link>
                <button 
                  onClick={handleLogout}
                  className="nav-button danger"
                >
                  <span>🚪</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`nav-button ${isActive('/login') ? 'active' : 'secondary'}`}
                >
                  <span>🔑</span>
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className={`nav-button ${isActive('/signup') ? 'active' : 'primary'}`}
                >
                  <span>✨</span>
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Navigation */}
          <nav className="nav-mobile">
            <button 
              className="hamburger-toggle"
              onClick={toggleMenu}
            >
              ☰
            </button>
            
            <div className={`mobile-nav-menu ${isMenuOpen ? 'open' : ''}`}>
              {user ? (
                <>
                  <Link 
                    to="/" 
                    className={`nav-button ${isActive('/') ? 'active' : 'secondary'}`} 
                    onClick={closeMenu}
                  >
                    ChatBot
                  </Link>
                  <Link 
                    to="/telegram" 
                    className={`nav-button ${isActive('/telegram') ? 'active' : 'secondary'}`} 
                    onClick={closeMenu}
                  >
                    Telegram
                  </Link>
                  <Link 
                    to="/reminders" 
                    className={`nav-button ${isActive('/reminders') ? 'active' : 'secondary'}`} 
                    onClick={closeMenu}
                  >
                    Reminders
                  </Link>
                  <Link 
                    to="/history" 
                    className={`nav-button ${isActive('/history') ? 'active' : 'secondary'}`} 
                    onClick={closeMenu}
                  >
                    <span>📊</span>
                    History
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="nav-button danger"
                  >
                    <span>🚪</span>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`nav-button ${isActive('/login') ? 'active' : 'secondary'}`} 
                    onClick={closeMenu}
                  >
                    <span>🔑</span>
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className={`nav-button ${isActive('/signup') ? 'active' : 'primary'}`} 
                    onClick={closeMenu}
                  >
                    <span>✨</span>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>

        <div className="page-container">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/" /> : <Login onLogin={onLogin} />
              } 
            />
            <Route 
              path="/signup" 
              element={
                user ? <Navigate to="/" /> : <Signup onSwitchToLogin={handleSwitchToLogin} />
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                user ? (
                  <div className="section chatbot-section">
                    <ChatBot />
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/telegram" 
              element={
                user ? (
                  <div className="section">
                    <TelegramChat />
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/reminders" 
              element={
                user ? (
                  <div className="section">
                    <ReminderForm />
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/history" 
              element={
                user ? (
                  <div className="section">
                    <History />
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for active session on component mount
  useEffect(() => {
    getSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      console.error('Error getting session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="network-bg"></div>
        <div className="network-pattern"></div>
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <h2>Loading Nexus...</h2>
          <p>Preparing your AI assistant</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthNavigation user={user} onLogin={handleLogin} onLogout={handleLogout} />
    </Router>
  );
}

export default App;