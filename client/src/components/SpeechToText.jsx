import React from "react";

export default function SpeechToText({ onResult }) {
  return null;
}


// import React from "react";

// export default function SpeechToText({ onResult }) {
//   const startListening = () => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     const recognition = new SpeechRecognition();

//     recognition.lang = "en-US";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     recognition.onresult = (e) => {
//       const text = e.results[0][0].transcript;
//       onResult(text);
//     };

//     recognition.onerror = (e) => {
//       console.error("Speech error:", e.error);
//     };

//     recognition.start();
//   };

//   return (
//     <button onClick={startListening}>
//       🎤 Speak
//     </button>
//   );
// }
