const BaseEntity = require('../entities/BaseEntity')

class RestaurantTable extends BaseEntity {
  constructor(data = {}) {
    super(data)
    this.table_number = data.table_number || null
    this.name = data.name || null
    this.capacity = data.capacity || 0
    this.min_party_size = data.min_party_size || 1
    this.is_active = data.is_active !== undefined ? data.is_active : true
    this.table_type = data.table_type || 'standard'
    this.location_description = data.location_description || null
  }

  /**
   * Check if table can accommodate party size
   */
  canAccommodate(partySize) {
    return this.is_active && 
           partySize >= this.min_party_size && 
           partySize <= this.capacity
  }

  /**
   * Get table efficiency score for party size
   * Lower score = better fit (less wasted capacity)
   */
  getEfficiencyScore(partySize) {
    if (!this.canAccommodate(partySize)) {
      return Infinity // Invalid choice
    }
    
    const wastedCapacity = this.capacity - partySize
    const efficiencyScore = wastedCapacity + (this.table_type === 'private' ? 5 : 0)
    
    return efficiencyScore
  }
}

class TableService {
  constructor(dbPool) {
    this.dbPool = dbPool
  }

  /**
   * Get all active restaurant tables
   */
  async getAllTables() {
    try {
      const result = await this.dbPool.query(
        'SELECT * FROM restaurant_tables WHERE is_active = true ORDER BY capacity ASC, table_number ASC'
      )
      
      return result.rows.map(row => new RestaurantTable(row))
    } catch (error) {
      console.error('Error fetching restaurant tables:', error)
      throw new Error('Failed to fetch restaurant tables')
    }
  }

  /**
   * Get table by ID
   */
  async getTableById(tableId) {
    try {
      const result = await this.dbPool.query(
        'SELECT * FROM restaurant_tables WHERE id = $1 AND is_active = true',
        [tableId]
      )
      
      if (result.rows.length === 0) {
        return null
      }
      
      return new RestaurantTable(result.rows[0])
    } catch (error) {
      console.error('Error fetching table by ID:', error)
      throw new Error('Failed to fetch table')
    }
  }

  /**
   * Check table availability for specific date and time
   * This method checks for time overlaps with existing reservations
   */
  async checkTableAvailability(tableId, date, time) {
    try {
      // Convert time to minutes for easier comparison
      const [hours, minutes] = time.split(':').map(Number);
      const requestedTimeMinutes = hours * 60 + minutes;
      
      // Check for overlapping reservations
      const result = await this.dbPool.query(
        `SELECT tr.customer_name, tr.number_of_guests, tr.reservation_time, tr.reservation_end_time
         FROM table_reservations tr
         WHERE tr.table_id = $1 
           AND tr.reservation_date = $2 
           AND tr.status NOT IN ('cancelled', 'completed', 'no_show')
           AND (
             -- Check if requested time falls within an existing reservation
             ($3::time >= tr.reservation_time AND $3::time < tr.reservation_end_time)
             OR
             -- Check if existing reservation starts during the requested time slot
             (tr.reservation_time >= $3::time AND tr.reservation_time < ($3::time + INTERVAL '105 minutes'))
           )`,
        [tableId, date, time]
      )
      
      if (result.rows.length === 0) {
        // No overlapping reservations found, table is available
        return { isAvailable: true, existingReservation: null }
      }
      
      // Table is not available due to overlapping reservation
      const existingReservation = result.rows[0]
      return {
        isAvailable: false,
        existingReservation: {
          customerName: existingReservation.customer_name,
          numberOfGuests: existingReservation.number_of_guests,
          startTime: existingReservation.reservation_time,
          endTime: existingReservation.reservation_end_time
        }
      }
    } catch (error) {
      console.error('Error checking table availability:', error)
      throw new Error('Failed to check table availability')
    }
  }

  /**
   * Find best available table for a party
   */
  async findBestAvailableTable(partySize, date, time, excludeTableIds = []) {
    try {
      // Get all active tables that can accommodate the party
      const allTables = await this.getAllTables()
      const suitableTables = allTables.filter(table => 
        table.canAccommodate(partySize) && 
        !excludeTableIds.includes(table.id)
      )
      
      if (suitableTables.length === 0) {
        return null
      }
      
      // Check availability for each suitable table
      const availableTables = []
      
      for (const table of suitableTables) {
        const availability = await this.checkTableAvailability(table.id, date, time)
        if (availability.isAvailable) {
          availableTables.push({
            table,
            efficiencyScore: table.getEfficiencyScore(partySize)
          })
        }
      }
      
      if (availableTables.length === 0) {
        return null
      }
      
      // Sort by efficiency score (best fit first)
      availableTables.sort((a, b) => a.efficiencyScore - b.efficiencyScore)
      
      return availableTables[0].table
    } catch (error) {
      console.error('Error finding best available table:', error)
      throw new Error('Failed to find available table')
    }
  }

  /**
   * Reserve table for specific date and time
   * Note: This method is kept for compatibility but table_availability is no longer used
   * Availability is now checked directly from table_reservations
   */
  async reserveTable(tableId, date, time, reservationId) {
    try {
      // Since we're now checking availability directly from table_reservations,
      // we don't need to maintain a separate table_availability table
      // The reservation itself in table_reservations serves as the availability record
      
      console.log(`✅ Table ${tableId} reserved for ${date} at ${time} (reservation ID: ${reservationId})`)
      
      return { success: true, tableId, date, time, reservationId }
    } catch (error) {
      console.error('Error reserving table:', error)
      throw new Error('Failed to reserve table')
    }
  }

  /**
   * Release table reservation
   */
  async releaseTable(tableId, date, time) {
    try {
      const result = await this.dbPool.query(
        `UPDATE table_availability 
         SET is_available = true, reservation_id = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE table_id = $1 AND reservation_date = $2 AND reservation_time = $3
         RETURNING *`,
        [tableId, date, time]
      )
      
      return result.rows[0]
    } catch (error) {
      console.error('Error releasing table:', error)
      throw new Error('Failed to release table')
    }
  }

  /**
   * Get availability overview for a specific date
   */
  async getAvailabilityOverview(date) {
    try {
      const result = await this.dbPool.query(
        `SELECT 
           rt.id,
           rt.table_number,
           rt.name,
           rt.capacity,
           rt.table_type,
           rt.location_description,
           ta.is_available,
           tr.customer_name,
           tr.number_of_guests
         FROM restaurant_tables rt
         LEFT JOIN table_availability ta ON rt.id = ta.table_id 
           AND ta.reservation_date = $1
         LEFT JOIN table_reservations tr ON ta.reservation_id = tr.id
         WHERE rt.is_active = true
         ORDER BY rt.capacity ASC, rt.table_number ASC`,
        [date]
      )
      
      return result.rows.map(row => ({
        tableId: row.id,
        tableNumber: row.table_number,
        tableName: row.name,
        capacity: row.capacity,
        tableType: row.table_type,
        locationDescription: row.location_description,
        isAvailable: row.is_available !== false, // Default to true if no availability record
        currentReservation: row.is_available === false ? {
          customerName: row.customer_name,
          numberOfGuests: row.number_of_guests
        } : null
      }))
    } catch (error) {
      console.error('Error getting availability overview:', error)
      throw new Error('Failed to get availability overview')
    }
  }

  /**
   * Get time slot availability for a specific date and party size
   */
  async getTimeSlotAvailability(date, partySize = 2) {
    try {
      const allTimeSlots = [
        '12:00:00', '12:30:00', '13:00:00', '13:30:00', '14:00:00', '14:30:00',
        '19:00:00', '19:30:00', '20:00:00', '20:30:00', '21:00:00', '21:30:00', '22:00:00'
      ]
      
      const availability = []
      
      for (const timeSlot of allTimeSlots) {
        const availableTables = await this.getAvailableTablesForTimeSlot(date, timeSlot, partySize)
        const totalCapacity = availableTables.reduce((sum, table) => sum + table.capacity, 0)
        
        availability.push({
          time: timeSlot.substring(0, 5), // Convert to HH:MM format
          availableTables: availableTables.length,
          totalCapacity: totalCapacity,
          available: availableTables.length > 0
        })
      }
      
      return availability
    } catch (error) {
      console.error('Error getting time slot availability:', error)
      throw new Error('Failed to get time slot availability')
    }
  }

  /**
   * Get available tables for a specific time slot and party size
   * This method checks for time overlaps with existing reservations
   */
  async getAvailableTablesForTimeSlot(date, time, partySize = 2) {
    try {
      // Get all active tables that can accommodate the party
      const allTables = await this.getAllTables()
      const availableTables = []
      
      for (const table of allTables) {
        // Check if table can accommodate the party size
        if (!table.canAccommodate(partySize)) {
          continue
        }
        
        // Check if table is available at this specific time
        const availability = await this.checkTableAvailability(table.id, date, time)
        if (availability.isAvailable) {
          availableTables.push(table)
        }
      }
      
      return availableTables
    } catch (error) {
      console.error('Error getting available tables for time slot:', error)
      throw new Error('Failed to get available tables')
    }
  }
}

module.exports = { TableService, RestaurantTable }
