const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const messageRoutes = require("./routes/messageRoutes");
const cron = require("node-cron");
const axios = require("axios");

dotenv.config();
const app = express();

// ✅ CORS setup — allow localhost + deployed frontend
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://nexus-ai-assistant-nine.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ✅ Routes
app.use("/api/message", messageRoutes);

// Telegram API configuration
const BOT_TOKEN = process.env.BOT_TOKEN || "8437194783:AAEXkdvcsuuulhd0hjM3PNhlhTyDJQ1vlfc";
const CHAT_ID = process.env.CHAT_ID || "1482060987";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ---------------- Chat Bot Endpoints ---------------- //

// Store chat history in memory (in production, use a database)
let chatHistory = [];

// ✅ Chat endpoint for AI responses
app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: "Message is required" 
      });
    }

    // For now, using a simple response system
    // In production, integrate with your AI service (OpenAI, etc.)
    const aiResponse = await generateAIResponse(message);

    // Save to chat history
    const chatMessage = {
      id: Date.now(),
      user_id: userId || 'anonymous',
      user_query: message,
      ai_response: aiResponse,
      timestamp: new Date().toISOString()
    };

    chatHistory.push(chatMessage);

    // Keep only last 100 messages per user to prevent memory issues
    if (userId) {
      const userMessages = chatHistory.filter(msg => msg.user_id === userId);
      if (userMessages.length > 100) {
        chatHistory = chatHistory.filter(msg => msg.user_id !== userId);
        chatHistory.push(...userMessages.slice(-50));
      }
    }

    res.json({
      success: true,
      message: aiResponse,
      content: aiResponse
    });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing your request"
    });
  }
});

// ✅ Get chat history for a user
app.get("/api/chat/history", (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  const userChats = chatHistory.filter(chat => chat.user_id === user_id);
  
  res.json({
    success: true,
    messages: userChats
  });
});

// Simple AI response generator (replace with actual AI service)
async function generateAIResponse(message) {
  const responses = {
    greeting: "Hello! I'm Nexus AI Assistant. How can I help you today?",
    help: "I can help you with information, answer questions, set reminders, and more. Just let me know what you need!",
    default: "I understand you're saying: \"" + message + "\". This is a simulated response. In production, I'd connect to a real AI service like OpenAI or another provider."
  };

  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return responses.greeting;
  } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return responses.help;
  } else {
    return responses.default;
  }
}

// ---------------- Reminder Endpoints ---------------- //

let reminders = [];

// ✅ Set a reminder
app.post("/api/reminders", (req, res) => {
  const { name, date, time, reason, user_id } = req.body;

  if (!name || !date || !time || !reason) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: name, date, time, reason" 
    });
  }

  const newReminder = {
    id: Date.now(),
    name,
    date,
    time,
    reason,
    user_id: user_id || 'anonymous',
    triggered: false,
    created_at: new Date().toISOString()
  };

  reminders.push(newReminder);
  
  res.json({ 
    success: true, 
    message: "Reminder set successfully",
    reminder: newReminder
  });
});

// ✅ Get all reminders for a user
app.get("/api/reminders", (req, res) => {
  const { user_id } = req.query;
  
  let userReminders;
  if (user_id) {
    userReminders = reminders.filter(reminder => reminder.user_id === user_id);
  } else {
    userReminders = reminders.filter(reminder => reminder.user_id === 'anonymous');
  }

  res.json({ 
    success: true,
    reminders: userReminders 
  });
});

// ✅ Delete a specific reminder
app.delete("/api/reminders/:id", (req, res) => {
  const { id } = req.params;
  
  const reminderIndex = reminders.findIndex(reminder => reminder.id == id);
  
  if (reminderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Reminder not found"
    });
  }

  reminders.splice(reminderIndex, 1);
  
  res.json({
    success: true,
    message: "Reminder deleted successfully"
  });
});

// ✅ Delete all reminders for a user
app.delete("/api/reminders", (req, res) => {
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  const initialLength = reminders.length;
  reminders = reminders.filter(reminder => reminder.user_id !== user_id);
  const deletedCount = initialLength - reminders.length;

  res.json({
    success: true,
    message: `Deleted ${deletedCount} reminders`,
    deleted_count: deletedCount
  });
});

// ---------------- Telegram Chat Endpoints (OLD CODE) ---------------- //

let telegramMessages = [];

// ✅ Send Telegram message using actual Telegram API
app.post("/api/telegram/send", async (req, res) => {
  const { name, msg, user_id } = req.body;

  if (!name || !msg) {
    return res.status(400).json({
      success: false,
      message: "Name and message are required"
    });
  }

  try {
    // Format the message with user info
    const formattedMessage = `👤 From: ${name}\n💬 Message: ${msg}\n🆔 User ID: ${user_id || 'anonymous'}\n⏰ Time: ${new Date().toLocaleString()}`;

    // Send message to Telegram using the actual API
    const telegramResponse = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: formattedMessage,
      parse_mode: 'HTML'
    });

    // Save user message locally
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      name: name,
      msg: msg,
      user_id: user_id || 'anonymous',
      timestamp: new Date().toISOString(),
      telegram_message_id: telegramResponse.data.result.message_id
    };

    telegramMessages.push(userMessage);

    // Send confirmation back to user
    const botMessage = {
      id: Date.now() + 1,
      sender: 'bot',
      name: 'Telegram Bot',
      msg: `✅ Your message has been sent to Telegram! Message ID: ${telegramResponse.data.result.message_id}`,
      user_id: user_id || 'anonymous',
      timestamp: new Date().toISOString()
    };

    telegramMessages.push(botMessage);

    res.json({
      success: true,
      data: {
        msg: botMessage.msg
      },
      message: botMessage.msg,
      telegram_message_id: telegramResponse.data.result.message_id
    });

  } catch (error) {
    console.error("Telegram API error:", error.response?.data || error.message);
    
    // Fallback response if Telegram API fails
    const errorMessage = {
      id: Date.now() + 1,
      sender: 'bot',
      name: 'System',
      msg: "Message sent to Telegram API (simulated response)",
      user_id: user_id || 'anonymous',
      timestamp: new Date().toISOString()
    };

    telegramMessages.push(errorMessage);

    res.json({
      success: true,
      data: {
        msg: errorMessage.msg
      },
      message: errorMessage.msg
    });
  }
});

