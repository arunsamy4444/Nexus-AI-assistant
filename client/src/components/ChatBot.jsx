import React, { useState } from "react";
import SpeechToText from "./SpeechToText";
import "./ChatBot.css";

export default function ChatBot({ onResponse, onSpeech }) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  const queryGemini = async () => {
    const text = inputText.trim();
    if (!text) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/gemini-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      const data = await response.json();
      const result = data?.answer;
      setAnswer(result || "No response from Gemini.");
      onResponse(result || "No response from Gemini.");
    } catch (err) {
      console.error("Gemini Chat error:", err);
      setAnswer("Error fetching from server.");
      onResponse("Error fetching from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    queryGemini();
  };

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-input-area">
        <input
          type="text"
          value={inputText}
          placeholder="Ask me anything..."
          onChange={(e) => setInputText(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>

      <SpeechToText onResult={(text) => {
        setInputText(text);
        onSpeech(text);
      }} lang="en-US" />

      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p className="loader-text">Getting answer...</p>
        </div>
      )}

      {answer && (
        <div className="chatbot-answer">
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}



// import React, { useEffect, useState } from "react";
// import SpeechToText from "./SpeechToText";
// import "./ChatBot.css";

// export default function ChatBot({ inputText, onResponse, onSpeech }) {
//   const [loading, setLoading] = useState(false);

//   const queryGemini = async (text) => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${process.env.REACT_APP_BASE_URL}/gemini-chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ query: text }),
//       });

//       const data = await response.json();
//       const result = data?.answer;
//       onResponse(result || "No response from Gemini.");
//     } catch (err) {
//       console.error("Gemini Chat error:", err);
//       onResponse("Error fetching from server.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (inputText?.trim()) {
//       queryGemini(inputText);
//     }
//   }, [inputText]);

//   return (
//     <>
//       <SpeechToText onResult={onSpeech} lang="en-US" />

//       {loading && (
//         <div className="loader-container">
//           <div className="spinner"></div>
//           <p className="loader-text">Getting answer...</p>
//         </div>
//       )}
//     </>
//   );
// }
