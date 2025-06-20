import React, { useState, useEffect, useRef } from "react";

export default function VoiceReminderScheduler() {
  const [reason, setReason] = useState("");
  const [hour, setHour] = useState(null);
  const [minute, setMinute] = useState(null);
  const [amPm, setAmPm] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [alerting, setAlerting] = useState(false);

  const synth = window.speechSynthesis;
  const voicesRef = useRef([]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) voicesRef.current = voices;
    };

    loadVoices();
    if (typeof synth.onvoiceschanged !== "undefined") {
      synth.onvoiceschanged = loadVoices;
    }
  }, []);

  const alertingRef = useRef(alerting);
  const reasonRef = useRef(reason);
  const hourRef = useRef(hour);
  const minuteRef = useRef(minute);
  const amPmRef = useRef(amPm);

  useEffect(() => { alertingRef.current = alerting; }, [alerting]);
  useEffect(() => { reasonRef.current = reason; }, [reason]);
  useEffect(() => { hourRef.current = hour; }, [hour]);
  useEffect(() => { minuteRef.current = minute; }, [minute]);
  useEffect(() => { amPmRef.current = amPm; }, [amPm]);

  const convertTo24Hour = (h, ampm) => {
    if (ampm === "PM" && h !== 12) return h + 12;
    if (ampm === "AM" && h === 12) return 0;
    return h;
  };

  const saveReminder = () => {
    const reminder = { reason, hour, minute, amPm };
    localStorage.setItem("voiceReminder", JSON.stringify(reminder));
  };

  useEffect(() => {
    const stored = localStorage.getItem("voiceReminder");
    if (stored) {
      const rem = JSON.parse(stored);
      setReason(rem.reason);
      setHour(rem.hour);
      setMinute(rem.minute);
      setAmPm(rem.amPm);
      setConfirmed(true);
    }
  }, []);

  useEffect(() => {
    if (!confirmed) return;
    const interval = setInterval(() => {
      const now = new Date();
      const h24 = convertTo24Hour(hourRef.current, amPmRef.current);
      if (
        now.getHours() === h24 &&
        now.getMinutes() === minuteRef.current &&
        !alertingRef.current
      ) {
        setAlerting(true);
        setTimeout(() => speakReminder(), 100);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [confirmed]);

  const getFemaleVoice = () => {
    const voices = voicesRef.current;
    return (
      voices.find((v) => v.name === "Google UK English Female") ||
      voices.find((v) => /female/i.test(v.name)) ||
      voices.find((v) => v.gender === "female") ||
      voices[0]
    );
  };

  const speakReminder = () => {
    if (!alertingRef.current) return;
    const msg = `Boss, you told me to remind you at ${hourRef.current}:${minuteRef.current
      .toString()
      .padStart(2, "0")} ${amPmRef.current} about ${reasonRef.current}.`;

    const utterance = new SpeechSynthesisUtterance(msg);
    const femaleVoice = getFemaleVoice();
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => {
      if (alertingRef.current) {
        setTimeout(() => speakReminder(), 10000);
      }
    };

    if (synth.speaking) synth.cancel();
    synth.speak(utterance);
  };

  const handleConfirmClick = () => {
    if (!reason || !hour || minute === null || !amPm) {
      alert("Please fill all fields before confirming.");
      return;
    }

    saveReminder();
    setConfirmed(true);
    const msg = new SpeechSynthesisUtterance("Reminder saved boss.");
    const femaleVoice = getFemaleVoice();
    if (femaleVoice) msg.voice = femaleVoice;
    synth.cancel();
    synth.speak(msg);
  };

  const stopReminder = () => {
    setAlerting(false);
    setConfirmed(false);
    synth.cancel();
    localStorage.removeItem("voiceReminder");
  };

  return (
    <>
      <style>{`
        .glass-reminder {
          max-width: 500px;
          margin: 2.5rem auto;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(16px);
          color: #1f2937;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 20px 30px rgba(0, 0, 0, 0.25);
          animation: fadeUp 0.5s ease-in-out;
        }

        .glass-reminder h2 {
          font-size: 1.7rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 1.2rem;
          color: #f9fafb;
        }

        .glass-reminder label {
          display: block;
          margin-top: 1rem;
          font-weight: 500;
          color: #060706c4;
        }

        .glass-reminder input,
        .glass-reminder select {
          width: 100%;
          padding: 12px;
          margin-top: 4px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.6);
          border: none;
          font-size: 1rem;
          margin-bottom: 1rem;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.15);
        }

        .glass-reminder input:focus,
        .glass-reminder select:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.3);
        }

        .glass-reminder button {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
          font-weight: bold;
          border: none;
          border-radius: 14px;
          color: #ffffff;
          cursor: pointer;
          margin-top: 1rem;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          box-shadow: 0 8px 20px rgba(236, 72, 153, 0.3);
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }

        .glass-reminder button:hover {
          transform: scale(1.03);
          box-shadow: 0 10px 28px rgba(139, 92, 246, 0.4);
        }

        .glass-reminder .danger {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .glass-reminder p {
          text-align: center;
          font-size: 1rem;
          color: #fef2f2;
          margin-top: 1rem;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .glass-reminder {
            margin: 1rem;
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="glass-reminder">
        <h2>🔊 Voice Reminder Scheduler</h2>

        {!confirmed ? (
          <>
            <label>Reason</label>
            <input
              type="text"
              placeholder="What to remind?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <label>Hour (1-12)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={hour || ""}
              onChange={(e) => setHour(parseInt(e.target.value))}
            />

            <label>Minute (0-59)</label>
            <input
              type="number"
              min={0}
              max={59}
              value={minute || ""}
              onChange={(e) => setMinute(parseInt(e.target.value))}
            />

            <label>AM / PM</label>
            <select
              value={amPm || ""}
              onChange={(e) => setAmPm(e.target.value)}
            >
              <option value="" disabled>Select</option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>

            <button onClick={handleConfirmClick}>✅ Confirm Reminder</button>
          </>
        ) : (
          <>
            <p>
              ⏰ Reminder set for <strong>{reason}</strong> at{" "}
              <strong>
                {hour}:{minute.toString().padStart(2, "0")} {amPm}
              </strong>
            </p>
            <button onClick={stopReminder} className="danger">🛑 Stop Reminder</button>
          </>
        )}
      </div>
    </>
  );
}

