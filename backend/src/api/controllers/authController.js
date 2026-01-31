/**
 * Authentication Controller
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../../data/postgres/repositories/userRepository.js';
import config from '../../config/index.js';

/**
 * POST /api/auth/signup
 * Register a new user
 */
export async function signup(req, res) {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (!role || !['agent', 'manager'].includes(role)) {
            return res.status(400).json({ error: 'Role must be either "agent" or "manager"' });
        }

        // Check if email already exists
        const exists = await userRepository.emailExists(email);
        if (exists) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await userRepository.createUser(name, email, passwordHash, role);

        // Return success (no auto-login, user needs to login)
        res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.status
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
}

/**
 * POST /api/auth/login
 * Login user
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await userRepository.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.status
            },
            config.jwtSecret || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );

        // Return token and user data
        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.status
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
}
