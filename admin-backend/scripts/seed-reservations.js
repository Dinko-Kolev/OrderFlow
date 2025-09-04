const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'orderflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
});

// Sample reservation data
const sampleReservations = [
  {
    customer_name: 'John Smith',
    customer_email: 'john.smith@example.com',
    customer_phone: '+1234567890',
    reservation_date: '2024-01-20',
    reservation_time: '19:00:00',
    number_of_guests: 4,
    special_requests: 'Window table preferred',
    status: 'confirmed'
  },
  {
    customer_name: 'Maria Garcia',
    customer_email: 'maria.garcia@example.com',
    customer_phone: '+1234567891',
    reservation_date: '2024-01-20',
    reservation_time: '20:00:00',
    number_of_guests: 2,
    special_requests: 'Quiet table please',
    status: 'confirmed'
  },
  {
    customer_name: 'David Johnson',
    customer_email: 'david.johnson@example.com',
    customer_phone: '+1234567892',
    reservation_date: '2024-01-21',
    reservation_time: '18:30:00',
    number_of_guests: 6,
    special_requests: 'Birthday celebration',
    status: 'confirmed'
  },
  {
    customer_name: 'Sarah Wilson',
    customer_email: 'sarah.wilson@example.com',
    customer_phone: '+1234567893',
    reservation_date: '2024-01-21',
    reservation_time: '19:30:00',
    number_of_guests: 3,
    special_requests: 'High chair needed',
    status: 'confirmed'
  },
  {
    customer_name: 'Michael Brown',
    customer_email: 'michael.brown@example.com',
    customer_phone: '+1234567894',
    reservation_date: '2024-01-22',
    reservation_time: '20:00:00',
    number_of_guests: 6,
    special_requests: 'Business dinner',
    status: 'confirmed'
  },
  {
    customer_name: 'Lisa Davis',
    customer_email: 'lisa.davis@example.com',
    customer_phone: '+1234567895',
    reservation_date: '2024-01-22',
    reservation_time: '18:00:00',
    number_of_guests: 2,
    special_requests: 'Anniversary dinner',
    status: 'confirmed'
  },
  {
    customer_name: 'Robert Miller',
    customer_email: 'robert.miller@example.com',
    customer_phone: '+1234567896',
    reservation_date: '2024-01-23',
    reservation_time: '19:00:00',
    number_of_guests: 5,
    special_requests: 'Family gathering',
    status: 'confirmed'
  },
  {
    customer_name: 'Jennifer Taylor',
    customer_email: 'jennifer.taylor@example.com',
    customer_phone: '+1234567897',
    reservation_date: '2024-01-23',
    reservation_time: '20:30:00',
    number_of_guests: 4,
    special_requests: 'Date night',
    status: 'confirmed'
  },
  {
    customer_name: 'Christopher Anderson',
    customer_email: 'christopher.anderson@example.com',
    customer_phone: '+1234567898',
    reservation_date: '2024-01-24',
    reservation_time: '18:30:00',
    number_of_guests: 3,
    special_requests: 'Vegetarian options needed',
    status: 'confirmed'
  },
  {
    customer_name: 'Amanda Thomas',
    customer_email: 'amanda.thomas@example.com',
    customer_phone: '+1234567899',
    reservation_date: '2024-01-24',
    reservation_time: '19:30:00',
    number_of_guests: 6,
    special_requests: 'Group celebration',
    status: 'confirmed'
  }
];

async function seedReservations() {
  const client = await pool.connect();
  
  try {
    console.log('🍽️  Starting reservation seeding...');
    
    // Get available tables
    const tablesResult = await client.query('SELECT id, capacity FROM restaurant_tables WHERE is_active = true ORDER BY capacity');
    const tables = tablesResult.rows;
    
    if (tables.length === 0) {
      console.log('❌ No active tables found. Please ensure tables are created first.');
      return;
    }
    
    console.log(`📋 Found ${tables.length} active tables`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const reservation of sampleReservations) {
      try {
        // Find appropriate table based on guest count
        const suitableTable = tables.find(table => 
          table.capacity >= reservation.number_of_guests
        );
        
        if (!suitableTable) {
          console.log(`⚠️  No suitable table found for ${reservation.number_of_guests} guests`);
          skippedCount++;
          continue;
        }
        
        // Calculate end time for availability check
        const [hours, minutes] = reservation.reservation_time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + 105;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;
        
        // Check if table is available at the requested time
        const availabilityCheck = await client.query(`
          SELECT COUNT(*) as conflict_count
          FROM table_reservations 
          WHERE table_id = $1 
          AND reservation_date = $2 
          AND (
            (reservation_time <= $3 AND reservation_end_time > $3) OR
            (reservation_time < $4 AND reservation_end_time >= $4) OR
            (reservation_time >= $3 AND reservation_end_time <= $4)
          )
          AND status IN ('confirmed', 'pending')
        `, [
          suitableTable.id,
          reservation.reservation_date,
          reservation.reservation_time,
          endTime
        ]);
        
        if (parseInt(availabilityCheck.rows[0].conflict_count) > 0) {
          console.log(`⚠️  Table ${suitableTable.id} not available at ${reservation.reservation_time} on ${reservation.reservation_date}`);
          skippedCount++;
          continue;
        }
        
        // Use the end time we already calculated
        const reservationEndTime = endTime;
        
        // Insert reservation
        const insertResult = await client.query(`
          INSERT INTO table_reservations (
            customer_name, customer_email, customer_phone,
            reservation_date, reservation_time, reservation_end_time,
            number_of_guests, table_id, special_requests, status,
            duration_minutes, grace_period_minutes, max_sitting_minutes,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          RETURNING id
        `, [
          reservation.customer_name,
          reservation.customer_email,
          reservation.customer_phone,
          reservation.reservation_date,
          reservation.reservation_time,
          reservationEndTime,
          reservation.number_of_guests,
          suitableTable.id,
          reservation.special_requests,
          reservation.status,
          105, // duration_minutes
          15,  // grace_period_minutes
          120  // max_sitting_minutes
        ]);
        
        console.log(`✅ Created reservation ${insertResult.rows[0].id} for ${reservation.customer_name} at table ${suitableTable.id}`);
        createdCount++;
        
      } catch (error) {
        console.log(`❌ Error creating reservation for ${reservation.customer_name}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 Reservation seeding completed!`);
    console.log(`✅ Created: ${createdCount} reservations`);
    console.log(`⚠️  Skipped: ${skippedCount} reservations`);
    
    // Show summary
    const totalReservations = await client.query('SELECT COUNT(*) as count FROM table_reservations');
    console.log(`📊 Total reservations in database: ${totalReservations.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error seeding reservations:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedReservations().catch(console.error);
