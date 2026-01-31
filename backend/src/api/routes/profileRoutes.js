/**
 * Profile Routes
 * API routes for customer profile data
 */

import express from 'express';
import * as profileController from '../controllers/profileController.js';

const router = express.Router();

/**
 * GET /api/profiles/:uuid
 * Get full customer 360 profile
 */
router.get('/:uuid', profileController.getProfile);

export default router;
