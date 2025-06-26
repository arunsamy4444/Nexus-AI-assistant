import React, { useState, useEffect, useRef } from "react";

const CollegeAsk = () => {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.warn("Speech recognition not supported");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
      setListening(false);
      recognition.stop();
      submitQuery(speechToText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setListening(false);
      recognition.stop();
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find((v) =>
      v.name.toLowerCase().includes("zira") ||
      v.name.toLowerCase().includes("female") ||
      v.name.toLowerCase().includes("susan")
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      setListening(true);
      setAnswer("");
      recognitionRef.current.start();
    }
  };

  const submitQuery = async (text) => {
    if (!text.trim()) return;

    try {
const res = await fetch(`${process.env.REACT_APP_BASE_URL}/college-ask`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      const ans = data.answer || "Sorry, no answer found.";
      setAnswer(ans);
      speak(ans);
    } catch (err) {
      console.error(err);
      const errorMsg = "Sorry, there was an error fetching the answer.";
      setAnswer(errorMsg);
      speak(errorMsg);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitQuery(query);
  };

  return (
    <>
      <style>{`
        .college-container {
          max-width: 700px;
          margin: 40px auto;
          padding: 32px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(16px);
          color: #f1f5f9;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
          animation: zoomFade 0.5s ease-in-out;
        }

        h2 {
          margin-bottom: 10px;
          font-size: 1.9rem;
          text-align: center;
          font-weight: 700;
          color: #fff;
        }

        .instructions {
          text-align: center;
          color: #cbd5e1;
          font-style: italic;
          font-size: 0.95rem;
          margin-bottom: 20px;
        }

        textarea {
          width: 100%;
          font-size: 1rem;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.6);
          color: #1f2937;
          margin-bottom: 16px;
        }

        textarea:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
        }

        .btn-group {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .ask-btn,
        .speak-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 14px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.25s ease;
          color: white;
        }

        .ask-btn {
          background: linear-gradient(90deg, #22c55e, #10b981);
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);
        }

        .ask-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
        }

        .speak-btn {
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .speak-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
        }

        .speak-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .response-box {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 20px;
          min-height: 100px;
          color: #e2e8f0;
        }

        .response-box h3 {
          margin-bottom: 8px;
        }

        @keyframes zoomFade {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 640px) {
          .college-container {
            padding: 20px;
            margin: 1rem;
          }
        }
      `}</style>

      <div className="college-container">
        <h2>🎓 Ask About Your College</h2>

        <div className="instructions">
          Try asking: <br />
          <em>"What are the library timings?"</em>, <em>"Who is the head of CSE?"</em>, <em>"How to apply for scholarships?"</em>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            placeholder="Type or speak your college question..."
          />
          <div className="btn-group">
            <button type="submit" className="ask-btn">✅ Ask</button>
            <button
              type="button"
              onClick={startListening}
              disabled={listening}
              className="speak-btn"
            >
              {listening ? "🎙️ Listening..." : "🎤 Speak"}
            </button>
          </div>
        </form>

        <div className="response-box">
          <h3>🧠 Answer:</h3>
          <p>{answer}</p>
        </div>
      </div>
    </>
  );
};

export default CollegeAsk;
