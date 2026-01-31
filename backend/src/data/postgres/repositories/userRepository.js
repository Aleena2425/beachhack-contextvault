/**
 * User Repository (uses agents table for authentication)
 */

import db from '../connection.js';

/**
 * Create a new user (stored in agents table)
 */
export async function createUser(name, email, passwordHash, role = 'agent') {
    const query = `
        INSERT INTO agents (agent_id, name, email, password_hash, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, agent_id, name, email, status, created_at
    `;

    // Generate agent_id from email (e.g., "john@example.com" -> "john_example_com")
    const agentId = email.replace(/[@.]/g, '_').toLowerCase();

    const values = [agentId, name, email, passwordHash, role];
    const result = await db.query(query, values);
    return result.rows[0];
}

/**
 * Find user by email
 */
export async function findByEmail(email) {
    const query = `
        SELECT id, agent_id, name, email, password_hash, status, created_at, updated_at
        FROM agents
        WHERE email = $1
    `;

    const result = await db.query(query, [email]);
    return result.rows[0];
}

/**
 * Check if email already exists
 */
export async function emailExists(email) {
    const query = `
        SELECT COUNT(*) as count
        FROM agents
        WHERE email = $1
    `;

    const result = await db.query(query, [email]);
    return parseInt(result.rows[0].count) > 0;
}

/**
 * Find user by ID
 */
export async function findById(id) {
    const query = `
        SELECT id, agent_id, name, email, status, created_at, updated_at
        FROM agents
        WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
}
