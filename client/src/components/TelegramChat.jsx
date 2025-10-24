import React, { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from '../supabaseClient';
import "./../styles/TelegramChat.css";

const TelegramChat = () => {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  const BASE_URL = process.env.REACT_APP_BASE_URL || "https://nexus-backend.onrender.com";

  // Get current user on component mount
  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  // Log action to Supabase
  const logAction = async (action) => {
    if (!user) {
      console.warn("Cannot log action, user not loaded yet:", action);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('History')
        .insert([
          { 
            user_id: user.id, 
            action: action,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error logging action:', error);
      } else {
        console.log('Action logged successfully');
      }
    } catch (error) {
      console.error('Exception logging action:', error);
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Load chat history from backend on component mount
  useEffect(() => {
    loadChatHistory();
  }, [user]);

  const loadChatHistory = async () => {
    try {
      if (user) {
        // Try to load from backend first
        const response = await axios.get(`${BASE_URL}/api/telegram/messages`, {
          params: { user_id: user.id }
        });
        if (response.data && response.data.length > 0) {
          setMessages(response.data);
          return;
        }
      }
      
      // Fallback to localStorage
      const savedMessages = localStorage.getItem('telegram-chat-history');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error("Error loading chat history from backend, using localStorage:", error);
      // Fallback to localStorage
      const savedMessages = localStorage.getItem('telegram-chat-history');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  };

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('telegram-chat-history', JSON.stringify(messages));
    
    // Also save to backend if user is logged in
    if (user && messages.length > 0) {
      saveMessagesToBackend();
    }
  }, [messages]);

  const saveMessagesToBackend = async () => {
    try {
      await axios.post(`${BASE_URL}/api/telegram/messages/sync`, {
        user_id: user.id,
        messages: messages
      });
    } catch (error) {
      console.error("Error syncing messages to backend:", error);
    }
  };

  const handleSend = async () => {
    if (!msg.trim()) {
      setError("Please enter a message");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      name: name,
      msg: msg,
      timestamp: new Date().toLocaleTimeString(),
      user_id: user?.id || 'anonymous'
    };

    setMessages(prev => [...prev, userMessage]);

    // Log the message sending
    await logAction(`Sent Telegram message: "${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}"`);

    try {
      // Send to your backend API
      const res = await axios.post(`${BASE_URL}/api/telegram/send`, { 
        name, 
        msg,
        user_id: user?.id || 'anonymous'
      });
      
      // Extract response message from different possible formats
      let responseMsg = "";
      if (res.data.data && res.data.data.msg) {
        responseMsg = res.data.data.msg;
      } else if (res.data.data) {
        responseMsg = res.data.data;
      } else if (res.data.message) {
        responseMsg = res.data.message;
      } else if (res.data.response) {
        responseMsg = res.data.response;
      } else {
        responseMsg = "Message sent successfully!";
      }
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        name: 'Telegram Bot',
        msg: responseMsg,
        timestamp: new Date().toLocaleTimeString(),
        user_id: user?.id || 'anonymous'
      };

      setMessages(prev => [...prev, botMessage]);
      setMsg("");
      setSuccess(true);

      // Log the bot response
      await logAction(`Received Telegram bot response: "${botMessage.msg.substring(0, 50)}${botMessage.msg.length > 50 ? '...' : ''}"`);

    } catch (err) {
      console.error("Backend API error:", err);
      
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        name: 'System',
        msg: "Failed to send message. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        user_id: user?.id || 'anonymous'
      };

      setMessages(prev => [...prev, errorMessage]);
      setError("Failed to send message");
      
      // Log the error
      await logAction("Failed to send Telegram message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    if (messages.length > 0) {
      await logAction(`Cleared Telegram chat with ${messages.length} messages`);
      
      // Try to clear from backend
      try {
        if (user) {
          await axios.delete(`${BASE_URL}/api/telegram/messages`, {
            data: { user_id: user.id }
          });
        }
      } catch (error) {
        console.error("Error clearing messages from backend, continuing with local clear:", error);
      }
    }
    
    setMessages([]);
    setError(null);
    setSuccess(false);
  };

  // Delete a single message
  const deleteMessage = async (messageId) => {
    const messageToDelete = messages.find(m => m.id === messageId);
    if (messageToDelete) {
      await logAction(`Deleted Telegram message: "${messageToDelete.msg.substring(0, 30)}${messageToDelete.msg.length > 30 ? '...' : ''}"`);
      
      // Try to delete from backend
      try {
        await axios.delete(`${BASE_URL}/api/telegram/messages/${messageId}`);
      } catch (error) {
        console.error("Error deleting message from backend, continuing with local delete:", error);
      }
    }
    
    setMessages(prev => prev.filter(message => message.id !== messageId));
  };

  // Get connection status text
  const getConnectionStatus = () => {
    if (user) {
      return "Connected to Telegram API • History synced with backend";
    } else {
      return "Connected to Telegram API • Sign in to sync across devices";
    }
  };

  return (
    <div className="telegram-container">
      <div className="telegram-header">
        <h1 className="telegram-title">Telegram Chat</h1>
        <p className="telegram-subtitle">Connect and communicate in real-time</p>
        {user && (
          <div className="user-session-info">
            <small>Logged in as: {user.email}</small>
          </div>
        )}
      </div>

      <div className="connection-status">
        <div className="status-dot"></div>
        <div className="status-text">
          {getConnectionStatus()}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <span>✅</span>
          Message sent successfully!
        </div>
      )}

      <div className="telegram-input-section">
        <div className="input-group">
          <label className="input-label">Your Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="telegram-input"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Message</label>
          <input
            type="text"
            placeholder="Type your message here..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyPress={handleKeyPress}
            className="telegram-input"
            disabled={loading}
          />
        </div>

        <div className="telegram-buttons">
          <button 
            onClick={handleSend} 
            disabled={loading || !msg.trim() || !name.trim()}
            className="telegram-button primary"
          >
            {loading ? (
              <>
                <div className="typing-dot"></div>
                Sending...
              </>
            ) : (
              <>
                <span>✈️</span>
                Send Message
              </>
            )}
          </button>
          
          <button 
            onClick={clearChat}
            disabled={messages.length === 0}
            className="telegram-button danger"
          >
            <span>🗑️</span>
            Clear Chat
          </button>
        </div>
      </div>

      <div className="telegram-messages">
        {messages.length === 0 ? (
          <div className="telegram-empty">
            <div className="telegram-empty-icon">💬</div>
            <div className="telegram-empty-text">No messages yet</div>
            <div className="telegram-empty-subtext">Start a conversation by sending a message</div>
            {!user && (
              <div className="login-reminder">
                <p>💡 Sign in to sync your chat history across devices!</p>
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="message-container">
              <div className={`message-bubble ${
                message.sender === 'user' ? 'message-outgoing' : 'message-incoming'
              }`}>
                <div className="message-header">
                  <div className={`message-avatar ${
                    message.sender === 'user' ? 'avatar-outgoing' : 'avatar-incoming'
                  }`}>
                    {message.sender === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={`message-sender ${
                    message.sender === 'user' ? 'sender-outgoing' : 'sender-incoming'
                  }`}>
                    {message.name}
                  </div>
                  <button 
                    onClick={() => deleteMessage(message.id)}
                    className="delete-message-btn"
                    title="Delete message"
                  >
                    ×
                  </button>
                </div>
                <div className="message-content">
                  {message.msg}
                </div>
                <div className="message-time">
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))
        )}

        {loading && messages.length > 0 && (
          <div className="telegram-loading">
            <div className="typing-indicator">
              <span>Telegram Bot is typing</span>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="chat-stats">
          <small>
            {messages.filter(m => m.sender === 'user').length} messages sent • 
            {messages.filter(m => m.sender === 'bot').length} responses received • 
            {user ? 'Synced with backend' : 'Local storage only'}
          </small>
        </div>
      )}
    </div>
  );
};

export default TelegramChat;