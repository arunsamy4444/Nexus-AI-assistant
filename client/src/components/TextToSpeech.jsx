import React, { useEffect } from "react";

export default function TextToSpeech({ text }) {
  useEffect(() => {
    if (!text) return;

    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";

    const voices = synth.getVoices();
    const female = voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("female"));
    utter.voice = female || voices.find(v => v.lang === "en-US");

    synth.cancel(); // stop previous
    synth.speak(utter);

    return () => synth.cancel();
  }, [text]);

  return null;
}

