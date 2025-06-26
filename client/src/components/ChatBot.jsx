import React, { useEffect, useState } from "react";
import SpeechToText from "./SpeechToText";
import "./ChatBot.css";

export default function ChatBot({ inputText, onResponse, onSpeech }) {
  const [loading, setLoading] = useState(false);

  const GEMINI_API_KEY = "AIzaSyDeoiV5qIDYoRGOB4bVG4JDKi0GVInxpNg";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const queryGemini = async (text) => {
    setLoading(true);

    try {
      const body = {
        model: "gemini-1.5-flash",
        prompt: {
          messages: [
            {
              content: { text },
              author: "user"
            }
          ]
        }
      };

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      onResponse(result || "No response from Gemini.");
    } catch (err) {
      console.error("Gemini API Error:", err);
      onResponse("Error fetching from Gemini.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inputText?.trim()) {
      queryGemini(inputText);
    }
  }, [inputText]);

  return (
    <>
      <SpeechToText onResult={onSpeech} lang="en-US" />

      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p className="loader-text">Getting answer...</p>
        </div>
      )}
    </>
  );
}



// import React, { useEffect, useState } from "react";
// import SpeechToText from "./SpeechToText";
// import "./ChatBot.css";

// export default function ChatBot({ inputText, onResponse, onSpeech }) {
//   const [loading, setLoading] = useState(false);

//   const GEMINI_API_KEY = "AIzaSyDeoiV5qIDYoRGOB4bVG4JDKi0GVInxpNg";
//   const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

//   const queryGemini = async (text) => {
//     setLoading(true);
//     try {
//       const response = await fetch(GEMINI_API_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text }] }],
//         }),
//       });

//       const data = await response.json();
//       const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//       onResponse(result || "No response from Gemini.");
//     } catch (err) {
//       console.error("Gemini API Error:", err);
//       onResponse("Error fetching from Gemini.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (inputText?.trim()) queryGemini(inputText);
//   }, [inputText]);

//   return (
//     <>
//       {/* 🎤 Voice input here */}
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

