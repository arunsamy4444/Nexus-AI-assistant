# Nexus AI - Voice Triggered Notification System

A prototype system that converts voice input into structured task triggers and routes them to messaging and notification channels such as Telegram.

---

## System Context

In small operational environments such as shops, warehouses, and field operations, task coordination is often handled through verbal communication and fragmented messaging. This creates delays and loss of task traceability.

Nexus AI explores a simple event pipeline:

voice input → text conversion → task interpretation → notification dispatch

The focus is on interaction-to-action mapping rather than complex AI processing.

---

## Core Capabilities

### Voice Interaction Layer
- Browser-based speech recognition (Web Speech API)
- Text-to-speech feedback for user confirmation
- Basic conversational interface using Puter.js

### Messaging Integration
- Telegram Bot API integration for sending and receiving messages
- Real-time message dispatch for triggered events

### Reminder / Trigger System
- Voice-defined tasks converted into structured reminders
- Scheduled alert dispatch logic for delayed notifications

### Activity Tracking
- Stores interaction history (voice input + system response)
- Logs timestamped events for traceability

### Authentication Layer
- Supabase-based user authentication
- Session-based access control

---

## Design Intent

This system is not a full AI assistant. It is a **voice-to-event translation prototype**.

Key design decisions:
- Browser-native speech recognition used instead of external STT services
- Telegram chosen as a lightweight messaging layer instead of building a custom notification client
- Supabase used for fast authentication + persistence without backend overhead
- Event flow designed to simulate real-world operational task triggering

---

## Execution Flow

1. User provides voice input through browser
2. Speech is converted to text using Web Speech API
3. System parses input into a structured reminder/event
4. Event is stored in Supabase
5. Immediate or scheduled notification is triggered
6. Telegram bot delivers the message to target user

---

## Tech Stack

Frontend: React, CSS, Web Speech API  
Backend: Node.js, Express  
Messaging: Telegram Bot API  
Database: Supabase (PostgreSQL)  
Authentication: Supabase Auth  
UI Interaction: Puter.js (text + voice feedback layer)

---

## Limitations

- No real NLP or intent classification model
- Voice recognition depends on browser accuracy
- Telegram delivery depends on external API latency
- No offline processing capability
- Not optimized for multi-user concurrent scheduling at scale

---

## Use Case

Designed for lightweight operational environments where:

- Tasks are communicated verbally
- Manual logging is inconsistent
- Immediate or delayed reminders are required without complex tooling

---

## Summary

Nexus AI is a **voice-triggered event prototype** focused on converting spoken input into structured reminders and notifications using lightweight web and messaging APIs.
