-- Restaurant Configuration Migration
-- This migration adds flexible configuration for restaurant owners to set:
-- 1. Working hours and days
-- 2. Reservation duration settings
-- 3. Time slot intervals
-- 4. Grace periods and policies

BEGIN;

-- Create restaurant configuration table
CREATE TABLE IF NOT EXISTS restaurant_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create working hours table
CREATE TABLE IF NOT EXISTS working_hours (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    day_name VARCHAR(20) NOT NULL,
    is_open BOOLEAN DEFAULT true,
    open_time TIME,
    close_time TIME,
    is_lunch_service BOOLEAN DEFAULT true,
    lunch_start TIME DEFAULT '12:00:00',
    lunch_end TIME DEFAULT '14:30:00',
    is_dinner_service BOOLEAN DEFAULT true,
    dinner_start TIME DEFAULT '19:00:00',
    dinner_end TIME DEFAULT '22:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(day_of_week)
);

-- Create reservation policy table
CREATE TABLE IF NOT EXISTS reservation_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100) UNIQUE NOT NULL,
    policy_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default working hours (Monday-Sunday)
INSERT INTO working_hours (day_of_week, day_name, is_open, open_time, close_time, is_lunch_service, lunch_start, lunch_end, is_dinner_service, dinner_start, dinner_end) VALUES
(1, 'Monday', true, '11:00:00', '23:00:00', true, '12:00:00', '14:30:00', true, '19:00:00', '22:00:00'),
(2, 'Tuesday', true, '11:00:00', '23:00:00', true, '12:00:00', '14:30:00', true, '19:00:00', '22:00:00'),
(3, 'Wednesday', true, '11:00:00', '23:00:00', true, '12:00:00', '14:30:00', true, '19:00:00', '22:00:00'),
(4, 'Thursday', true, '11:00:00', '23:00:00', true, '12:00:00', '14:30:00', true, '19:00:00', '22:00:00'),
(5, 'Friday', true, '11:00:00', '23:00:00', true, '12:00:00', '14:30:00', true, '19:00:00', '22:00:00'),
(6, 'Saturday', true, '11:00:00', '23:00:00', true, '12:00:00', '14:30:00', true, '19:00:00', '22:00:00'),
(0, 'Sunday', true, '11:00:00', '23:00:00', true, '12:00:00', '14:30:00', true, '19:00:00', '22:00:00')
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert default reservation policies
INSERT INTO restaurant_config (config_key, config_value, description) VALUES
('reservation_duration_minutes', '105', 'Default reservation duration in minutes (90 dining + 15 buffer)'),
('grace_period_minutes', '15', 'Grace period for late arrivals in minutes'),
('max_sitting_minutes', '120', 'Maximum time a customer can stay at a table'),
('time_slot_interval_minutes', '30', 'Interval between available time slots in minutes'),
('lunch_buffer_minutes', '15', 'Buffer time between lunch reservations'),
('dinner_buffer_minutes', '15', 'Buffer time between dinner reservations'),
('advance_booking_days', '30', 'How many days in advance customers can book'),
('same_day_booking_hours', '2', 'How many hours before service same-day bookings are allowed'),
('max_party_size', '12', 'Maximum party size for reservations'),
('min_party_size', '1', 'Minimum party size for reservations')
ON CONFLICT (config_key) DO NOTHING;

-- Insert reservation policies
INSERT INTO reservation_policies (policy_name, policy_value, description) VALUES
('allow_same_day_reservations', 'true', 'Whether to allow same-day reservations'),
('require_phone_confirmation', 'false', 'Whether to require phone confirmation for reservations'),
('allow_walk_ins', 'true', 'Whether to allow walk-in customers'),
('cancellation_policy_hours', '24', 'Hours before reservation when cancellation is allowed without penalty'),
('no_show_policy', '3', 'Number of no-shows before customer is blocked from future reservations'),
('deposit_required', 'false', 'Whether to require deposits for reservations'),
('deposit_amount', '0', 'Amount of deposit required if deposits are enabled')
ON CONFLICT (policy_name) DO NOTHING;

-- Create function to get configurable time slots based on working hours
CREATE OR REPLACE FUNCTION get_available_time_slots(
    p_date DATE,
    p_service_type VARCHAR(20) DEFAULT 'both' -- 'lunch', 'dinner', or 'both'
) RETURNS TIME[]
LANGUAGE plpgsql
AS $$
DECLARE
    day_of_week INTEGER;
    working_hour RECORD;
    time_slots TIME[] := ARRAY[]::TIME[];
    start_time TIME;
    end_time TIME;
    interval_minutes INTEGER;
    slot_count INTEGER;
    i INTEGER;
