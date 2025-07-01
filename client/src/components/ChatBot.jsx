import React, { useState, useEffect } from "react"; // ← add useEffect here
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ChatBot.css";

export default function ChatBot({ inputText, onResponse, onSpeech }) {
  const [loading, setLoading] = useState(false);
  
  const queryGemini = async (text) => {
    if (!text?.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/gemini-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      const data = await response.json();
      
      // ✅ API limit toast
      if (data?.error?.includes("limit") || data?.answer?.includes("limit")) {
        toast.error("⚠️ Gemini API free-tier limit reached for today.");
      }

      const result = data?.answer;
      onResponse(result || "No response from Gemini.");
    } catch (err) {
      console.error("Gemini Chat error:", err);
        toast.error("⚠️ Gemini API fetch failed or limit reached.");
      onResponse("Error fetching from server.");
    } finally {
      setLoading(false);
    }
  };

  // Manual trigger from parent via hidden button
  const handleTrigger = () => {
    queryGemini(inputText);
  };

  return (
    <>

   {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <p className="loader-text">Getting answer...</p>
        </div>
      )}

      <button id="trigger-bot" onClick={handleTrigger} style={{ display: "none" }} />
    </>
  );
}
