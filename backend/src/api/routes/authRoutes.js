/**
 * Authentication Routes
 */

import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', authController.signup);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

export default router;
