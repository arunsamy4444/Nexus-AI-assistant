const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const messageRoutes = require("./routes/messageRoutes");
const cron = require("node-cron");
const axios = require("axios");

dotenv.config();
const app = express();
<<<<<<< HEAD

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
=======
const PORT = process.env.PORT || 5000;

// ✅ Gemini key from env (SECURE)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

app.use(cors({
  origin: "https://nexus-ai-assistant-nine.vercel.app", // ✅ actual deployed frontend URL
  credentials: true
}));

app.use(express.json());
// Load and parse PDF text at server start
let collegeData = "";
(async () => {
>>>>>>> a3eab94dfb7207fe873bfe6de384c64e43175d9e
  try {
    const { message, userId } = req.body;

<<<<<<< HEAD
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: "Message is required" 
      });
=======
const reminders = []; // Use DB in production

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);


function findAnswer(question) {
  question = question.toLowerCase().trim();
  for (const qa of hospitalData) {
    if (qa.question.toLowerCase() === question) {
      return qa.answer;
>>>>>>> a3eab94dfb7207fe873bfe6de384c64e43175d9e
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

<<<<<<< HEAD
    res.json({
      success: true,
      message: aiResponse,
      content: aiResponse
    });

=======
app.post("/ask", (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "No question provided" });

  const answer = findAnswer(question);
  res.json({ answer });
});

app.post("/set-reminder", (req, res) => {
  const { phone, date, time, reason } = req.body;

  if (!phone || !date || !time || !reason) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  if (!phone.startsWith("+")) {
    return res.status(400).json({ success: false, message: "Phone number must start with country code e.g., +91" });
  }

  reminders.push({ phone, date, time, reason });
  res.json({ success: true, message: "Reminder set" });
});

// Run every minute
cron.schedule("* * * * *", () => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0]; // yyyy-mm-dd
  const currentTime = now.toTimeString().slice(0, 5);  // HH:MM (24h format)

  for (let i = reminders.length - 1; i >= 0; i--) {
    const reminder = reminders[i];
    if (reminder.date === currentDate && reminder.time === currentTime) {
      twilioClient.messages.create({
        body: `🔔 Reminder: ${reminder.reason}`,
        from: "whatsapp:+14155238886",   // Twilio WhatsApp sandbox number
        to: `whatsapp:${reminder.phone}` // Recipient's WhatsApp number in E.164 format
      })
      .then(() => {
        console.log(`WhatsApp reminder sent to ${reminder.phone}`);
        reminders.splice(i, 1); // Remove after sending
      })
      .catch((err) => console.error("Error sending WhatsApp message:", err));
    }
  }
});


// ✅ Gemini Chat Limit (Global: 5/day)
let geminiDailyUsageCount = 0;
let collegeDailyUsageCount = 0;

cron.schedule("0 0 * * *", () => {
  geminiDailyUsageCount = 0;
  collegeDailyUsageCount = 0;
  console.log("🔁 Daily API usage counters reset");
});

// ✅ API: Gemini Chat (5/day limit)
app.post("/gemini-chat", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "No question provided" });

  if (geminiDailyUsageCount >= 5) {
    return res.status(429).json({ error: "🚫 Daily Gemini API limit (5) reached. Try again tomorrow." });
  }

  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [
        {
          role: "user",
          parts: [{ text: query }]
        }
      ]
    });

    geminiDailyUsageCount++;

    const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no answer.";
    res.json({ answer });
  } catch (error) {
    console.error("Gemini Chat error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get answer from Gemini" });
  }
});

// ✅ College Ask endpoint (limit: 5/day)
app.post("/college-ask", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "No question provided" });

  if (!collegeData) {
    return res.status(500).json({ error: "College data not loaded" });
  }

  if (collegeDailyUsageCount >= 5) {
    return res.status(429).json({ error: "🚫 Daily College Ask limit (5) reached. Try again tomorrow." });
  }

  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a helpful assistant. Use the college document content to answer the following question.\n\nCollege Info:\n${collegeData}\n\nUser's Question: ${query}`
            }
          ]
        }
      ]
    });

    collegeDailyUsageCount++;

    const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no answer.";
    res.json({ answer });
>>>>>>> a3eab94dfb7207fe873bfe6de384c64e43175d9e
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

<<<<<<< HEAD
// Simple AI response generator (replace with actual AI service)
async function generateAIResponse(message) {
  const responses = {
    greeting: "Hello! I'm Nexus AI Assistant. How can I help you today?",
    help: "I can help you with information, answer questions, set reminders, and more. Just let me know what you need!",
    default: "I understand you're saying: \"" + message + "\". This is a simulated response. In production, I'd connect to a real AI service like OpenAI or another provider."
  };
=======

// app.post("/gemini-chat", async (req, res) => {
//   const { query } = req.body;
//   if (!query) return res.status(400).json({ error: "No question provided" });

//   try {
//     const response = await axios.post(GEMINI_API_URL, {
//       contents: [
//         {
//           role: "user",
//           parts: [
//             {
//               text: query
//             }
//           ]
//         }
//       ]
//     });

//     const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no answer.";
//     res.json({ answer });
//   } catch (error) {
//     console.error("Gemini Chat error:", error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to get answer from Gemini" });
//   }
// });

// app.post("/college-ask", async (req, res) => {
//   const { query } = req.body;
  // if (!query) return res.status(400).json({ error: "No question provided" });

  // if (!collegeData) {
  //   return res.status(500).json({ error: "College data not loaded" });
  // }

  // try {
  //   const response = await axios.post(GEMINI_API_URL, {
  //     contents: [
  //       {
  //         role: "user",
  //         parts: [
  //           {
  //             text: `You are a helpful assistant. Use the college document content to answer the following question.\n\nCollege Info:\n${collegeData}\n\nUser's Question: ${query}`
  //           }
  //         ]
  //       }
  //     ]
  //   });

  //   const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no answer.";
  //   res.json({ answer });
//   } catch (error) {
//     console.error("Gemini API error:", error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to get answer from Gemini" });
//   }
// });




app.listen(PORT, () => console.log(`Reminder API running on port ${PORT}`));
>>>>>>> a3eab94dfb7207fe873bfe6de384c64e43175d9e

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