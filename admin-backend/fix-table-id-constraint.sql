-- Fix table_id constraint to allow null values for cancelled/completed reservations
-- This allows tables to be deleted even if they have cancelled reservations

-- First, drop the NOT NULL constraint
ALTER TABLE table_reservations ALTER COLUMN table_id DROP NOT NULL;

-- Update cancelled reservations to have null table_id (they don't need to reference a specific table)
UPDATE table_reservations 
SET table_id = NULL 
WHERE status IN ('cancelled', 'completed', 'no_show');

-- Verify the changes
SELECT 
    id,
    customer_name,
    table_id,
    table_number,
    status,
    reservation_date
FROM table_reservations 
WHERE status IN ('cancelled', 'completed', 'no_show')
ORDER BY reservation_date DESC, id;
