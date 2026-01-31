/**
 * Agent Routes
 */

import express from 'express';
import controller from '../controllers/agentController.js';
import validate from '../middleware/validate.js';
import { agentSchemas } from '../validators/schemas.js';

const router = express.Router();

router.post('/authenticate', validate(agentSchemas.authenticate), controller.authenticateAgent);
router.get('/active', controller.getActiveAgents);
router.get('/:id', controller.getAgent);
router.get('/:id/sessions', controller.getActiveSessions);

export default router;
