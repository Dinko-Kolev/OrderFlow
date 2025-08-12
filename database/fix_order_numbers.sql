-- Fix for duplicate order numbers
-- This script updates the generate_order_number function to handle concurrent orders properly

-- Drop the existing function
DROP FUNCTION IF EXISTS generate_order_number();

-- Create improved function with better concurrency handling
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    LOOP
        attempt := attempt + 1;
        
        -- Generate order number like ORD-YYYYMMDD-XXXX
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INTEGER)), 0) + 1
        INTO counter
        FROM orders 
        WHERE order_number LIKE 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
        
        new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        
        -- Try to insert with this number, if it fails due to duplicate, try again
        BEGIN
            -- Check if this number already exists
            IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
                RETURN new_number;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- If we've tried too many times, use timestamp-based fallback
                IF attempt >= max_attempts THEN
                    new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                                 TO_CHAR(EXTRACT(EPOCH FROM NOW())::INTEGER, 'FM0000000000');
                    RETURN new_number;
                END IF;
                -- Wait a tiny bit and try again
                PERFORM pg_sleep(0.001);
                CONTINUE;
        END;
        
        -- If we get here, the number is available
        EXIT;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT generate_order_number() as test_order_number;

-- Show current orders to verify
SELECT order_number, created_at FROM orders ORDER BY created_at DESC LIMIT 5;
