import React, { useState } from "react";

export default function ReminderForm({ onSubmit }) {
  const [form, setForm] = useState({
    phone: "",
    date: "",
    time: "",
    reason: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    alert("📲 Reminder scheduled!");
    setForm({ phone: "", date: "", time: "", reason: "" });
  };

  return (
    <>
      <style>{`
        .reminder-form {
          max-width: 500px;
          margin: 40px auto;
          padding: 32px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(14px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          font-family: 'Inter', sans-serif;
          animation: fadeInUp 0.6s ease;
          color: #1f2937;
        }

        .reminder-form h2 {
          text-align: center;
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #111827;
        }

        .reminder-form label {
          display: block;
          font-size: 0.95rem;
          font-weight: 500;
          margin-bottom: 6px;
          color: #374151;
        }

        .reminder-form input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,0.15);
          background: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          margin-bottom: 1rem;
          transition: border 0.3s, box-shadow 0.3s;
        }

        .reminder-form input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
        }

        .reminder-form .row {
          display: flex;
          gap: 1rem;
        }

        .reminder-form .row > div {
          flex: 1;
        }

        .reminder-form button {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 16px;
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          color: white;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(236, 72, 153, 0.3);
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }

        .reminder-form button:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.35);
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(25px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .reminder-form .row {
            flex-direction: column;
          }
        }
      `}</style>

      <form onSubmit={handleSubmit} className="reminder-form">
        <h2>📅 Set a Reminder</h2>

        <div>
          <label>Mobile Number</label>
          <input
            type="tel"
            name="phone"
            required
            placeholder="Enter mobile number"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="row">
          <div>
            <label>Date</label>
            <input
              type="date"
              name="date"
              required
              value={form.date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Time</label>
            <input
              type="time"
              name="time"
              required
              value={form.time}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label>Reason</label>
          <input
            type="text"
            name="reason"
            required
            placeholder="E.g., Take medicine"
            value={form.reason}
            onChange={handleChange}
          />
        </div>

        <button type="submit">✅ Set Reminder</button>
      </form>
    </>
  );
}
