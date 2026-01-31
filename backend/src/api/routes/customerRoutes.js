/**
 * Customer Routes
 */

import express from 'express';
import controller from '../controllers/customerController.js';
import validate from '../middleware/validate.js';
import { customerSchemas } from '../validators/schemas.js';

const router = express.Router();

router.post('/identify', validate(customerSchemas.identify), controller.identifyCustomer);
router.get('/:id', controller.getCustomer);
router.patch('/:id', validate(customerSchemas.update), controller.updateCustomer);
router.get('/:id/sessions', controller.getCustomerSessions);

export default router;