BEGIN
    -- Get day of week (0=Sunday, 1=Monday, etc.)
    day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Get working hours for this day
    SELECT * INTO working_hour 
    FROM working_hours 
    WHERE day_of_week = day_of_week;
    
    -- If restaurant is closed on this day, return empty array
    IF NOT working_hour.is_open THEN
        RETURN time_slots;
    END IF;
    
    -- Get time slot interval from config
    SELECT CAST(config_value AS INTEGER) INTO interval_minutes
    FROM restaurant_config 
    WHERE config_key = 'time_slot_interval_minutes';
    
    -- Generate time slots based on service type
    IF p_service_type = 'lunch' AND working_hour.is_lunch_service THEN
        start_time := working_hour.lunch_start;
        end_time := working_hour.lunch_end;
    ELSIF p_service_type = 'dinner' AND working_hour.is_dinner_service THEN
        start_time := working_hour.dinner_start;
        end_time := working_hour.dinner_end;
    ELSIF p_service_type = 'both' THEN
        -- Generate slots for both services
        time_slots := get_available_time_slots(p_date, 'lunch');
        time_slots := array_cat(time_slots, get_available_time_slots(p_date, 'dinner'));
        RETURN time_slots;
    ELSE
        RETURN time_slots;
    END IF;
    
    -- Calculate number of slots
    slot_count := EXTRACT(EPOCH FROM (end_time - start_time)) / (interval_minutes * 60);
    
    -- Generate time slots
    FOR i IN 0..slot_count-1 LOOP
        time_slots := array_append(time_slots, start_time + (i * interval_minutes || ' minutes')::INTERVAL);
    END LOOP;
    
    RETURN time_slots;
END;
$$;

