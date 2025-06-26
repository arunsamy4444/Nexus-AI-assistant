import { useState, useEffect, useRef } from "react";
import SpeechToText from "./components/SpeechToText";
import ChatBot from "./components/ChatBot";
import ReminderForm from "./components/ReminderForm";
import HospitalQA from "./components/HospitalQA";
import VoiceCommandListener from "./components/VoiceCommandListener";
import VoiceReminderScheduler from "./components/VoiceReminderScheduler";
import CollegeAsk from "./components/CollegeAsk";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [lang, setLang] = useState("en-US");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("qna");
  const speechRef = useRef(null);

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      speechRef.current = utterance;

      const voices = window.speechSynthesis.getVoices();
      const voiceMatch = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));

      const femaleVoice =
        voices.find(
          (v) =>
            v.lang.startsWith(lang.split("-")[0]) &&
            /female|woman|zira|susan/i.test(v.name)
        ) || voiceMatch;

      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakNow();
    } else {
      speakNow();
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSpeechResult = (text) => {
    setQuery(text);
  };

  const handleAnswer = (res) => {
    const english = typeof res === "string" ? res : res.english;
    const tamil = typeof res === "object" && res.tamil;

    setAnswer(english);
    speak(tamil || english);
  };

  const handleReminderSubmit = async (formData) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/set-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to set reminder");
      alert("Reminder set successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to set reminder.");
    }
  };

 const handleVoiceCommand = (command) => {
  const normalized = command.toLowerCase();
  console.log("🎙️ Voice command received:", command);

  if ((normalized.includes("chatbot") || normalized.includes("gemini")) && activeTab !== "qna") {
    setActiveTab("qna");
    speak("Feature switched to chatbot");
  } else if (normalized.includes("hospital") && activeTab !== "hospital") {
    setActiveTab("hospital");
    speak("Feature switched to hospital");
  } else if (normalized.includes("reminder") && activeTab !== "reminder") {
    setActiveTab("reminder");
    speak("Feature switched to reminder");
  } else if ((normalized.includes("college") || normalized.includes("college question")) && activeTab !== "college") {
    setActiveTab("college");
    speak("Feature switched to college question and answer");
  } else if ((normalized.includes("information") || normalized.includes("info")) && activeTab !== "info") {
    setActiveTab("info");
    speak("Feature switched to information mode. What question do you want to ask, boss?");
  } else if (
    normalized.includes("chatbot") ||
    normalized.includes("hospital") ||
    normalized.includes("reminder") ||
    normalized.includes("college") ||
    normalized.includes("info")
  ) {
    console.log("🚫 Tab already active. Skip speaking.");
  } else {
    speak("Sorry, I didn't understand the command.");
  }
};

  return (
    <div className="container">
      <h1>Nexus AI Voice Assistant</h1>
      <p>Say “Nexus” then a command: chatbot, hospital, reminder, etc.</p>

      <VoiceCommandListener onCommandDetected={handleVoiceCommand} />

      <div className="mobile-nav-toggle">
        <button className="hamburger-toggle" onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
          ☰
        </button>
      </div>

      <nav className={`nav ${isMobileNavOpen ? "open" : "closed"}`}>
        <button className={activeTab === "qna" ? "active" : ""} onClick={() => setActiveTab("qna")}>🤖 Q&A Chatbot</button>
        <button className={activeTab === "hospital" ? "active" : ""} onClick={() => setActiveTab("hospital")}>🏥 Hospital Q&A</button>
        <button className={activeTab === "reminder" ? "active" : ""} onClick={() => setActiveTab("reminder")}>📅 Set Reminder</button>
        <button className={activeTab === "voiceReminder" ? "active" : ""} onClick={() => setActiveTab("voiceReminder")}>🎙️ Voice Reminder</button>
        <button className={activeTab === "college" ? "active" : ""} onClick={() => setActiveTab("college")}>🎓 College Q&A</button>
      </nav>

      <div className="intro">
        <h2>NEXUS AI: Your English Voice Assistant</h2>
        // <p>🎙️ Speak in English to get answers instantly.</p>
        <p>📢 Get voice responses, translated text, and set smart reminders!</p>
      </div>

      {activeTab === "qna" && (
        <div className="chatbot-section">
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask something..."
              style={{ flex: 1, padding: 8 }}
            />
       <button
  onClick={() => {
    setAnswer(""); // reset answer first
    if (query.trim()) {
      handleAnswer(""); // clear response state
      setTimeout(() => {
        document.getElementById("trigger-bot")?.click(); // manually trigger Gemini from ChatBot
      }, 100);
    }
  }}
>
              Send
            </button>
            <button
              style={{ backgroundColor: "red", color: "white", padding: "8px" }}
              onClick={stopSpeaking}
            >
              🚓 Stop
            </button>
          </div>

          <ChatBot inputText={query} onResponse={handleAnswer} onSpeech={handleSpeechResult} />
          <button id="trigger-bot" style={{ display: "none" }} />

          <div style={{ marginTop: 20 }}>
            <strong>Answer:</strong>
            <p>{answer}</p>
          </div>
        </div>
      )}

      {activeTab === "hospital" && <div className="hospital-section"><HospitalQA lang={lang} /></div>}
      {activeTab === "reminder" && <div className="reminder-section"><ReminderForm onSubmit={handleReminderSubmit} /></div>}
      {activeTab === "voiceReminder" && <div className="voice-reminder-section"><VoiceReminderScheduler /></div>}
      {activeTab === "college" && <div className="college-section"><CollegeAsk /></div>}

     
    </div>
  );
}

