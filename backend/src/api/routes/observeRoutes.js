/**
 * Observe Routes
 * API routes for observation endpoints
 */

import express from 'express';
import * as observeController from '../controllers/observeController.js';

const router = express.Router();

/**
 * POST /api/observe/message
 * Receive chat message observation
 */
router.post('/message', observeController.handleMessage);

export default router;
