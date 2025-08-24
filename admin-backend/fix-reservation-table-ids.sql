-- Fix table_id values in existing reservations
-- This script updates the table_id field in table_reservations 
-- by matching table_number with the correct table ID

UPDATE table_reservations 
SET table_id = rt.id
FROM restaurant_tables rt
WHERE table_reservations.table_id IS NULL 
  AND table_reservations.table_number = rt.table_number;

-- Verify the update
SELECT 
    tr.id,
    tr.customer_name,
    tr.table_id,
    tr.table_number,
    rt.name as table_name,
    tr.reservation_time
FROM table_reservations tr
LEFT JOIN restaurant_tables rt ON tr.table_id = rt.id
WHERE tr.reservation_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY tr.reservation_date, tr.reservation_time;
