import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { supabase } from '../supabaseClient';
import "./../styles/ReminderForm.css";

export default function ReminderForm() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [user, setUser] = useState(null);
  const utteranceRef = useRef(null);

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
      console.log('Attempting to log action:', action);
      
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

  // Enhanced speech synthesis function
  const speakText = async (text) => {
    if (!text || typeof text !== 'string') {
      console.warn('No text provided for speech synthesis');
      return;
    }

    // Stop any ongoing speech
    stopAlarm();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech settings
      utterance.rate = 0.8; // Slower for better comprehension of reminders
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Set voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.includes('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utteranceRef.current = utterance;

      utterance.onend = () => {
        utteranceRef.current = null;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        utteranceRef.current = null;
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  };

  // Submit new reminder to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !date || !time || !reason) {
      alert("Please fill all fields");
      return;
    }

    setIsLoading(true);
    const newReminder = { 
      name, 
      date, 
      time, 
      reason, 
      triggered: false, 
      id: Date.now(),
      user_id: user?.id || 'anonymous'
    };

    try {
      // Send reminder to your backend
      await axios.post(`${BASE_URL}/api/reminders`, newReminder);
      setReminders(prev => [...prev, newReminder]);
      
      // Log the reminder creation
      await logAction(`Set reminder: ${name} - ${reason} on ${date} at ${time}`);
      
      // Reset form
      setName(""); 
      setDate(""); 
      setTime(""); 
      setReason("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Backend API error:", err);
      // Fallback to localStorage if backend fails
      console.log("Falling back to localStorage storage");
      setReminders(prev => [...prev, newReminder]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await logAction(`Set reminder (local): ${name} - ${reason} on ${date} at ${time}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop ongoing speech
  const stopAlarm = async () => {
    if (utteranceRef.current || speechSynthesis.speaking) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
      setActiveAlarm(null);
      await logAction("Stopped alarm manually");
    }
  };

  // Check if reminder is upcoming (within 1 hour)
  const isUpcoming = (reminder) => {
    const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    return reminderDateTime > now && reminderDateTime <= oneHourFromNow && !reminder.triggered;
  };

  // Enhanced alarm trigger with better speech
  const triggerAlarm = async (reminder) => {
    const message = `Reminder for ${reminder.name}. It's time for: ${reminder.reason}. Scheduled for ${reminder.time}.`;
    
    setActiveAlarm(reminder);
    await logAction(`Alarm triggered: ${reminder.name} - ${reminder.reason} at ${reminder.time}`);
    
    // Speak the reminder
    await speakText(message);
    
    // Mark as triggered after speech completes
    const updatedReminders = reminders.map(r => 
      r.id === reminder.id ? { ...r, triggered: true } : r
    );
    setReminders(updatedReminders);
    
    // Clear active alarm after speech
    setTimeout(() => {
      setActiveAlarm(null);
    }, 5000);
  };

  // Poll reminders and trigger alarms
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      reminders.forEach(async (reminder) => {
        if (!reminder.triggered && reminder.date === currentDate && reminder.time === currentTime) {
          await triggerAlarm(reminder);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [reminders]);

  // Load reminders from backend on component mount
  useEffect(() => {
    loadReminders();
  }, [user]);

  const loadReminders = async () => {
    try {
      if (user) {
        // Try to load from backend first
        const response = await axios.get(`${BASE_URL}/api/reminders`, {
          params: { user_id: user.id }
        });
        if (response.data && response.data.length > 0) {
          setReminders(response.data);
          return;
        }
      }
      
      // Fallback to localStorage
      const savedReminders = localStorage.getItem('health-reminders');
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
    } catch (error) {
      console.error("Error loading reminders from backend, using localStorage:", error);
      // Fallback to localStorage
      const savedReminders = localStorage.getItem('health-reminders');
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
    }
  };

  // Save reminders to localStorage whenever reminders change
  useEffect(() => {
    localStorage.setItem('health-reminders', JSON.stringify(reminders));
  }, [reminders]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Delete a reminder
  const deleteReminder = async (reminderId) => {
    const reminderToDelete = reminders.find(r => r.id === reminderId);
    if (reminderToDelete) {
      await logAction(`Deleted reminder: ${reminderToDelete.name} - ${reminderToDelete.reason}`);
      
      // Try to delete from backend
      try {
        await axios.delete(`${BASE_URL}/api/reminders/${reminderId}`);
      } catch (error) {
        console.error("Error deleting from backend, continuing with local delete:", error);
      }
    }
    
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  };

  // Clear all reminders
  const clearAllReminders = async () => {
    if (window.confirm('Are you sure you want to clear all reminders?')) {
      // Try to clear from backend
      try {
        if (user) {
          await axios.delete(`${BASE_URL}/api/reminders`, {
            data: { user_id: user.id }
          });
        }
      } catch (error) {
        console.error("Error clearing reminders from backend, continuing with local clear:", error);
      }
      
      setReminders([]);
      await logAction("Cleared all reminders");
    }
  };

  // Clean up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, []);

  return (
    <div className="reminder-container">
      <div className="reminder-header">
        <h1 className="reminder-title">Medication Reminder</h1>
        <p className="reminder-subtitle">Set alerts for your medications and health routines</p>
        {user && (
          <div className="user-session-info">
            <small>Logged in as: {user.email}</small>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="success-message">
          <span>✅</span>
          Reminder set successfully!
        </div>
      )}

      {activeAlarm && (
        <div className="alarm-active">
          <span>🔔</span>
          Alarm Active: {activeAlarm.name} - {activeAlarm.reason}
          <button 
            onClick={stopAlarm}
            className="stop-alarm-btn"
          >
            Stop Alarm
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="reminder-form">
        <div className="form-group">
          <label className="form-label">Patient Name</label>
          <input 
            type="text" 
            placeholder="Enter patient name"
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="form-input"
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="form-input"
            required 
            min={new Date().toISOString().split('T')[0]} // Prevent past dates
          />
        </div>

        <div className="form-group">
          <label className="form-label">Time</label>
          <input 
            type="time" 
            value={time} 
            onChange={e => setTime(e.target.value)} 
            className="form-input"
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reminder Reason</label>
          <input 
            type="text" 
            placeholder="e.g., Take medication, Doctor appointment, Exercise"
            value={reason} 
            onChange={e => setReason(e.target.value)} 
            className="form-input"
            required 
          />
        </div>

        <div className="reminder-buttons">
          <button 
            type="submit" 
            className="reminder-button primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Setting...
              </>
            ) : (
              <>
                <span>⏰</span>
                Set Reminder
              </>
            )}
          </button>
          
          <button 
            type="button" 
            onClick={stopAlarm} 
            className="reminder-button danger"
            disabled={!activeAlarm && !speechSynthesis.speaking}
          >
            <span>⏹️</span>
            Stop Alarm
          </button>
        </div>
      </form>

      <div className="reminders-list">
        <div className="reminders-header">
          <h3 className="reminders-title">Your Reminders ({reminders.length})</h3>
          {reminders.length > 0 && (
            <button 
              onClick={clearAllReminders}
              className="clear-all-btn"
            >
              Clear All
            </button>
          )}
        </div>
        
        {reminders.length === 0 ? (
          <div className="reminders-empty">
            <div className="reminders-empty-icon">⏰</div>
            <div className="reminders-empty-text">No reminders set yet</div>
            <div className="reminders-empty-subtext">Set your first reminder above</div>
            {!user && (
              <div className="login-reminder">
                <p>💡 Sign in to sync your reminders across devices!</p>
              </div>
            )}
          </div>
        ) : (
          reminders.map((reminder) => (
            <div 
              key={reminder.id} 
              className={`reminder-item ${
                reminder.triggered ? 'triggered' : 
                isUpcoming(reminder) ? 'upcoming' : ''
              }`}
            >
              <div className="reminder-header-info">
                <div className="reminder-info-main">
                  <h4 className="reminder-name">{reminder.name}</h4>
                  <div className="reminder-time">
                    <span>🕒</span>
                    {reminder.time}
                  </div>
                </div>
                <button 
                  onClick={() => deleteReminder(reminder.id)}
                  className="delete-reminder-btn"
                  title="Delete reminder"
                >
                  🗑️
                </button>
              </div>
              
              <div className="reminder-reason">
                {reminder.reason}
              </div>
              
              <div className="reminder-meta">
                <span>{formatDate(reminder.date)}</span>
                <div className={`reminder-status ${
                  reminder.triggered ? 'status-triggered' : 'status-pending'
                }`}>
                  <span>
                    {reminder.triggered ? '✅ Completed' : 
                     isUpcoming(reminder) ? '🔜 Upcoming' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            </div>
          )).reverse()
        )}
      </div>
    </div>
  );
}