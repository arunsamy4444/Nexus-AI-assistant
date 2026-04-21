# Nexus AI Assistant

A voice-enabled system for triggering reminders and sending real-time notifications across users and messaging platforms.

## Context

In small operational environments (shops, warehouses, agri units), workers often rely on manual coordination and verbal instructions. This leads to missed tasks and delays.

This system tests a simple approach:
voice input → task trigger → automated notification.

## Features

- AI Chat Interface (Puter.js with text-to-speech)
- Voice Input (browser-based speech recognition)
- Telegram Integration (send and receive messages)
- Reminder System (scheduled alerts and notifications)
- Activity History (logs user interactions)
- Authentication (Supabase-based user accounts)

## Use Case

A worker or supervisor can:
- Speak a task or reminder
- Store it in the system
- Trigger a scheduled notification
- Deliver it via Telegram or voice output

This reduces reliance on manual tracking and repeated verbal communication.

## Tech Stack

Frontend: React, CSS3, Web Speech API  
Backend: Node.js, Express  
Messaging: Telegram Bot API  
Database: Supabase (PostgreSQL)  
AI: Puter.js  
Auth: Supabase Authentication

## Notes

- Designed as a prototype to test voice-based task triggering
- Not optimized for large-scale deployment
- Application is deployed on free-tier services (Vercel, Render); backend instances may enter sleep mode during inactivity, which can delay initial response times
