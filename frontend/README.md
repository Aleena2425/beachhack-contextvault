# TechCorp Support - Dummy Website

This is a dummy customer support website that integrates with the ContextAI backend.

## 🚀 Quick Start

1. **Make sure ContextAI backend is running**:
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   - The terminal will show the URL (usually http://localhost:5173)
   - Open that URL in your browser

## 🎯 What This Does

This dummy website simulates a customer support chat interface:

1. **Customer chats** - Type messages in the chat interface
2. **Messages sent to ContextAI** - Each message is sent to `http://localhost:5000/api/messages`
3. **AI processes** - ContextAI analyzes the message and generates insights
4. **Insights pushed to agents** - AI insights are sent to agents via Socket.io (not visible to customers)

## 📁 Files

- `index.html` - Main HTML structure with chat interface
- `public/styles.css` - Modern, responsive styling
- `public/app.js` - JavaScript logic for chat and ContextAI integration

## 🔗 Integration Points

The dummy website connects to ContextAI backend at:
- **API**: `http://localhost:5000`
- **Endpoints used**:
  - `POST /api/customers/identify` - Identify customer
  - `POST /api/sessions` - Create chat session
  - `POST /api/messages` - Send customer messages

## 🧪 Testing

1. Open the website in your browser
2. Type a message like "I need help with pricing"
3. Check the browser console to see:
   - Customer identified
   - Session created
   - Message sent to ContextAI
4. Check the backend terminal to see:
   - Message received
   - AI processing
   - Insights generated and sent to agent

## 🎨 Features

- ✅ Modern, responsive design
- ✅ Real-time chat interface
- ✅ Quick action buttons
- ✅ Typing indicators
- ✅ Message timestamps
- ✅ Auto-scroll
- ✅ ContextAI integration

## 📝 Notes

- This is a **customer-facing** website
- Customers **never see AI insights**
- AI insights are only sent to agents via Socket.io
- The agent interface would be a separate application

## 🔄 Data Flow

```
Customer Browser (This Website)
    ↓ Types message
Customer Message
    ↓ HTTP POST /api/messages
ContextAI Backend
    ├─ Stores in PostgreSQL
    ├─ Embeds in ChromaDB
    ├─ Generates AI insights
    └─ Pushes to Agent via Socket.io
        ↓
Agent Browser (Separate App)
    └─ Receives AI insights
```
