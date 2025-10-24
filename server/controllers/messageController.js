// controllers/messageController.js
const axios = require("axios");
const { createMessage } = require("../models/messageModel");

const sendMessage = async (req, res) => {
  try {
    const { name, msg } = req.body;
    if (!msg) return res.status(400).json({ success: false, error: "Message is required" });

    const messageObj = createMessage(name, msg);

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // Send message to Telegram
    await axios.post(url, {
      chat_id: chatId,
      text: `Name: ${messageObj.name}\nMessage: ${messageObj.msg}`,
    });

    res.status(200).json({ success: true, data: messageObj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendMessage };
