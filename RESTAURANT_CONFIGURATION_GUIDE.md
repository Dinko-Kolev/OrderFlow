# Restaurant Configuration System Guide

## Overview

The OrderFlow restaurant system now includes a comprehensive, flexible configuration system that allows restaurant owners to customize their operational settings without hardcoded values. This system replaces the previous static configuration with dynamic, database-driven settings.

## 🎯 **Key Benefits**

### ✅ **Before (Hardcoded)**
- Fixed time slots: `'12:00:00', '12:30:00', '13:00:00'...`
- Static duration: `105 minutes` always
- Hardcoded working hours in functions
- No flexibility for different restaurant types

### ✅ **After (Configurable)**
- Dynamic time slots based on working hours
- Configurable reservation durations per service type
- Flexible working hours per day
- Restaurant-specific policies and rules

---

## 🏗️ **System Architecture**

### **Database Tables**

#### 1. `restaurant_config`
Stores key-value configuration pairs:
```sql
- reservation_duration_minutes: 105
- grace_period_minutes: 15
- max_sitting_minutes: 120
- time_slot_interval_minutes: 30
- lunch_buffer_minutes: 15
- dinner_buffer_minutes: 15
```

#### 2. `working_hours`
Defines operational hours for each day:
```sql
- day_of_week: 0-6 (Sunday=0, Monday=1...)
- is_open: true/false
- open_time / close_time: Overall hours
- is_lunch_service: true/false
- lunch_start / lunch_end: Lunch service hours
- is_dinner_service: true/false
- dinner_start / dinner_end: Dinner service hours
```

#### 3. `reservation_policies`
Business rules and policies:
```sql
- allow_same_day_reservations: true/false
- require_phone_confirmation: true/false
- allow_walk_ins: true/false
- cancellation_policy_hours: 24
- no_show_policy: 3
```

---

## 🛠️ **Configuration Functions**

### **Dynamic Time Slot Generation**
```sql
SELECT get_available_time_slots('2025-08-22', 'lunch');
-- Returns: {12:00:00,12:30:00,13:00:00,13:30:00,14:00:00}

SELECT get_available_time_slots('2025-08-22', 'dinner');  
-- Returns: {19:00:00,19:30:00,20:00:00,20:30:00,21:00:00,21:30:00}

SELECT get_available_time_slots('2025-08-22', 'both');
-- Returns: Combined lunch + dinner slots
```

### **Configurable Reservation Duration**
```sql
SELECT get_reservation_duration('lunch');
-- Returns: 120 (105 base + 15 lunch buffer)

SELECT get_reservation_duration('dinner');
-- Returns: 120 (105 base + 15 dinner buffer)
```

### **Intelligent Availability Checking**
```sql
SELECT find_next_available_slot(1, '2025-08-22', '14:00:00', 'dinner');
-- Returns: First available dinner slot for table 1 after 2:00 PM
```

---

## 🎛️ **Admin Dashboard Interface**

### **Restaurant Settings Page** (`/restaurant-settings`)

#### **Working Hours Tab**
- **Per-Day Configuration**: Set different hours for each day of the week
- **Service Type Control**: Enable/disable lunch and dinner services independently
- **Individual Save**: Save each day's settings independently
- **Visual Status**: Open/Closed badges with toggle switches

#### **Reservation Settings Tab**
- **Duration Management**: Set base reservation duration (e.g., 105 minutes)
- **Grace Period**: Configure late arrival tolerance (e.g., 15 minutes)
- **Time Intervals**: Set slot intervals (e.g., 30 minutes apart)
- **Booking Policies**: Advance booking days, same-day booking hours
- **Party Size Limits**: Min/max party sizes

#### **Policies Tab**
- **Toggle Switches**: Enable/disable policies with visual switches
- **Custom Values**: Numeric inputs for policy values
- **Active/Inactive**: Control which policies are enforced
- **Descriptions**: Clear explanations for each policy

---

## 🔧 **API Endpoints**

### **Configuration Management**
```javascript
// Get all configuration
GET /api/admin/restaurant/config

// Update configuration
PUT /api/admin/restaurant/config
Body: { "config_key": "reservation_duration_minutes", "config_value": "120" }
```

### **Working Hours Management**
```javascript
// Get all working hours
GET /api/admin/restaurant/working-hours

// Update specific day
PUT /api/admin/restaurant/working-hours/1  // Monday = 1
Body: {
  "is_open": true,
  "open_time": "10:00:00",
  "close_time": "23:00:00",
  "is_lunch_service": true,
  "lunch_start": "11:30:00",
  "lunch_end": "15:00:00"
}
```

### **Policy Management**
```javascript
// Get all policies
GET /api/admin/restaurant/policies

// Update specific policy
PUT /api/admin/restaurant/policies/allow_same_day_reservations
Body: { "policy_value": "false", "is_active": true }
```

### **Dynamic Data Queries**
```javascript
// Get time slots for specific date
GET /api/admin/restaurant/time-slots/2025-08-22?service_type=lunch

// Get reservation duration
GET /api/admin/restaurant/reservation-duration/dinner

// Get configuration summary
GET /api/admin/restaurant/summary
```

---

## 📋 **Usage Examples**

### **Example 1: Changing Business Hours**
**Scenario**: Restaurant wants to open earlier on weekends

```sql
-- Update Saturday hours
SELECT update_working_hours(
  6,              -- Saturday
  true,           -- is_open
  '10:00:00',     -- open_time (1 hour earlier)
  '23:00:00',     -- close_time
  '11:00:00',     -- lunch_start (1 hour earlier)
  '15:00:00',     -- lunch_end
  '18:00:00',     -- dinner_start
  '22:00:00'      -- dinner_end
);
```

### **Example 2: Adjusting Reservation Duration**
**Scenario**: Restaurant wants longer dinner reservations

```sql
-- Increase dinner buffer time
SELECT update_restaurant_config(
  'dinner_buffer_minutes', 
  '20',  -- Changed from 15 to 20 minutes
  'Extended buffer time for dinner service'
);
```

### **Example 3: Seasonal Policy Changes**
**Scenario**: Disable same-day reservations during busy season

```sql
-- Update policy
UPDATE reservation_policies 
SET policy_value = 'false', is_active = true 
WHERE policy_name = 'allow_same_day_reservations';
```

---

## 🎨 **Customization Scenarios**

### **Scenario A: Fast-Casual Restaurant**
```sql
-- Shorter slots, faster turnover
UPDATE restaurant_config SET config_value = '60' WHERE config_key = 'reservation_duration_minutes';
UPDATE restaurant_config SET config_value = '15' WHERE config_key = 'time_slot_interval_minutes';
UPDATE restaurant_config SET config_value = '5' WHERE config_key = 'grace_period_minutes';
```

### **Scenario B: Fine Dining Restaurant**
```sql
-- Longer slots, more relaxed pace
UPDATE restaurant_config SET config_value = '150' WHERE config_key = 'reservation_duration_minutes';
UPDATE restaurant_config SET config_value = '60' WHERE config_key = 'time_slot_interval_minutes';
UPDATE restaurant_config SET config_value = '20' WHERE config_key = 'grace_period_minutes';
```

### **Scenario C: Lunch-Only Cafe**
```sql
-- Disable dinner service
UPDATE working_hours SET is_dinner_service = false;
UPDATE working_hours SET close_time = '16:00:00';
```

---

## 🧪 **Testing the System**

### **Database Functions**
```sql
-- Test time slot generation for today
SELECT get_available_time_slots(CURRENT_DATE, 'lunch');
SELECT get_available_time_slots(CURRENT_DATE, 'dinner');
SELECT get_available_time_slots(CURRENT_DATE, 'both');

-- Test duration calculation
SELECT get_reservation_duration('lunch');
SELECT get_reservation_duration('dinner');

-- Test next available slot
SELECT find_next_available_slot(1, CURRENT_DATE, '14:00:00', 'dinner');
```

### **API Testing**
```bash
# Test configuration endpoint
curl http://localhost:3003/api/admin/restaurant/config

# Test working hours
curl http://localhost:3003/api/admin/restaurant/working-hours

# Test time slots
curl http://localhost:3003/api/admin/restaurant/time-slots/2025-08-22?service_type=lunch

# Test policies
curl http://localhost:3003/api/admin/restaurant/policies
```

---

## 🔄 **Migration Notes**

### **From Static to Dynamic**
1. **Old System**: Hardcoded time slots in functions
2. **New System**: Database-driven configuration
3. **Backward Compatibility**: Functions updated to use configurable values
4. **Data Migration**: Default values preserve existing behavior

### **Configuration Defaults**
The system ships with sensible defaults:
- **Reservation Duration**: 105 minutes (90 dining + 15 buffer)
- **Grace Period**: 15 minutes for late arrivals
- **Time Slots**: 30-minute intervals
- **Working Hours**: 11:00 AM - 11:00 PM daily
- **Services**: Both lunch (12:00-14:30) and dinner (19:00-22:00) enabled

---

## 🚀 **Future Enhancements**

### **Planned Features**
1. **Seasonal Configurations**: Different settings for holidays/seasons
2. **Table-Specific Rules**: Different duration by table type
3. **Dynamic Pricing**: Time-based pricing rules
4. **Auto-Optimization**: AI-suggested optimal settings
5. **Multi-Location**: Support for restaurant chains
6. **Template System**: Predefined restaurant type templates

### **Integration Opportunities**
- **External Calendars**: Sync with Google Calendar for closures
- **POS Integration**: Dynamic rules based on POS data
- **Weather API**: Adjust policies based on weather
- **Analytics Dashboard**: Configuration impact analysis

---

## 📞 **Support & Troubleshooting**

### **Common Issues**

#### **Time Slots Not Generating**
```sql
-- Check if restaurant is open on the requested day
SELECT * FROM working_hours WHERE day_of_week = EXTRACT(DOW FROM CURRENT_DATE);

-- Check if service is enabled
SELECT is_lunch_service, is_dinner_service FROM working_hours WHERE day_of_week = 1; -- Monday
```

#### **Reservation Duration Issues**
```sql
-- Check current configuration
SELECT * FROM restaurant_config WHERE config_key LIKE '%duration%';

-- Test duration calculation
SELECT get_reservation_duration('lunch'), get_reservation_duration('dinner');
```

#### **API Endpoints Not Working**
1. Ensure admin-backend service is running
2. Check restaurant routes are properly registered
3. Verify database migration completed successfully

### **Reset to Defaults**
```sql
-- Reset all configuration to defaults
SELECT * FROM reset_restaurant_defaults();
```

---

## 🎉 **Success Metrics**

With this flexible configuration system, restaurant owners can:

- ✅ **Adapt to Business Needs**: Change settings without code changes
- ✅ **Optimize Operations**: Fine-tune timing for maximum efficiency
- ✅ **Handle Seasonality**: Adjust for busy/slow periods
- ✅ **Support Growth**: Scale configuration as business grows
- ✅ **Reduce Support**: Self-service configuration management

The system transforms OrderFlow from a rigid, one-size-fits-all solution into a flexible, restaurant-specific platform that grows with your business! 🍕✨
