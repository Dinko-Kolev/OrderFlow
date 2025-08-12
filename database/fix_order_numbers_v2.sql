-- Fix for duplicate order numbers - Version 2
-- This script creates a more reliable order number generation function

-- Drop the existing function
DROP FUNCTION IF EXISTS generate_order_number();

-- Create a simpler, more reliable function
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    max_attempts INTEGER := 20;
    attempt INTEGER := 0;
BEGIN
    LOOP
        attempt := attempt + 1;
        
        -- Get the next available counter
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INTEGER)), 0) + 1
        INTO counter
        FROM orders 
        WHERE order_number LIKE 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
        
        -- Generate the new order number
        new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        -- If we've tried too many times, use timestamp-based fallback
        IF attempt >= max_attempts THEN
            new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                         TO_CHAR(EXTRACT(EPOCH FROM NOW())::INTEGER, 'FM0000000000');
            RETURN new_number;
        END IF;
        
        -- Wait a tiny bit and try again
        PERFORM pg_sleep(0.001);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Test the function multiple times to ensure it generates unique numbers
SELECT 'Test 1:' as test, generate_order_number() as order_number
UNION ALL
SELECT 'Test 2:' as test, generate_order_number() as order_number
UNION ALL
SELECT 'Test 3:' as test, generate_order_number() as order_number;

-- Show current orders to verify
SELECT order_number, created_at FROM orders ORDER BY created_at DESC LIMIT 5;
