/**
 * Dummy Chat Website Server
 * Role-based chat system with PostgreSQL authentication
 * Sends chat messages to ContextAI backend
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pg from 'pg';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const { Pool } = pg;
const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Active sessions (in-memory for simplicity)
const activeSessions = new Map();
const userSockets = new Map(); // user email -> socket id

// Routes
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set cookie
        res.cookie('user', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }), { httpOnly: false });

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('user');
    res.json({ success: true });
});

app.get('/me', (req, res) => {
    const userCookie = req.cookies.user;
    if (!userCookie) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(JSON.parse(userCookie));
});

// Socket.io for live chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('authenticate', (userData) => {
        socket.userData = userData;
        userSockets.set(userData.email, socket.id);
        console.log(`${userData.role} authenticated:`, userData.name);

        // Notify about online status
        io.emit('user_online', userData);
    });

    socket.on('chat_message', async (data) => {
        console.log('📨 Received chat_message from:', socket.id);
        console.log('   Sender:', data.sender_name, '(' + data.sender_role + ')');
        console.log('   Content:', data.content);

        const message = {
            ...data,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        // Broadcast to all users (including sender)
        console.log('📢 Broadcasting message to all connected clients...');
        io.emit('chat_message', message);
        console.log('✅ Message broadcasted');

        // POST to ContextAI backend if it's a customer message
        if (data.sender_role === 'customer') {
            try {
                console.log('📤 Sending to ContextAI backend:', process.env.CONTEXTAI_URL);

                const response = await fetch(`${process.env.CONTEXTAI_URL}/api/observe/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerUuid: socket.userData.email,
                        agentId: 'agent_001',
                        message: data.content,
                        sender: 'customer'
                    })
                });

                if (response.ok) {
                    console.log('✅ Message sent to ContextAI');
                } else {
                    console.log('⚠️ ContextAI not responding');
                }
            } catch (error) {
                console.log('⚠️ ContextAI backend not available:', error.message);
            }
        }
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('user_typing', data);
    });

    socket.on('disconnect', () => {
        if (socket.userData) {
            userSockets.delete(socket.userData.email);
            io.emit('user_offline', socket.userData);
            console.log(`${socket.userData.role} disconnected:`, socket.userData.name);
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║                                                    ║');
    console.log('║          Dummy Chat Website - LIVE              ║');
    console.log('║                                                    ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log('');
    console.log('👤 Login as Customer:');
    console.log('   Email: customer@example.com');
    console.log('   Password: customer123');
    console.log('');
    console.log('💼 Login as Agent:');
    console.log('   Email: agent@example.com');
    console.log('   Password: agent123');
    console.log('');
    console.log(`📡 Forwarding customer messages to: ${process.env.CONTEXTAI_URL}`);
    console.log('');
});
