import React, { useEffect, useState } from "react";
import SpeechToText from "./SpeechToText";
import "./ChatBot.css";

export default function ChatBot({ inputText, onResponse, onSpeech }) {
  const [loading, setLoading] = useState(false);

  const queryGemini = async (text) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/gemini-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      const data = await response.json();
      const result = data?.answer;
      onResponse(result || "No response from Gemini.");
    } catch (err) {
      console.error("Gemini Chat error:", err);
      onResponse("Error fetching from server.");
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