-- Create function to get configurable reservation duration
CREATE OR REPLACE FUNCTION get_reservation_duration(
    p_service_type VARCHAR(20) DEFAULT 'dinner'
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    base_duration INTEGER;
    buffer_minutes INTEGER;
BEGIN
    -- Get base duration from config
    SELECT CAST(config_value AS INTEGER) INTO base_duration
    FROM restaurant_config 
    WHERE config_key = 'reservation_duration_minutes';
    
    -- Get appropriate buffer based on service type
    IF p_service_type = 'lunch' THEN
        SELECT CAST(config_value AS INTEGER) INTO buffer_minutes
        FROM restaurant_config 
        WHERE config_key = 'lunch_buffer_minutes';
    ELSE
        SELECT CAST(config_value AS INTEGER) INTO buffer_minutes
        FROM restaurant_config 
        WHERE config_key = 'dinner_buffer_minutes';
    END IF;
    
    RETURN base_duration + buffer_minutes;
END;
$$;

-- Update the existing find_next_available_slot function to use configurable values
CREATE OR REPLACE FUNCTION find_next_available_slot(
    p_table_id INTEGER,
    p_date DATE,
    p_after_time TIME DEFAULT '12:00:00',
    p_service_type VARCHAR(20) DEFAULT 'both'
) RETURNS TIME
LANGUAGE plpgsql
AS $$
DECLARE
    next_slot TIME;
    time_slots TIME[];
    slot TIME;
    is_occupied BOOLEAN;
    reservation_duration INTEGER;
    grace_period INTEGER;
BEGIN
    -- Get configurable time slots for this date and service type
    time_slots := get_available_time_slots(p_date, p_service_type);
    
    -- Get configurable reservation duration and grace period
    reservation_duration := get_reservation_duration(p_service_type);
    SELECT CAST(config_value AS INTEGER) INTO grace_period
    FROM restaurant_config 
    WHERE config_key = 'grace_period_minutes';
    
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
                    AND slot < (reservation_time + (reservation_duration || ' minutes')::INTERVAL)::TIME
                    OR
                    -- Existing reservation falls within new slot + buffer time
                    reservation_time >= slot 
                    AND reservation_time < (slot + (reservation_duration || ' minutes')::INTERVAL)::TIME
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

-- Create function to update restaurant configuration
CREATE OR REPLACE FUNCTION update_restaurant_config(
    p_config_key VARCHAR(100),
    p_config_value TEXT,
    p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE restaurant_config 
    SET 
        config_value = p_config_value,
        description = COALESCE(p_description, description),
        updated_at = CURRENT_TIMESTAMP
    WHERE config_key = p_config_key;
    
    IF FOUND THEN
        RETURN true;
    ELSE
        -- Insert new config if it doesn't exist
        INSERT INTO restaurant_config (config_key, config_value, description)
        VALUES (p_config_key, p_config_value, p_description);
        RETURN true;
    END IF;
END;
$$;

-- Create function to update working hours
CREATE OR REPLACE FUNCTION update_working_hours(
    p_day_of_week INTEGER,
    p_is_open BOOLEAN,
    p_open_time TIME DEFAULT NULL,
    p_close_time TIME DEFAULT NULL,
    p_lunch_start TIME DEFAULT NULL,
    p_lunch_end TIME DEFAULT NULL,
    p_dinner_start TIME DEFAULT NULL,
    p_dinner_end TIME DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE working_hours 
    SET 
        is_open = p_is_open,
        open_time = COALESCE(p_open_time, open_time),
        close_time = COALESCE(p_close_time, close_time),
        lunch_start = COALESCE(p_lunch_start, lunch_start),
        lunch_end = COALESCE(p_lunch_end, lunch_end),
        dinner_start = COALESCE(p_dinner_start, dinner_start),
        dinner_end = COALESCE(p_dinner_end, dinner_end),
        updated_at = CURRENT_TIMESTAMP
    WHERE day_of_week = p_day_of_week;
    
    RETURN FOUND;
END;
$$;

-- Create view for restaurant configuration summary
CREATE OR REPLACE VIEW restaurant_config_summary AS
SELECT 
    'Working Hours' as category,
    wh.day_name as item_name,
    CASE 
        WHEN wh.is_open THEN 
            'Open: ' || COALESCE(wh.open_time::text, 'N/A') || ' - ' || COALESCE(wh.close_time::text, 'N/A')
        ELSE 'Closed'
    END as current_value,
    CASE 
        WHEN wh.is_lunch_service THEN 'Lunch: ' || wh.lunch_start || ' - ' || wh.lunch_end
        ELSE 'No lunch service'
    END as lunch_service,
    CASE 
        WHEN wh.is_dinner_service THEN 'Dinner: ' || wh.dinner_start || ' - ' || wh.dinner_end
        ELSE 'No dinner service'
    END as dinner_service
FROM working_hours wh
UNION ALL
SELECT 
    'Reservation Settings' as category,
    rc.config_key as item_name,
    rc.config_value as current_value,
    rc.description as lunch_service,
    NULL as dinner_service
FROM restaurant_config rc
WHERE rc.config_key IN (
    'reservation_duration_minutes',
    'grace_period_minutes', 
    'max_sitting_minutes',
    'time_slot_interval_minutes'
)
UNION ALL
SELECT 
    'Policies' as category,
    rp.policy_name as item_name,
    rp.policy_value as current_value,
    rp.description as lunch_service,
    CASE WHEN rp.is_active THEN 'Active' ELSE 'Inactive' END as dinner_service
FROM reservation_policies rp;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurant_config_updated_at
    BEFORE UPDATE ON restaurant_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_working_hours_updated_at
    BEFORE UPDATE ON working_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_policies_updated_at
    BEFORE UPDATE ON reservation_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert test data to demonstrate the system
DO $$
BEGIN
    RAISE NOTICE 'Restaurant Configuration Migration Completed Successfully!';
    RAISE NOTICE 'New Features Added:';
    RAISE NOTICE '  ✓ Configurable working hours (7 days)';
    RAISE NOTICE '  ✓ Flexible reservation duration settings';
    RAISE NOTICE '  ✓ Configurable time slot intervals';
    RAISE NOTICE '  ✓ Customizable grace periods and policies';
    RAISE NOTICE '  ✓ Dynamic time slot generation';
    RAISE NOTICE '  ✓ Restaurant owner configuration functions';
    RAISE NOTICE '';
    RAISE NOTICE 'Test the new system with:';
    RAISE NOTICE '  SELECT * FROM restaurant_config_summary;';
    RAISE NOTICE '  SELECT get_available_time_slots(CURRENT_DATE, ''lunch'');';
    RAISE NOTICE '  SELECT get_reservation_duration(''dinner'');';
END $$;

COMMIT;
