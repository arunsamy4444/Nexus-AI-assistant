import React, { useState, useEffect } from "react";
import { supabase } from '../supabaseClient';
import "../styles/History.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all"); // all, chatbot, reminders, telegram
  const [searchTerm, setSearchTerm] = useState("");

  // Get current user and load history
  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadHistory();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('History')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Filter history based on category and search term
  const filteredHistory = history.filter(item => {
    const matchesFilter = filter === "all" || 
      (filter === "chatbot" && item.action.toLowerCase().includes("health")) ||
      (filter === "reminders" && item.action.toLowerCase().includes("reminder")) ||
      (filter === "telegram" && item.action.toLowerCase().includes("telegram"));
    
    const matchesSearch = item.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Categorize actions for better organization
  const categorizeAction = (action) => {
    const lowerAction = action.toLowerCase();
    
    if (lowerAction.includes("health") || lowerAction.includes("ai") || lowerAction.includes("asked") || lowerAction.includes("received")) {
      return "chatbot";
    } else if (lowerAction.includes("reminder") || lowerAction.includes("alarm")) {
      return "reminders";
    } else if (lowerAction.includes("telegram")) {
      return "telegram";
    } else {
      return "other";
    }
  };

  const getActionIcon = (category) => {
    switch (category) {
      case "chatbot":
        return "🤖";
      case "reminders":
        return "⏰";
      case "telegram":
        return "✈️";
      default:
        return "📝";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all your history? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('History')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      setError('Failed to clear history');
    }
  };

  const getStats = () => {
    const total = history.length;
    const chatbot = history.filter(item => categorizeAction(item.action) === "chatbot").length;
    const reminders = history.filter(item => categorizeAction(item.action) === "reminders").length;
    const telegram = history.filter(item => categorizeAction(item.action) === "telegram").length;
    
    return { total, chatbot, reminders, telegram };
  };

  const stats = getStats();

  if (!user) {
    return (
      <div className="history-container">
        <div className="history-header">
          <h1 className="history-title">Activity History</h1>
          <p className="history-subtitle">Track your app usage and activities</p>
        </div>
        <div className="login-required">
          <div className="login-required-icon">🔐</div>
          <h3>Sign In Required</h3>
          <p>Please sign in to view your activity history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1 className="history-title">Activity History</h1>
        <p className="history-subtitle">Track your app usage and activities</p>
        <div className="user-info">
          <span>👤 {user.email}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Activities</div>
          </div>
        </div>
        
        <div className="stat-card chatbot">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-number">{stats.chatbot}</div>
            <div className="stat-label">ChatBot</div>
          </div>
        </div>
        
        <div className="stat-card reminders">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-number">{stats.reminders}</div>
            <div className="stat-label">Reminders</div>
          </div>
        </div>
        
        <div className="stat-card telegram">
          <div className="stat-icon">✈️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.telegram}</div>
            <div className="stat-label">Telegram</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="history-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === "chatbot" ? "active" : ""}`}
            onClick={() => setFilter("chatbot")}
          >
            🤖 ChatBot
          </button>
          <button 
            className={`filter-btn ${filter === "reminders" ? "active" : ""}`}
            onClick={() => setFilter("reminders")}
          >
            ⏰ Reminders
          </button>
          <button 
            className={`filter-btn ${filter === "telegram" ? "active" : ""}`}
            onClick={() => setFilter("telegram")}
          >
            ✈️ Telegram
          </button>
        </div>

        <div className="search-clear">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <button 
            onClick={clearHistory}
            disabled={history.length === 0}
            className="clear-history-btn"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your activity history...</p>
        </div>
      )}

      {/* History List */}
      <div className="history-list">
        {!loading && filteredHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No activities found</h3>
            <p>
              {searchTerm || filter !== "all" 
                ? "Try adjusting your search or filter" 
                : "Your activities will appear here as you use the app"
              }
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const category = categorizeAction(item.action);
            return (
              <div key={item.id} className="history-item">
                <div className="history-item-icon">
                  {getActionIcon(category)}
                </div>
                <div className="history-item-content">
                  <div className="history-action">
                    {item.action}
                  </div>
                  <div className="history-meta">
                    <span className="history-time">
                      {formatDate(item.created_at)}
                    </span>
                    <span className={`history-category ${category}`}>
                      {category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Refresh Button */}
      {!loading && (
        <div className="refresh-section">
          <button onClick={loadHistory} className="refresh-btn">
            🔄 Refresh History
          </button>
        </div>
      )}
    </div>
  );
};

export default History;