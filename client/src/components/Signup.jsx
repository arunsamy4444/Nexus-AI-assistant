import { useState, useEffect } from "react";
import { supabase } from '../supabaseClient';
import "./../styles/Signup.css";

export default function Signup({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match!" });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: "Password must be at least 6 characters!" });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }
    
    setMessage({ 
      type: 'success', 
      text: "Signup successful! Please check your email for confirmation." 
    });
    
    // Clear form after success
    setTimeout(() => {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }, 3000);
  };

  return (
    <div className="signup-container">
      <div className="signup-bg-pattern"></div>
      <div className="signup-glow"></div>
      
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">Join Us</h1>
          <p className="signup-subtitle">Create your account to start using Health Assistant</p>
        </div>

        {message && (
          <div className={`signup-message message-${message.type}`}>
            <span>{message.type === 'success' ? '🎉' : '⚠️'}</span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignup} className="signup-form">
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
                placeholder="Create a password (min 6 characters)"
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            
            {confirmPassword && password !== confirmPassword && (
              <div className="strength-text" style={{color: 'var(--danger)'}}>
                Passwords do not match!
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="signup-button"
            disabled={loading || !email || !password || !confirmPassword}
          >
            {loading ? (
              <div className="button-loading">
                <div className="loading-spinner"></div>
                Creating Account...
              </div>
            ) : (
              <>
                <span>🚀</span>
                Create Account
              </>
            )}
          </button>

          <div className="login-link">
            Already have an account? 
            <a href="#login" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
              Sign in here
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}