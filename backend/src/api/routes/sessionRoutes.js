/**
 * Session Routes
 */

import express from 'express';
import controller from '../controllers/sessionController.js';
import validate from '../middleware/validate.js';
import { sessionSchemas } from '../validators/schemas.js';

const router = express.Router();

router.post('/', validate(sessionSchemas.create), controller.createSession);
router.get('/:id', controller.getSession);
router.patch('/:id', validate(sessionSchemas.update), controller.updateSession);
router.get('/:id/summary', controller.getSessionSummary);

export default router;
