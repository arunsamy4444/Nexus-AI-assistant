import { useState } from "react";
import { supabase } from '../supabaseClient';
import "./../styles/Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }
    
    setMessage({ type: 'success', text: "Login successful! Redirecting..." });
    
    setTimeout(() => {
      onLogin(data.user);
    }, 1500);
  };

  return (
    <div className="login-container">
      <div className="login-bg-pattern"></div>
      <div className="login-glow"></div>
      
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to access your health assistant</p>
        </div>

        {message && (
          <div className={`login-message message-${message.type}`}>
            <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon">📧</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <div className="button-loading">
                <div className="loading-spinner"></div>
                Signing In...
              </div>
            ) : (
              <>
                <span>🚀</span>
                Sign In
              </>
            )}
          </button>

          <div className="register-link">
            Don't have an account? 
            <a href="#signup" onClick={(e) => e.preventDefault()}>
              Sign up here
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}