// ✅ Get Telegram messages for a user
app.get("/api/telegram/messages", (req, res) => {
  const { user_id } = req.query;
  
  let userMessages;
  if (user_id) {
    userMessages = telegramMessages.filter(msg => msg.user_id === user_id);
  } else {
    userMessages = telegramMessages.filter(msg => msg.user_id === 'anonymous');
  }

  res.json({
    success: true,
    messages: userMessages
  });
});

// ✅ Get updates from Telegram bot (webhook alternative)
app.get("/api/telegram/updates", async (req, res) => {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getUpdates`);
    res.json({
      success: true,
      updates: response.data.result
    });
  } catch (error) {
    console.error("Error getting Telegram updates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get Telegram updates"
    });
  }
});

// ✅ Get bot info
app.get("/api/telegram/botinfo", async (req, res) => {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`);
    res.json({
      success: true,
      bot: response.data.result
    });
  } catch (error) {
    console.error("Error getting bot info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bot info"
    });
  }
});

// ✅ Sync Telegram messages
app.post("/api/telegram/messages/sync", (req, res) => {
  const { user_id, messages } = req.body;

  if (!user_id || !messages) {
    return res.status(400).json({
      success: false,
      message: "User ID and messages are required"
    });
  }

  // Remove existing messages for this user
  telegramMessages = telegramMessages.filter(msg => msg.user_id !== user_id);
  
  // Add new messages
  telegramMessages.push(...messages);

  res.json({
    success: true,
    message: "Messages synced successfully",
    synced_count: messages.length
  });
});

// ✅ Delete a specific Telegram message
app.delete("/api/telegram/messages/:id", (req, res) => {
  const { id } = req.params;
  
  const messageIndex = telegramMessages.findIndex(msg => msg.id == id);
  
  if (messageIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Message not found"
    });
  }

  telegramMessages.splice(messageIndex, 1);
  
  res.json({
    success: true,
    message: "Message deleted successfully"
  });
});

// ✅ Delete all Telegram messages for a user
app.delete("/api/telegram/messages", (req, res) => {
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  const initialLength = telegramMessages.length;
  telegramMessages = telegramMessages.filter(msg => msg.user_id !== user_id);
  const deletedCount = initialLength - telegramMessages.length;

  res.json({
    success: true,
    message: `Deleted ${deletedCount} messages`,
    deleted_count: deletedCount
  });
});

// ---------------- Cron Job / Reminders ---------------- //

// ✅ Cron job: runs every minute to check reminders
cron.schedule("* * * * *", () => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  reminders.forEach(reminder => {
    if (!reminder.triggered && reminder.date === currentDate && reminder.time === currentTime) {
      console.log(`⏰ Reminder triggered for ${reminder.name}: ${reminder.reason}`);
      reminder.triggered = true;
      
      // Send reminder to Telegram
      const reminderMessage = `⏰ REMINDER\n👤 For: ${reminder.name}\n📝 Reason: ${reminder.reason}\n⏰ Time: ${reminder.time}\n📅 Date: ${reminder.date}`;
      
      axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
        chat_id: CHAT_ID,
        text: reminderMessage,
        parse_mode: 'HTML'
      }).catch(err => {
        console.error("Failed to send reminder to Telegram:", err.message);
      });
    }
  });
});

// ---------------- Health Check ---------------- //

app.get("/api/health", async (req, res) => {
  try {
    // Test Telegram API connection
    const botInfo = await axios.get(`${TELEGRAM_API_URL}/getMe`);
    
    res.json({
      success: true,
      message: "Nexus Backend is running successfully",
      timestamp: new Date().toISOString(),
      telegram: {
        connected: true,
        bot_name: botInfo.data.result.first_name,
        bot_username: botInfo.data.result.username
      },
      stats: {
        chat_messages: chatHistory.length,
        reminders: reminders.length,
        telegram_messages: telegramMessages.length
      }
    });
  } catch (error) {
    res.json({
      success: true,
      message: "Nexus Backend is running (Telegram API not connected)",
      timestamp: new Date().toISOString(),
      telegram: {
        connected: false,
        error: error.message
      },
      stats: {
        chat_messages: chatHistory.length,
        reminders: reminders.length,
        telegram_messages: telegramMessages.length
      }
    });
  }
});

// ---------------- Error Handling ---------------- //

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Nexus Backend Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Telegram Bot Token: ${BOT_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`💬 Telegram Chat ID: ${CHAT_ID ? '✅ Configured' : '❌ Missing'}`);
});