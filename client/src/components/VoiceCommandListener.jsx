import { useEffect, useRef } from "react";

export default function VoiceCommandListener({ onCommandDetected }) {
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const cooldownRef = useRef(false);
  const lastCommandRef = useRef(null); // 🚫 Prevent repeat

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    const speak = (text) => {
      const utterance = new SpeechSynthesisUtterance(text);

      const speakNow = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find((v) =>
            ["female", "zira", "susan", "woman"].some((key) =>
              v.name.toLowerCase().includes(key)
            )
          ) || voices.find((v) => v.lang === "en-US") || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => speakNow();
      } else {
        speakNow();
      }
    };

    const safeStart = () => {
      if (!isListeningRef.current) {
        try {
          recognition.start();
        } catch (err) {
          console.error("⚠️ Safe start error:", err);
        }
      }
    };

    recognition.onstart = () => {
      console.log("🎙️ Voice recognition started");
      isListeningRef.current = true;
    };

    recognition.onend = () => {
      console.warn("🛑 Recognition ended.");
      isListeningRef.current = false;
      setTimeout(safeStart, 1000);
    };

    recognition.onerror = (e) => {
      console.error("❌ Recognition error:", e);
      isListeningRef.current = false;
      recognition.abort();
      setTimeout(safeStart, 1000);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

      console.log("🎧 Transcript:", transcript);

      if (cooldownRef.current) return;

      // 🔓 Wake word
      if (transcript.includes("nexus")) {
        speak("Yes, boss");
        cooldownRef.current = true;
        setTimeout(() => (cooldownRef.current = false), 3000);
        return;
      }

      // 🧠 Accept only valid feature switch phrases
      const triggerWords = [
        "switch to",
        "hospital",
        "chatbot",
        "gemini",
        "info",
        "reminder",
        "set reminder",
        "college",
      ];

      // ✅ Prevent same command repeating too soon
      if (
        triggerWords.some((word) => transcript.includes(word)) &&
        transcript !== lastCommandRef.current
      ) {
        lastCommandRef.current = transcript;
        cooldownRef.current = true;
        onCommandDetected(transcript);

        // Reset cooldown + last command after delay
        setTimeout(() => {
          cooldownRef.current = false;
          lastCommandRef.current = null;
        }, 3000);
      }
    };

    safeStart();

    return () => {
      try {
        recognition.stop();
        recognition.abort();
        isListeningRef.current = false;
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    };
  }, [onCommandDetected]);

  return null;
}





// import { useEffect, useRef } from "react";

// export default function VoiceCommandListener({ onCommandDetected }) {
//   const recognitionRef = useRef(null);
//   const isListeningRef = useRef(false);
//   const cooldownRef = useRef(false);

//   useEffect(() => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       alert("Speech recognition is not supported in this browser.");
//       return;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.lang = "en-US";
//     recognition.continuous = true;
//     recognition.interimResults = false;
//     recognitionRef.current = recognition;

//     const speak = (text) => {
//       const utterance = new SpeechSynthesisUtterance(text);

//       const speakNow = () => {
//         const voices = window.speechSynthesis.getVoices();
//         const preferredVoice =
//           voices.find((v) =>
//             ["female", "zira", "susan", "woman"].some((key) =>
//               v.name.toLowerCase().includes(key)
//             )
//           ) || voices.find((v) => v.lang === "en-US") || voices[0];

//         if (preferredVoice) utterance.voice = preferredVoice;
//         utterance.lang = "en-US";
//         window.speechSynthesis.speak(utterance);
//       };

//       if (window.speechSynthesis.getVoices().length === 0) {
//         window.speechSynthesis.onvoiceschanged = () => speakNow();
//       } else {
//         speakNow();
//       }
//     };

//     const safeStart = () => {
//       if (!isListeningRef.current) {
//         try {
//           recognition.start();
//         } catch (err) {
//           console.error("⚠️ Safe start error:", err);
//         }
//       }
//     };

//     recognition.onstart = () => {
//       console.log("🎙️ Voice recognition started");
//       isListeningRef.current = true;
//     };

//     recognition.onend = () => {
//       console.warn("🛑 Recognition ended.");
//       isListeningRef.current = false;
//       setTimeout(safeStart, 1000);
//     };

//     recognition.onerror = (e) => {
//       console.error("❌ Recognition error:", e);
//       isListeningRef.current = false;
//       recognition.abort();
//       setTimeout(safeStart, 1000);
//     };

//     recognition.onresult = (event) => {
//       const transcript =
//         event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

//       console.log("🎧 Transcript:", transcript);

//       if (cooldownRef.current) return;

//       if (transcript.includes("nexus")) {
//         speak("Yes, boss");
//         cooldownRef.current = true;
//         setTimeout(() => (cooldownRef.current = false), 3000);
//         return;
//       }

//       const triggerWords = [
//         "switch to",
//         "hospital",
//         "chatbot",
//         "gemini",
//         "info",
//         "reminder",
//         "set reminder",
//         "college",
//       ];

//       if (triggerWords.some((word) => transcript.includes(word))) {
//         cooldownRef.current = true;
//         onCommandDetected(transcript);
//         setTimeout(() => (cooldownRef.current = false), 3000);
//       }
//     };

//     safeStart(); // ⬅️ initial start wrapped

//     return () => {
//       try {
//         recognition.stop();
//         recognition.abort();
//         isListeningRef.current = false;
//       } catch (err) {
//         console.error("Cleanup error:", err);
//       }
//     };
//   }, [onCommandDetected]);

//   return null;
// }


