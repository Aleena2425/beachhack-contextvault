# Dummy Chat Website

A separate role-based chat system for testing ContextAI backend integration.

## 🎯 Purpose

This is a **SEPARATE dummy website** (not the main ContextAI frontend) that simulates a customer-agent chat system:

- **Customer** and **Agent** can log in with different credentials
- Live chat between customer and agent using Socket.io
- Customer messages are automatically POSTed to ContextAI backend
- User credentials stored in PostgreSQL database

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up PostgreSQL

Make sure PostgreSQL is running on port 5432.

### 3. Initialize Database
```bash
npm run init-db
```

This creates:
- Database: `dummy_chat`
- Table: `users`
- Demo customer account
- Demo agent account

### 4. Start Server
```bash
npm run dev
```

### 5. Open in Browser

Open two browser windows:
- Window 1: http://localhost:3000 (login as customer)
- Window 2: http://localhost:3000 (login as agent)

## 👤 Demo Credentials

**Customer:**
- Email: `customer@example.com`
- Password: `customer123`

**Agent:**
- Email: `agent@example.com`
- Password: `agent123`

## 🔗 Integration with ContextAI

When a **customer** sends a message, it:
1. Displays in the chat (both customer and agent see it)
2. Automatically POSTs to ContextAI backend at `http://localhost:5000/api/messages`
3. ContextAI processes it and generates AI insights for agents

**Agent** messages stay in the dummy chat and are NOT sent to ContextAI.

## 📁 Structure

```
dummy-chat-website/
├── server.js          # Express + Socket.io server
├── init-db.js         # Database initialization
├── package.json       # Dependencies
├── .env               # Configuration
└── public/
    ├── index.html     # Login page
    ├── chat.html      # Chat interface
    └── style.css      # Styles
```

## 🔄 Data Flow

```
Customer types message
    ↓
Socket.io broadcasts to all users
    ↓
POST to http://localhost:5000/api/messages
    ↓
ContextAI backend processes
    ↓
AI insights generated (sent to agents via ContextAI's Socket.io)
```

## 🧪 Testing

1. **Start ContextAI backend**: `cd ../backend && node src/app-simple.js`
2. **Start dummy chat**: `npm run dev`
3. **Login as customer** in first browser window
4. **Login as agent** in second browser window
5. **Customer sends message**
6. **Both see the message** in real-time
7. **Check backend logs** to see message received by ContextAI

## ⚙️ Configuration

Edit `.env` to change:
- PostgreSQL connection
- Server port
- ContextAI backend URL
