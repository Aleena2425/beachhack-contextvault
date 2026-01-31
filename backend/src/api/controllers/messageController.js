/**
 * Message Controller
 * Handles HTTP requests for message operations
 */

import messageService from '../../services/messageService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const receiveMessage = asyncHandler(async (req, res) => {
    const message = await messageService.processIncomingMessage(req.body);
    res.status(201).json(message);
});

export const getSessionMessages = asyncHandler(async (req, res) => {
    const messages = await messageService.getSessionMessages(req.params.sessionId);
    res.status(200).json(messages);
});

export default {
    receiveMessage,
    getSessionMessages,
};
