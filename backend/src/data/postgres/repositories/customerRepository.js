/**
 * Customer Repository
 * Handles all customer-related database operations
 */

import db from '../connection.js';
import logger from '../../../utils/logger.js';

/**
 * Find customer by internal UUID
 */
export async function findById(id) {
    const result = await db.query(
        'SELECT * FROM customers WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

/**
 * Find customer by external ID (from dummy chat)
 */
export async function findByExternalId(externalId) {
    const result = await db.query(
        'SELECT * FROM customers WHERE external_id = $1',
        [externalId]
    );
    return result.rows[0] || null;
}

/**
 * Find customer by email
 */
export async function findByEmail(email) {
    const result = await db.query(
        'SELECT * FROM customers WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
}

/**
 * Create a new customer
 */
export async function create(data) {
    const result = await db.query(
        `INSERT INTO customers (external_id, name, email, phone, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
            data.externalId,
            data.name || null,
            data.email || null,
            data.phone || null,
            JSON.stringify(data.metadata || {})
        ]
    );

    logger.info('Customer created', {
        id: result.rows[0].id,
        externalId: data.externalId
    });

    return result.rows[0];
}

/**
 * Update customer
 */
export async function update(id, data) {
    const result = await db.query(
        `UPDATE customers SET
            name = COALESCE($2, name),
            email = COALESCE($3, email),
            phone = COALESCE($4, phone),
            metadata = COALESCE($5, metadata)
         WHERE id = $1
         RETURNING *`,
        [
            id,
            data.name || null,
            data.email || null,
            data.phone || null,
            data.metadata ? JSON.stringify(data.metadata) : null
        ]
    );

    return result.rows[0] || null;
}

/**
 * Identify or create customer
 * Returns existing customer or creates new one
 */
export async function identifyOrCreate(externalId, data = {}) {
    // Try to find existing
    let customer = await findByExternalId(externalId);

    if (customer) {
        logger.debug('Customer identified', { id: customer.id, externalId });
        return { customer, isNew: false };
    }

    // Create new
    customer = await create({
        externalId,
        name: data.name,
        email: data.email || externalId, // Use externalId as email if not provided
        phone: data.phone,
        metadata: data.metadata
    });

    return { customer, isNew: true };
}

/**
 * Count total customers
 */
export async function count() {
    const result = await db.query('SELECT COUNT(*) FROM customers');
    return parseInt(result.rows[0].count);
}

export default {
    findById,
    findByExternalId,
    findByEmail,
    create,
    update,
    identifyOrCreate,
    count
};
