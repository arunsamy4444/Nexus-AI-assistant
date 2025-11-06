import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import ChatBot from "./components/ChatBot";
import TelegramChat from "./components/TelegramChat";
import ReminderForm from "./components/ReminderForm";
import History from "./components/History";
import Login from "./components/Login";
import Signup from "./components/Signup";
import "./App.css";

// Toast Notification Component
const Toast = ({ message, type = "info", onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === "success" && "✅"}
          {type === "error" && "❌"}
          {type === "warning" && "⚠️"}
          {type === "info" && "ℹ️"}
        </span>
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="toast-progress"></div>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
};

// Performance Warning Component
const PerformanceWarning = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="performance-warning">
      <div className="warning-content">
        <div className="warning-icon">🐢</div>
        <div className="warning-text">
          <strong>Free Tier Performance Notice</strong>
          <p>
            This app is running on free hosting services. For optimal
            performance, consider running locally.
          </p>
          <div className="warning-actions">
            <a
              href="https://github.com/arunsamy4444/Nexus-AI-assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="warning-btn primary"
            >
              📥 Get Code
            </a>
            <a
              href="mailto:arunsamydeveloper@gmail.com"
              className="warning-btn secondary"
            >
              📧 Contact for Local Setup
            </a>
            <button onClick={handleDismiss} className="warning-btn dismiss">
              ✕ Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Auth Navigation Component
function AuthNavigation({ user, onLogin, onLogout, addToast }) {
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
    try {
      await supabase.auth.signOut();
      onLogout();
      addToast("Successfully logged out", "success");
      closeMenu();
    } catch (error) {
      addToast("Error logging out", "error");
    }
  };

  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "ChatBot", icon: "🤖", color: "var(--accent)" },
    {
      path: "/telegram",
      label: "Telegram",
      icon: "✈️",
      color: "var(--telegram-blue)",
    },
    {
      path: "/reminders",
      label: "Reminders",
      icon: "⏰",
      color: "var(--warning)",
    },
    { path: "/history", label: "History", icon: "📊", color: "var(--success)" },
  ];

  return (
    <>
      <div className="network-bg"></div>
      <div className="network-pattern"></div>
      <div className="bg-animated"></div>

      <div className="app-container">
        {/* Enhanced Desktop Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand-logo">
              <div className="logo-icon">⚡</div>
              <h1>Nexus</h1>
            </div>
            {user && (
              <div className="user-profile">
                <div className="user-avatar-main">
                  <span className="avatar-icon">👤</span>
                  <div className="online-indicator"></div>
                </div>
                <div className="user-info">
                  <span className="user-name">{user.email?.split("@")[0]}</span>
                  <span className="user-status">Online</span>
                </div>
              </div>
            )}
          </div>

          <nav className="sidebar-nav">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${
                      isActive(item.path) ? "active" : ""
                    }`}
                    style={{ "--item-color": item.color }}
                    onClick={() =>
                      addToast(`Navigated to ${item.label}`, "info", 2000)
                    }
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    <div className="nav-glow"></div>
                  </Link>
                ))}

                <div className="nav-divider"></div>

                <button onClick={handleLogout} className="nav-item logout-btn">
                  <span className="nav-icon">🚪</span>
                  <span className="nav-label">Logout</span>
                </button>
              </>
            ) : (
              <div className="auth-buttons">
                <Link
                  to="/login"
                  className={`nav-item ${isActive("/login") ? "active" : ""}`}
                >
                  <span className="nav-icon">🔑</span>
                  <span className="nav-label">Login</span>
                </Link>
                <Link to="/signup" className="nav-item signup-btn">
                  <span className="nav-icon">✨</span>
                  <span className="nav-label">Sign Up</span>
                </Link>
              </div>
            )}
          </nav>

          <div className="sidebar-footer">
            <div className="connection-status">
              <div className="status-dot"></div>
              <span className="status-text">System Online</span>
            </div>
            <div className="hosting-notice">
              <span className="hosting-icon">🌐</span>
              <span className="hosting-text">Free Hosting</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {/* Mobile Header */}
          <header className="mobile-header">
            <div className="mobile-brand">
              <div className="logo-icon">⚡</div>
              <h1>Nexus</h1>
            </div>

            <button className="hamburger-toggle" onClick={toggleMenu}>
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div className={`mobile-nav-menu ${isMenuOpen ? "open" : ""}`}>
              {user ? (
                <>
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`mobile-nav-item ${
                        isActive(item.path) ? "active" : ""
                      }`}
                      onClick={() => {
                        closeMenu();
                        addToast(`Navigated to ${item.label}`, "info", 2000);
                      }}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="mobile-nav-item logout-btn"
                  >
                    <span className="nav-icon">🚪</span>
                    <span className="nav-label">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`mobile-nav-item ${
                      isActive("/login") ? "active" : ""
                    }`}
                    onClick={closeMenu}
                  >
                    <span className="nav-icon">🔑</span>
                    <span className="nav-label">Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="mobile-nav-item signup-btn"
                    onClick={closeMenu}
                  >
                    <span className="nav-icon">✨</span>
                    <span className="nav-label">Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </header>

          {/* Page Content */}
          <div className="page-content">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to="/" />
                  ) : (
                    <Login onLogin={onLogin} addToast={addToast} />
                  )
                }
              />
              <Route
                path="/signup"
                element={
                  user ? (
                    <Navigate to="/" />
                  ) : (
                    <Signup
                      onSwitchToLogin={handleSwitchToLogin}
                      addToast={addToast}
                    />
                  )
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  user ? (
                    <div className="section chatbot-section">
                      <ChatBot addToast={addToast} />
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
                      <TelegramChat addToast={addToast} />
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
                      <ReminderForm addToast={addToast} />
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
                      <History addToast={addToast} />
                    </div>
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Fallback route */}
              <Route
                path="*"
                element={<Navigate to={user ? "/" : "/login"} />}
              />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(true);

  // Toast management
  const addToast = (message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Check for active session on component mount
  useEffect(() => {
    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);

      // Show appropriate toasts for auth events
      if (event === "SIGNED_IN") {
        addToast("Successfully signed in!", "success");
      } else if (event === "SIGNED_OUT") {
        addToast("Successfully signed out", "info");
      }
    });

    // Show initial performance warning after delay
    const performanceTimer = setTimeout(() => {
      if (
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        setShowPerformanceWarning(true);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(performanceTimer);
    };
  }, []);

  const getSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      console.error("Error getting session:", error);
      addToast("Error connecting to authentication service", "error");
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

  const handleDismissPerformanceWarning = () => {
    setShowPerformanceWarning(false);
    addToast("Performance warning dismissed", "info", 3000);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="network-bg"></div>
        <div className="network-pattern"></div>
        <div className="bg-animated"></div>
        <div className="loading-container">
          <div className="nexus-loader">
            <div className="loader-orb"></div>
            <div className="loader-orb"></div>
            <div className="loader-orb"></div>
          </div>
          <h2>Initializing Nexus</h2>
          <p>Loading your AI assistant experience...</p>
          <div className="performance-hint">
            <small>Running on free tier - may be slower than localhost</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-wrapper">
        {showPerformanceWarning && (
          <PerformanceWarning onDismiss={handleDismissPerformanceWarning} />
        )}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <AuthNavigation
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          addToast={addToast}
        />
      </div>
    </Router>
  );
}

export default App;
