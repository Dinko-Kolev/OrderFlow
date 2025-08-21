-- =============================================
-- RESERVATION DURATION SYSTEM MIGRATION
-- =============================================
-- 
-- This migration implements the reservation duration logic:
-- • Reservation slot: 90 min + 15 buffer = 105 min
-- • Grace period: 15 min (for late arrivals)
-- • Max sitting time: 2 hours (120 min)
--
-- Run this migration to add duration tracking to the reservation system
-- =============================================

BEGIN;

-- Add duration fields to table_reservations
ALTER TABLE table_reservations 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 105,  -- 90 min + 15 min buffer
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15,  -- 15 min grace period
ADD COLUMN IF NOT EXISTS max_sitting_minutes INTEGER DEFAULT 120,  -- 2 hours max sitting time
ADD COLUMN IF NOT EXISTS reservation_end_time TIME,  -- Calculated end time
ADD COLUMN IF NOT EXISTS actual_arrival_time TIMESTAMP,  -- When customer actually arrived
ADD COLUMN IF NOT EXISTS actual_departure_time TIMESTAMP,  -- When customer actually left
ADD COLUMN IF NOT EXISTS is_late_arrival BOOLEAN DEFAULT false,  -- Did they arrive late?
ADD COLUMN IF NOT EXISTS arrival_notes TEXT;  -- Notes about arrival (late, early, etc.)

-- Add check constraints for duration fields
ALTER TABLE table_reservations 
ADD CONSTRAINT check_duration_positive CHECK (duration_minutes > 0),
ADD CONSTRAINT check_grace_period_positive CHECK (grace_period_minutes >= 0),
ADD CONSTRAINT check_max_sitting_positive CHECK (max_sitting_minutes > 0),
ADD CONSTRAINT check_duration_reasonable CHECK (duration_minutes <= 480), -- Max 8 hours
ADD CONSTRAINT check_grace_reasonable CHECK (grace_period_minutes <= 60), -- Max 1 hour grace
ADD CONSTRAINT check_sitting_reasonable CHECK (max_sitting_minutes <= 600); -- Max 10 hours sitting

-- Update existing reservations with calculated end times
UPDATE table_reservations 
SET reservation_end_time = (reservation_time + INTERVAL '105 minutes')::TIME
WHERE reservation_end_time IS NULL;

-- Add new status options for better tracking
ALTER TABLE table_reservations 
DROP CONSTRAINT IF EXISTS table_reservations_status_check;

ALTER TABLE table_reservations 
ADD CONSTRAINT table_reservations_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show', 'seated', 'departed', 'late_arrival'));

-- Create function to calculate next available time slot for a table
CREATE OR REPLACE FUNCTION get_next_available_slot(
    p_table_id INTEGER,
    p_date DATE,
    p_after_time TIME DEFAULT '12:00:00'
) RETURNS TIME
LANGUAGE plpgsql
AS $$
DECLARE
    next_slot TIME;
    time_slots TIME[] := ARRAY[
        '12:00:00', '12:30:00', '13:00:00', '13:30:00', '14:00:00', '14:30:00',
        '19:00:00', '19:30:00', '20:00:00', '20:30:00', '21:00:00', '21:30:00', '22:00:00'
    ];
    slot TIME;
    is_occupied BOOLEAN;
BEGIN
    -- Loop through time slots starting after the specified time
    FOREACH slot IN ARRAY time_slots
    LOOP
        IF slot > p_after_time THEN
            -- Check if this slot is occupied by looking at overlapping reservations
            SELECT EXISTS(
                SELECT 1 FROM table_reservations 
                WHERE table_id = p_table_id 
                AND reservation_date = p_date 
                AND status NOT IN ('cancelled', 'no_show', 'departed')
                AND (
                    -- Slot falls within existing reservation + buffer time
                    slot >= reservation_time 
                    AND slot < (reservation_time + INTERVAL '105 minutes')::TIME
                    OR
                    -- Existing reservation falls within new slot + buffer time
                    reservation_time >= slot 
                    AND reservation_time < (slot + INTERVAL '105 minutes')::TIME
                )
            ) INTO is_occupied;
            
            IF NOT is_occupied THEN
                RETURN slot;
            END IF;
        END IF;
    END LOOP;
    
    -- If no slot found today, return NULL (caller should check next day)
    RETURN NULL;
END;
$$;

