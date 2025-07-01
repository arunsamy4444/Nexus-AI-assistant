import React, { useState } from "react";

export default function HospitalQA({ lang }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => setQuery(e.target.value);

  const speakText = (text) => {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "ta" ? "ta-IN" : "en-US";
    synth.cancel();
    synth.speak(utter);
  };

  const askQuestion = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      setAnswer(data.answer || "No answer available.");
      speakText(data.answer || "No answer available.");
    } catch (err) {
      const errMsg = "❌ Failed to get response from server.";
      setAnswer(errMsg);
      speakText(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") askQuestion();
  };

  return (
    <div className="hospital-qa-container">
      <h2>🏥 Hospital Q&A</h2>

      <input
        className="input-query"
        type="text"
        placeholder="Ask your medical question..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />

      <div className="action-buttons">
        <button 
          onClick={askQuestion} 
          disabled={loading || !query.trim()}
          className={loading ? "loading" : ""}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : "Ask Question"}
        </button>
      </div>

      {answer && (
        <div className="answer-box">
          <strong>Answer:</strong> {answer}
        </div>
      )}

      <style jsx>{`
        .hospital-qa-container {
          max-width: 720px;
          margin: 40px auto;
          padding: 30px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(18px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          font-family: "Inter", sans-serif;
        }

        .input-query {
          width: 100%;
          padding: 12px 16px;
          font-size: 1rem;
          border: 2px solid rgba(139, 92, 246, 0.25);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.9);
        }

        .action-buttons {
          margin-top: 16px;
        }

        .action-buttons button {
          padding: 10px 20px;
          font-size: 0.9rem;
          border: none;
          border-radius: 8px;
          color: white;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .action-buttons button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
        }

        .action-buttons button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .answer-box {
          margin-top: 20px;
          padding: 16px;
          background: rgba(236, 72, 153, 0.1);
          border-left: 4px solid #ec4899;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}



// import React, { useState } from "react";

// export default function HospitalQA({ lang }) {
//   const [query, setQuery] = useState("");
//   const [answer, setAnswer] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [listening, setListening] = useState(false);

//   const SpeechRecognition =
//     window.SpeechRecognition || window.webkitSpeechRecognition;
//   const recognition = SpeechRecognition ? new SpeechRecognition() : null;

//   if (recognition) {
//     recognition.lang = lang === "ta" ? "ta-IN" : "en-US";
//     recognition.continuous = false;
//     recognition.interimResults = false;

//     recognition.onresult = (event) => {
//       const transcript = event.results[0][0].transcript;
//       setQuery(transcript);
//     };

//     recognition.onend = () => {
//       setListening(false);
//       setTimeout(() => {
//         askQuestion();
//       }, 400);
//     };
//   }

//   const handleInputChange = (e) => setQuery(e.target.value);

//   const speakText = (text) => {
//     const synth = window.speechSynthesis;
//     const utter = new SpeechSynthesisUtterance(text);
//     utter.lang = lang === "ta" ? "ta-IN" : "en-US";
//     synth.cancel();
//     synth.speak(utter);
//   };

//   const askQuestion = async () => {
//     if (!query.trim()) return;

//     setLoading(true);
//     try {
// const res = await fetch(`${process.env.REACT_APP_BASE_URL}/ask`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: query }),
//       });
//       const data = await res.json();
//       setAnswer(data.answer || "No answer available.");
//       speakText(data.answer || "No answer available.");
//     } catch (err) {
//       const errMsg = "❌ Failed to get response from server.";
//       setAnswer(errMsg);
//       speakText(errMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const startListening = () => {
//     if (!recognition) {
//       alert("Speech recognition not supported.");
//       return;
//     }
//     setListening(true);
//     recognition.start();
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") askQuestion();
//   };

//   return (
//     <>
//       <style>{`
//         .hospital-qa-container {
//           max-width: 720px;
//           margin: 40px auto;
//           padding: 30px;
//           background: rgba(255, 255, 255, 0.15);
//           backdrop-filter: blur(18px);
//           border-radius: 20px;
//           border: 1px solid rgba(255, 255, 255, 0.2);
//           box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
//           animation: fadeUp 0.6s ease;
//           font-family: "Inter", sans-serif;
//           color: #1f2937;
//         }

//         .hospital-qa-container h2 {
//           font-size: 2rem;
//           font-weight: 700;
//           margin-bottom: 1.2rem;
//           color: #111827;
//         }

//         .input-query {
//           width: 100%;
//           padding: 14px 16px;
//           font-size: 1rem;
//           border: 2px solid rgba(139, 92, 246, 0.25);
//           border-radius: 16px;
//           transition: all 0.3s ease;
//           background: rgba(255, 255, 255, 0.9);
//         }

//         .input-query:focus {
//           outline: none;
//           border-color: #8b5cf6;
//           box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
//         }

//         .action-buttons {
//           display: flex;
//           gap: 12px;
//           margin-top: 16px;
//           flex-wrap: wrap;
//         }

//         .action-buttons button {
//           flex: 1;
//           min-width: 140px;
//           padding: 12px 18px;
//           font-size: 0.95rem;
//           font-weight: 600;
//           border: none;
//           border-radius: 16px;
//           color: #fff;
//           background: linear-gradient(135deg, #8b5cf6, #ec4899);
//           box-shadow: 0 6px 14px rgba(139, 92, 246, 0.3);
//           cursor: pointer;
//           transition: all 0.3s ease;
//         }

//         .action-buttons button:disabled {
//           background: rgba(139, 92, 246, 0.4);
//           cursor: not-allowed;
//           opacity: 0.7;
//         }

//         .action-buttons button:hover:not(:disabled) {
//           transform: scale(1.03);
//           box-shadow: 0 8px 18px rgba(236, 72, 153, 0.35);
//         }

//         .answer-box {
//           margin-top: 28px;
//           background: rgba(236, 72, 153, 0.1);
//           border-left: 4px solid #ec4899;
//           padding: 20px;
//           border-radius: 16px;
//           font-size: 1rem;
//           color: #1f2937;
//           animation: fadeSlide 0.4s ease;
//         }

//         .answer-box strong {
//           color: #8b5cf6;
//           display: block;
//           margin-bottom: 6px;
//         }

//         @keyframes fadeUp {
//           0% { opacity: 0; transform: translateY(25px) scale(0.96); }
//           100% { opacity: 1; transform: translateY(0) scale(1); }
//         }

//         @keyframes fadeSlide {
//           0% { opacity: 0; transform: translateY(15px); }
//           100% { opacity: 1; transform: translateY(0); }
//         }

//         @media (max-width: 640px) {
//           .action-buttons {
//             flex-direction: column;
//           }
//         }
//       `}</style>

//       <div className="hospital-qa-container">
//         <h2>🏥 Hospital Q&A</h2>

//         <input
//           className="input-query"
//           type="text"
//           placeholder="Ask your medical question..."
//           value={query}
//           onChange={handleInputChange}
//           onKeyDown={handleKeyDown}
//         />

//         <div className="action-buttons">
//           <button onClick={askQuestion} disabled={loading || !query.trim()}>
//             {loading ? "Asking..." : "Ask"}
//           </button>
//           <button onClick={startListening} disabled={listening}>
//             🎤 {listening ? "Listening..." : "Speak"}
//           </button>
//         </div>

//         {answer && (
//           <div className="answer-box">
//             <strong>🧠 Answer:</strong> {answer}
//           </div>
//         )}
//       </div>
//     </>
//   );
// }
