import { useState, useEffect, useRef } from "react";
import ChatBot from "./components/ChatBot";
import ReminderForm from "./components/ReminderForm";
import HospitalQA from "./components/HospitalQA";
import VoiceCommandListener from "./components/VoiceCommandListener";
import VoiceReminderScheduler from "./components/VoiceReminderScheduler";
import CollegeAsk from "./components/CollegeAsk";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [lang, setLang] = useState("en-US");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("qna");
  const speechRef = useRef(null);
  const [introSpoken, setIntroSpoken] = useState(false); // ✅ Move this above
  const [isListening, setIsListening] = useState(false); // Track voice command listening state
  const voiceListenerRef = useRef(null);

const speakIntro = () => {
  if (introSpoken) return;
  
  const welcomeMessage = 
    "Hi, I'm Nexus – your AI voice assistant. " +
    "You're currently in the chatbot tab where you can ask me anything. " +
    "To switch features, say 'Nexus' followed by commands like 'hospital', 'reminder', or 'college'.";
  
  speak(welcomeMessage);
  setIntroSpoken(true);
};

  useEffect(() => {
    const handleClickOnce = () => {
      speakIntro();
      window.removeEventListener("click", handleClickOnce);
    };

    window.addEventListener("click", handleClickOnce);

    return () => {
      window.removeEventListener("click", handleClickOnce);
    };
  }, [introSpoken]); // ✅ Now 'introSpoken' is already defined

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      speechRef.current = utterance;

      const voices = window.speechSynthesis.getVoices();
      const voiceMatch = voices.find((v) =>
        v.lang.startsWith(lang.split("-")[0])
      );

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
      const res = await fetch(
        `${process.env.REACT_APP_BASE_URL}/set-reminder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

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

    if (
      (normalized.includes("chatbot") || normalized.includes("gemini")) &&
      activeTab !== "qna"
    ) {
      setActiveTab("qna");
      speak("Feature switched to chatbot");
    } else if (normalized.includes("hospital") && activeTab !== "hospital") {
      setActiveTab("hospital");
      speak("Feature switched to hospital");
    } else if (normalized.includes("reminder") && activeTab !== "reminder") {
      setActiveTab("reminder");
      speak("Feature switched to reminder");
    } else if (
      (normalized.includes("college") ||
        normalized.includes("college question")) &&
      activeTab !== "college"
    ) {
      setActiveTab("college");
      speak("Feature switched to college question and answer");
    } else if (
      (normalized.includes("information") || normalized.includes("info")) &&
      activeTab !== "info"
    ) {
      setActiveTab("info");
      speak(
        "Feature switched to information mode. What question do you want to ask, boss?"
      );
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

    const toggleVoiceCommands = () => {
    const newListeningState = !isListening;
    setIsListening(newListeningState);
    
    if (newListeningState) {
      speak("Voice commands enabled");
    } else {
      speak("Voice commands disabled");
      // This will trigger the cleanup in the VoiceCommandListener
      if (voiceListenerRef.current) {
        voiceListenerRef.current.stopListening();
      }
    }
  };

useEffect(() => {
  if (activeTab === "qna") {
    const toastTimer = setTimeout(() => {
    toast.info(
      <div style={{
        padding: '1rem',
        fontFamily: '"Inter", sans-serif',
      }}>
        <p style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1rem',
          fontWeight: '600',
          background: 'linear-gradient(to right, var(--primary), var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>🚀 Performance Notice</p>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '0.75rem',
          borderRadius: '12px',
          margin: '0.5rem 0',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.9rem',
            color: 'var(--text-dark)',
            lineHeight: '1.5'
          }}>
            This demo runs on free-tier services which may be slow or have limited availability.
            For better experience:
          </p>
          
          <ul style={{
            paddingLeft: '1.25rem',
            margin: '0 0 0.75rem 0',
            listStyleType: 'none'
          }}>
            <li style={{ marginBottom: '0.5rem', position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '-1.25rem',
                color: 'var(--accent)',
                fontWeight: 'bold'
              }}>•</span>
              Watch the full demo video
            </li>
            <li style={{ marginBottom: '0.5rem', position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '-1.25rem',
                color: 'var(--accent)',
                fontWeight: 'bold'
              }}>•</span>
              Contact me for localhost screen sharing
            </li>
            <li style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '-1.25rem',
                color: 'var(--accent)',
                fontWeight: 'bold'
              }}>•</span>
              Visit my portfolio for more projects
            </li>
          </ul>
          
          <a 
            href="https://arunsamy.vercel.app/" 
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)',
              marginTop: '0.25rem',
              width: '100%',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.3)';
            }}
          >
            arunsamy.vercel.app
          </a>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 15000,  // Increased duration
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          padding: '0',
          overflow: 'hidden',
          animation: 'fadeSlideUp 0.7s ease-in-out',
          maxWidth: '380px'  // Better for the additional content
        },
        bodyStyle: {
          padding: '0'
        }
      }
    );
     }, 6000); // ⏳ 6 seconds delay
      return () => clearTimeout(toastTimer); // Cleanup if component unmounts or tab changes quickly
  }
}, [activeTab]);





  return (
    
    <div className="container">
      <h1>Nexus AI Voice Assistant</h1>
      <p>Say “Nexus” then a command: chatbot, hospital, reminder, etc.</p>

        {/* <div className="voice-controls">
        <button 
          onClick={toggleVoiceCommands}
          style={{
            backgroundColor: isListening ? 'red' : '#4CAF50',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            margin: '10px 0'
          }}
        >
          {isListening ? 'Stop Voice Commands' : 'Enable Voice Commands'}
        </button> */}
        <VoiceCommandListener 
          onCommandDetected={handleVoiceCommand}
          isListening={isListening}
          ref={voiceListenerRef}
        />
      {/* </div> */}


      <div className="mobile-nav-toggle">
        <button
          className="hamburger-toggle"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
        >
          ☰
        </button>
      </div>

      <nav className={`nav ${isMobileNavOpen ? "open" : "closed"}`}>
        <button
          className={activeTab === "qna" ? "active" : ""}
          onClick={() => setActiveTab("qna")}
        >
          🤖 Q&A Chatbot
        </button>
        <button
          className={activeTab === "hospital" ? "active" : ""}
          onClick={() => setActiveTab("hospital")}
        >
          🏥 Hospital Q&A
        </button>
        <button
          className={activeTab === "reminder" ? "active" : ""}
          onClick={() => setActiveTab("reminder")}
        >
          📅 Set Reminder
        </button>
        <button
          className={activeTab === "voiceReminder" ? "active" : ""}
          onClick={() => setActiveTab("voiceReminder")}
        >
          🎙️ Voice Reminder
        </button>
        <button
          className={activeTab === "college" ? "active" : ""}
          onClick={() => setActiveTab("college")}
        >
          🎓 College Q&A
        </button>
      </nav>

      <div className="intro">
        <h2>NEXUS AI: Your English Voice Assistant</h2>

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

          <ChatBot
            inputText={query}
            onResponse={handleAnswer}
            onSpeech={handleSpeechResult}
          />
          <button id="trigger-bot" style={{ display: "none" }} />

          <div style={{ marginTop: 20 }}>
            <strong>Answer:</strong>
            <p>{answer}</p>
          </div>
        </div>
      )}

      {activeTab === "hospital" && (
        <div className="hospital-section">
          <HospitalQA lang={lang} />
        </div>
      )}
      {activeTab === "reminder" && (
        <div className="reminder-section">
          <ReminderForm onSubmit={handleReminderSubmit} />
        </div>
      )}
      {activeTab === "voiceReminder" && (
        <div className="voice-reminder-section">
          <VoiceReminderScheduler />
        </div>
      )}
      {activeTab === "college" && (
        <div className="college-section">
          <CollegeAsk />
        </div>
      )}

       {/* ✅ ToastContainer goes here — below everything */}
    <ToastContainer
      position="top-right"
      autoClose={10000}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
    </div>
  );
}


// import { useState, useEffect, useRef } from "react";
// import SpeechToText from "./components/SpeechToText";
// import ChatBot from "./components/ChatBot";
// import ReminderForm from "./components/ReminderForm";
// import HospitalQA from "./components/HospitalQA";
// import VoiceCommandListener from "./components/VoiceCommandListener";
// import VoiceReminderScheduler from "./components/VoiceReminderScheduler";
// import CollegeAsk from "./components/CollegeAsk";
// import "./App.css";

// export default function App() {
//   const [query, setQuery] = useState("");
//   const [answer, setAnswer] = useState("");
//   const [lang, setLang] = useState("en-US");
//   const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState("qna");
//   const speechRef = useRef(null);
//     const [introSpoken, setIntroSpoken] = useState(false); // ✅ Move this above

//   const speakIntro = () => {  // ✅ Move this above
//     if (introSpoken) return;
//     speak("Hi, I'm Nexus – your AI voice assistant.");
//     setIntroSpoken(true);
//   };

//   useEffect(() => {
//     const handleClickOnce = () => {
//       speakIntro();
//       window.removeEventListener("click", handleClickOnce);
//     };

//     window.addEventListener("click", handleClickOnce);

//     return () => {
//       window.removeEventListener("click", handleClickOnce);
//     };
//   }, [introSpoken]); // ✅ Now 'introSpoken' is already defined

//   const speak = (text) => {
//     if (!window.speechSynthesis || !text) return;

//     const speakNow = () => {
//       const utterance = new SpeechSynthesisUtterance(text);
//       speechRef.current = utterance;

//       const voices = window.speechSynthesis.getVoices();
//       const voiceMatch = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));

//       const femaleVoice =
//         voices.find(
//           (v) =>
//             v.lang.startsWith(lang.split("-")[0]) &&
//             /female|woman|zira|susan/i.test(v.name)
//         ) || voiceMatch;

//       if (femaleVoice) utterance.voice = femaleVoice;
//       utterance.lang = lang;
//       window.speechSynthesis.speak(utterance);
//     };

//     if (window.speechSynthesis.getVoices().length === 0) {
//       window.speechSynthesis.onvoiceschanged = () => speakNow();
//     } else {
//       speakNow();
//     }
//   };

//   const stopSpeaking = () => {
//     if (window.speechSynthesis && window.speechSynthesis.speaking) {
//       window.speechSynthesis.cancel();
//     }
//   };

//   const handleSpeechResult = (text) => {
//     setQuery(text);
//   };

//   const handleAnswer = (res) => {
//     const english = typeof res === "string" ? res : res.english;
//     const tamil = typeof res === "object" && res.tamil;

//     setAnswer(english);
//     speak(tamil || english);
//   };

//   const handleReminderSubmit = async (formData) => {
//     try {
//       const res = await fetch(`${process.env.REACT_APP_BASE_URL}/set-reminder`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//       });

//       if (!res.ok) throw new Error("Failed to set reminder");
//       alert("Reminder set successfully!");
//     } catch (err) {
//       console.error(err);
//       alert("Failed to set reminder.");
//     }
//   };

//  const handleVoiceCommand = (command) => {
//   const normalized = command.toLowerCase();
//   console.log("🎙️ Voice command received:", command);

//   if ((normalized.includes("chatbot") || normalized.includes("gemini")) && activeTab !== "qna") {
//     setActiveTab("qna");
//     speak("Feature switched to chatbot");
//   } else if (normalized.includes("hospital") && activeTab !== "hospital") {
//     setActiveTab("hospital");
//     speak("Feature switched to hospital");
//   } else if (normalized.includes("reminder") && activeTab !== "reminder") {
//     setActiveTab("reminder");
//     speak("Feature switched to reminder");
//   } else if ((normalized.includes("college") || normalized.includes("college question")) && activeTab !== "college") {
//     setActiveTab("college");
//     speak("Feature switched to college question and answer");
//   } else if ((normalized.includes("information") || normalized.includes("info")) && activeTab !== "info") {
//     setActiveTab("info");
//     speak("Feature switched to information mode. What question do you want to ask, boss?");
//   } else if (
//     normalized.includes("chatbot") ||
//     normalized.includes("hospital") ||
//     normalized.includes("reminder") ||
//     normalized.includes("college") ||
//     normalized.includes("info")
//   ) {
//     console.log("🚫 Tab already active. Skip speaking.");
//   } else {
//     speak("Sorry, I didn't understand the command.");
//   }
// };



//   return (
//     <div className="container">
//       <h1>Nexus AI Voice Assistant</h1>
//       <p>Say “Nexus” then a command: chatbot, hospital, reminder, etc.</p>

//       <VoiceCommandListener onCommandDetected={handleVoiceCommand} />

//       <div className="mobile-nav-toggle">
//         <button className="hamburger-toggle" onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
//           ☰
//         </button>
//       </div>

//       <nav className={`nav ${isMobileNavOpen ? "open" : "closed"}`}>
//         <button className={activeTab === "qna" ? "active" : ""} onClick={() => setActiveTab("qna")}>🤖 Q&A Chatbot</button>
//         <button className={activeTab === "hospital" ? "active" : ""} onClick={() => setActiveTab("hospital")}>🏥 Hospital Q&A</button>
//         <button className={activeTab === "reminder" ? "active" : ""} onClick={() => setActiveTab("reminder")}>📅 Set Reminder</button>
//         <button className={activeTab === "voiceReminder" ? "active" : ""} onClick={() => setActiveTab("voiceReminder")}>🎙️ Voice Reminder</button>
//         <button className={activeTab === "college" ? "active" : ""} onClick={() => setActiveTab("college")}>🎓 College Q&A</button>
//       </nav>

//       <div className="intro">
//         <h2>NEXUS AI: Your English Voice Assistant</h2>

//         <p>📢 Get voice responses, translated text, and set smart reminders!</p>
//       </div>

//       {activeTab === "qna" && (
//         <div className="chatbot-section">
//           <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
//             <input
//               type="text"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Ask something..."
//               style={{ flex: 1, padding: 8 }}
//             />
//        <button
//   onClick={() => {
//     setAnswer(""); // reset answer first
//     if (query.trim()) {
//       handleAnswer(""); // clear response state
//       setTimeout(() => {
//         document.getElementById("trigger-bot")?.click(); // manually trigger Gemini from ChatBot
//       }, 100);
//     }
//   }}
// >
//               Send
//             </button>
//             <button
//               style={{ backgroundColor: "red", color: "white", padding: "8px" }}
//               onClick={stopSpeaking}
//             >
//               🚓 Stop
//             </button>
//           </div>

//           <ChatBot inputText={query} onResponse={handleAnswer} onSpeech={handleSpeechResult} />
//           <button id="trigger-bot" style={{ display: "none" }} />

//           <div style={{ marginTop: 20 }}>
//             <strong>Answer:</strong>
//             <p>{answer}</p>
//           </div>
//         </div>
//       )}

//       {activeTab === "hospital" && <div className="hospital-section"><HospitalQA lang={lang} /></div>}
//       {activeTab === "reminder" && <div className="reminder-section"><ReminderForm onSubmit={handleReminderSubmit} /></div>}
//       {activeTab === "voiceReminder" && <div className="voice-reminder-section"><VoiceReminderScheduler /></div>}
//       {activeTab === "college" && <div className="college-section"><CollegeAsk /></div>}

     
//     </div>
//   );
// }

