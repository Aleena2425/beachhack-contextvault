/**
 * Customer Controller
 * Handles HTTP requests for customer operations
 */

import customerService from '../../services/customerService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const identifyCustomer = asyncHandler(async (req, res) => {
    const result = await customerService.identifyCustomer(req.body);
    res.status(200).json(result);
});

export const getCustomer = asyncHandler(async (req, res) => {
    const customer = await customerService.getProfile(req.params.id);
    res.status(200).json(customer);
});

export const updateCustomer = asyncHandler(async (req, res) => {
    const customer = await customerService.updateMetadata(req.params.id, req.body.metadata);
    res.status(200).json(customer);
});

export const getCustomerSessions = asyncHandler(async (req, res) => {
    const sessions = await customerService.getRecentSessions(req.params.id);
    res.status(200).json(sessions);
});

export default {
    identifyCustomer,
    getCustomer,
    updateCustomer,
    getCustomerSessions,
};