-- Create function to check if a customer arrived on time
CREATE OR REPLACE FUNCTION check_arrival_status(
    p_reservation_id INTEGER,
    p_arrival_time TIMESTAMP
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    reservation_datetime TIMESTAMP;
    grace_period INTEGER;
    is_on_time BOOLEAN;
BEGIN
    -- Get reservation details
    SELECT 
        (reservation_date + reservation_time)::TIMESTAMP,
        grace_period_minutes
    INTO reservation_datetime, grace_period
    FROM table_reservations 
    WHERE id = p_reservation_id;
    
    -- Check if arrival is within grace period
    is_on_time := p_arrival_time <= (reservation_datetime + (grace_period || ' minutes')::INTERVAL);
    
    -- Update the reservation record
    UPDATE table_reservations 
    SET 
        actual_arrival_time = p_arrival_time,
        is_late_arrival = NOT is_on_time,
        status = CASE 
            WHEN is_on_time THEN 'seated'
            ELSE 'late_arrival'
        END,
        arrival_notes = CASE 
            WHEN is_on_time THEN 'Arrived on time'
            ELSE 'Late arrival - ' || EXTRACT(EPOCH FROM (p_arrival_time - reservation_datetime))/60 || ' minutes late'
        END
    WHERE id = p_reservation_id;
    
    RETURN is_on_time;
END;
$$;

-- Create function to mark table as departed and calculate actual duration
CREATE OR REPLACE FUNCTION mark_table_departed(
    p_reservation_id INTEGER,
    p_departure_time TIMESTAMP DEFAULT NOW()
) RETURNS INTERVAL
LANGUAGE plpgsql
AS $$
DECLARE
    actual_duration INTERVAL;
    arrival_time TIMESTAMP;
BEGIN
    -- Get arrival time
    SELECT actual_arrival_time INTO arrival_time
    FROM table_reservations 
    WHERE id = p_reservation_id;
    
    -- Calculate actual duration
    actual_duration := p_departure_time - arrival_time;
    
    -- Update reservation
    UPDATE table_reservations 
    SET 
        actual_departure_time = p_departure_time,
        status = 'departed'
    WHERE id = p_reservation_id;
    
    RETURN actual_duration;
END;
$$;

-- Create indexes for new duration-related queries
CREATE INDEX IF NOT EXISTS idx_reservations_end_time ON table_reservations(reservation_date, reservation_end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_duration ON table_reservations(duration_minutes);
CREATE INDEX IF NOT EXISTS idx_reservations_arrival_time ON table_reservations(actual_arrival_time);
CREATE INDEX IF NOT EXISTS idx_reservations_departure_time ON table_reservations(actual_departure_time);
CREATE INDEX IF NOT EXISTS idx_reservations_late_arrival ON table_reservations(is_late_arrival);

-- Update the reservation_summary view to include duration information
DROP VIEW IF EXISTS reservation_summary;

CREATE VIEW reservation_summary AS
SELECT 
    r.id,
    r.customer_name,
    r.customer_email,
    r.customer_phone,
    r.reservation_date,
    r.reservation_time,
    r.reservation_end_time,
    r.duration_minutes,
    r.grace_period_minutes,
    r.max_sitting_minutes,
    r.number_of_guests,
    r.special_requests,
    rt.table_number,
    rt.name as table_name,
    rt.capacity as table_capacity,
    r.status,
    r.actual_arrival_time,
    r.actual_departure_time,
    r.is_late_arrival,
    r.arrival_notes,
    r.created_at,
    CASE 
        WHEN u.id IS NOT NULL THEN CONCAT(u.first_name, ' ', u.last_name)
        ELSE NULL 
    END as registered_user_name,
    u.email as registered_user_email,
    -- Calculated fields
    CASE 
        WHEN r.actual_arrival_time IS NOT NULL AND r.actual_departure_time IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (r.actual_departure_time - r.actual_arrival_time))/60
        ELSE NULL 
    END as actual_duration_minutes,
    CASE 
        WHEN r.actual_arrival_time IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (r.actual_arrival_time - (r.reservation_date + r.reservation_time)::TIMESTAMP))/60
        ELSE NULL 
    END as arrival_delay_minutes
FROM table_reservations r
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
ORDER BY r.reservation_date DESC, r.reservation_time DESC;

-- Add comments for documentation
COMMENT ON COLUMN table_reservations.duration_minutes IS 'Total reserved time slot in minutes (default: 105 = 90 dining + 15 buffer)';
COMMENT ON COLUMN table_reservations.grace_period_minutes IS 'Grace period for late arrivals in minutes (default: 15)';
COMMENT ON COLUMN table_reservations.max_sitting_minutes IS 'Maximum allowed sitting time in minutes (default: 120)';
COMMENT ON COLUMN table_reservations.reservation_end_time IS 'Calculated end time when table should be available again';
COMMENT ON COLUMN table_reservations.actual_arrival_time IS 'Timestamp when customer actually arrived';
COMMENT ON COLUMN table_reservations.actual_departure_time IS 'Timestamp when customer actually left';
COMMENT ON COLUMN table_reservations.is_late_arrival IS 'Boolean indicating if customer arrived after grace period';
COMMENT ON COLUMN table_reservations.arrival_notes IS 'Notes about customer arrival (timing, issues, etc.)';

COMMENT ON FUNCTION get_next_available_slot IS 'Returns the next available time slot for a table on a given date after a specified time';
COMMENT ON FUNCTION check_arrival_status IS 'Checks if customer arrived on time and updates reservation status accordingly';
COMMENT ON FUNCTION mark_table_departed IS 'Marks a table as departed and calculates actual dining duration';

-- Insert sample data to test the new system
INSERT INTO table_reservations (
    customer_name, customer_email, customer_phone, 
    reservation_date, reservation_time, number_of_guests, 
    table_id, special_requests, duration_minutes, grace_period_minutes, max_sitting_minutes
) VALUES 
-- Test reservation for today + 1 day
(
    'Test Customer', 'test@example.com', '+1234567890',
    CURRENT_DATE + 1, '19:00:00', 4, 1, 
    'Test reservation with new duration system',
    105, 15, 120
);

-- Update the reservation_end_time for the test reservation
UPDATE table_reservations 
SET reservation_end_time = (reservation_time + INTERVAL '105 minutes')::TIME
WHERE customer_email = 'test@example.com' AND reservation_end_time IS NULL;

COMMIT;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Reservation Duration Migration Completed Successfully!';
    RAISE NOTICE 'New Features Added:';
    RAISE NOTICE '  ✓ Duration tracking (105 min default)';
    RAISE NOTICE '  ✓ Grace period handling (15 min default)';
    RAISE NOTICE '  ✓ Max sitting time (120 min default)';
    RAISE NOTICE '  ✓ Arrival/departure tracking';
    RAISE NOTICE '  ✓ Late arrival detection';
    RAISE NOTICE '  ✓ Next available slot calculation';
    RAISE NOTICE '  ✓ Updated reservation view with duration info';
    RAISE NOTICE '';
    RAISE NOTICE 'Test with: SELECT * FROM reservation_summary WHERE customer_email = ''test@example.com'';';
END $$;
