const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const twilio = require("twilio");
const hospitalData = require("./hospitalData.json"); 
const axios = require("axios");  // <--- Add this line!
const fs = require("fs");
const pdfParse = require("pdf-parse");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Gemini key from env (SECURE)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;


app.use(cors({
  origin: "https://your-frontend-name.vercel.app", // change this
  credentials: true
}));
app.use(express.json());


// Load and parse PDF text at server start
let collegeData = "";
(async () => {
  try {
    const dataBuffer = fs.readFileSync("./pdf/clg_info.pdf"); // Correct PDF filename here
    const data = await pdfParse(dataBuffer);
    collegeData = data.text;
    console.log("📘 College PDF content loaded");
  } catch (err) {
    console.error("❌ Failed to load College PDF:", err);
  }
})();




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
    }
  }
  // fallback: try to find partial match
  for (const qa of hospitalData) {
    if (question.includes(qa.question.toLowerCase().slice(0, 10))) {
      return qa.answer;
    }
  }
  return "Sorry, I don't have an answer for that question.";
}

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



// Your main college Q/A endpoint using Gemini API
app.post("/college-ask", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "No question provided" });

  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Use the following college document to answer this question:\n\n${collegeData}\n\nUser asked: ${query}`,
            },
          ],
        },
      ],
    });

    const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, no answer.";
    res.json({ answer });
  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get answer from Gemini" });
  }
});



app.listen(PORT, () => console.log(`Reminder API running on port ${PORT}`));


