/**
 * Message Routes
 */

import express from 'express';
import controller from '../controllers/messageController.js';
import validate from '../middleware/validate.js';
import { messageSchemas } from '../validators/schemas.js';

const router = express.Router();

router.post('/', validate(messageSchemas.create), controller.receiveMessage);
router.get('/session/:sessionId', controller.getSessionMessages);

export default router;
