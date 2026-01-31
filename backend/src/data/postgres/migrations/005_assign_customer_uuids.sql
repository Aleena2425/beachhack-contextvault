-- Migration to assign UUIDs as external_id for all customers
-- Specifically sets a fixed UUID for customer@example.com

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Update existing customers who have an email-like external_id to a new random UUID
-- but keep track of their email if it's in the email field.
UPDATE customers
SET external_id = gen_random_uuid()::text
WHERE external_id LIKE '%@%' AND email IS NOT NULL AND email != 'customer@example.com';

-- Handle customer@example.com specifically using a DO block for robustness
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM customers WHERE email = 'customer@example.com') THEN
        UPDATE customers 
        SET external_id = 'c0570b4c-1e24-4e31-9a7a-6f691680d2f1'
        WHERE email = 'customer@example.com';
    ELSE
        INSERT INTO customers (external_id, email, name)
        VALUES ('c0570b4c-1e24-4e31-9a7a-6f691680d2f1', 'customer@example.com', 'Demo Customer');
    END IF;
END $$;

-- Also update by external_id if it happened to be 'customer@example.com'
UPDATE customers
SET external_id = 'c0570b4c-1e24-4e31-9a7a-6f691680d2f1'
WHERE external_id = 'customer@example.com';
