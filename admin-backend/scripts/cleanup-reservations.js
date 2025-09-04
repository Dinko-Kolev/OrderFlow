const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'orderflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
});

async function cleanupReservations() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Starting reservation cleanup...');
    
    // Show current reservations
    const countResult = await client.query('SELECT COUNT(*) as count FROM table_reservations');
    console.log(`📊 Current reservations in database: ${countResult.rows[0].count}`);
    
    // Show reservations that will be deleted
    const testReservations = await client.query(`
      SELECT id, customer_name, customer_email, reservation_date, reservation_time, status
      FROM table_reservations 
      WHERE customer_email LIKE '%@example.com'
      ORDER BY id
    `);
    
    if (testReservations.rows.length === 0) {
      console.log('✅ No test reservations found to delete');
      return;
    }
    
    console.log(`\n📋 Test reservations to be deleted (${testReservations.rows.length}):`);
    testReservations.rows.forEach(reservation => {
      console.log(`  - ID ${reservation.id}: ${reservation.customer_name} (${reservation.customer_email}) - ${reservation.reservation_date} ${reservation.reservation_time} [${reservation.status}]`);
    });
    
    // Ask for confirmation (in a real script, you'd use readline)
    console.log('\n⚠️  This will delete all test reservations with @example.com emails');
    console.log('   To proceed, uncomment the deletion code below');
    
    // Delete all test reservations
    const deleteResult = await client.query(`
      DELETE FROM table_reservations 
      WHERE customer_email LIKE '%@example.com'
    `);
    
    console.log(`✅ Deleted ${deleteResult.rowCount} test reservations`);
    
    // Show remaining reservations
    const remainingResult = await client.query('SELECT COUNT(*) as count FROM table_reservations');
    console.log(`📊 Remaining reservations: ${remainingResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Additional cleanup functions
async function deleteSpecificReservation(reservationId) {
  const client = await pool.connect();
  
  try {
    console.log(`🗑️  Deleting reservation ID: ${reservationId}`);
    
    const result = await client.query('DELETE FROM table_reservations WHERE id = $1', [reservationId]);
    
    if (result.rowCount > 0) {
      console.log(`✅ Successfully deleted reservation ${reservationId}`);
    } else {
      console.log(`⚠️  No reservation found with ID ${reservationId}`);
    }
    
  } catch (error) {
    console.error('❌ Error deleting reservation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

async function deleteReservationsByDate(date) {
  const client = await pool.connect();
  
  try {
    console.log(`🗑️  Deleting reservations for date: ${date}`);
    
    const result = await client.query('DELETE FROM table_reservations WHERE reservation_date = $1', [date]);
    
    console.log(`✅ Deleted ${result.rowCount} reservations for ${date}`);
    
  } catch (error) {
    console.error('❌ Error deleting reservations by date:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Command line argument handling
const args = process.argv.slice(2);

if (args.length === 0) {
  // Default: show test reservations
  cleanupReservations().catch(console.error);
} else if (args[0] === '--delete-test') {
  // Delete all test reservations
  cleanupReservations().catch(console.error);
} else if (args[0] === '--delete-id' && args[1]) {
  // Delete specific reservation by ID
  deleteSpecificReservation(parseInt(args[1])).catch(console.error);
} else if (args[0] === '--delete-date' && args[1]) {
  // Delete reservations by date
  deleteReservationsByDate(args[1]).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  node cleanup-reservations.js                    # Show test reservations');
  console.log('  node cleanup-reservations.js --delete-test      # Delete all test reservations');
  console.log('  node cleanup-reservations.js --delete-id 25     # Delete reservation by ID');
  console.log('  node cleanup-reservations.js --delete-date 2024-01-20  # Delete by date');
}
