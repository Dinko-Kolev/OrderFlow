# Database Seeding and Cleanup Scripts

This directory contains scripts for populating and cleaning up test data in the OrderFlow database.

## 📊 Seed Orders Script (`seed-orders.js`)

### What it does:
- **Generates 6 months of realistic order data** for a small pizzeria
- Creates orders with realistic patterns (weekday vs weekend, seasonal variations)
- Uses existing customers and products from your database
- Generates 8-25 orders per day depending on day of week and season
- Includes realistic order statuses, delivery fees, and timing

### Features:
- **Seasonal Patterns**: January (slow) to December (peak holiday season)
- **Weekly Patterns**: Weekends (15-25 orders) vs Weekdays (8-15 orders)
- **Realistic Timing**: Orders placed between 11 AM - 10 PM
- **Status Distribution**: Based on order age (recent = pending/processing, older = completed)
- **Order Types**: 70% delivery, 30% pickup (with delivery fees)
- **Cancellation Rate**: 5% realistic cancellation rate

### Usage:
```bash
# Run from host machine
docker exec -it project-root-admin-backend-1 npm run seed

# Or run directly in container
docker exec -it project-root-admin-backend-1 node scripts/seed-orders.js
```

### Expected Output:
- Creates approximately **1,000-2,000 orders** across 6 months
- Each order has 1-4 items with realistic quantities
- Orders span from 6 months ago to today
- All required database fields are properly populated

## 🧹 Cleanup Test Data Script (`cleanup-test-data.js`)

### What it does:
- **Safely removes only test data** created by the seed script
- **Preserves existing core data** (customers, products, categories)
- Uses pattern matching to identify test orders (`ORD-XXXXXX-XXX`)
- Handles foreign key constraints properly

### Features:
- **Smart Detection**: Only deletes orders with test order numbers
- **Safe Cleanup**: Removes order items first, then orders
- **Transaction Safety**: Uses database transactions for data integrity
- **Detailed Reporting**: Shows before/after counts

### Usage:
```bash
# Run from host machine
docker exec -it project-root-admin-backend-1 npm run cleanup

# Or run directly in container
docker exec -it project-root-admin-backend-1 node scripts/cleanup-test-data.js
```

## 🚀 Quick Start

1. **Seed the database** with 6 months of realistic data:
   ```bash
   docker exec -it project-root-admin-backend-1 npm run seed
   ```

2. **View the data** in your admin dashboard or database client

3. **Clean up** when you're done testing:
   ```bash
   docker exec -it project-root-admin-backend-1 npm run cleanup
   ```

## 📈 Data Patterns

### Monthly Variations:
- **January-February**: 80-90% of normal volume (winter slow period)
- **March**: 100% normal volume
- **April-May**: 110-120% normal volume (spring pickup)
- **June-August**: 130-140% normal volume (summer peak)
- **September**: 110% normal volume (back to school)
- **October**: 100% normal volume
- **November**: 120% normal volume (holiday prep)
- **December**: 150% normal volume (holiday peak)

### Daily Patterns:
- **Weekdays**: 8-15 orders per day
- **Weekends**: 15-25 orders per day
- **Business Hours**: 11 AM - 10 PM order placement
- **Peak Times**: Lunch (12-2 PM) and Dinner (6-8 PM) have higher order density

## 🔧 Troubleshooting

### Common Issues:
1. **Connection Error**: Ensure Docker containers are running
2. **Permission Error**: Check database credentials in script
3. **Schema Mismatch**: Verify database structure matches expected schema

### Database Requirements:
- `orders` table with all required fields
- `order_items` table with proper foreign keys
- Existing customers and products in database
- Proper database permissions for INSERT/DELETE operations

## 📝 Notes

- **Test Data Only**: These scripts are for development/testing purposes
- **Production Safe**: Cleanup script only removes test data, preserves real data
- **Performance**: Large datasets may take several minutes to process
- **Storage**: 6 months of data requires approximately 50-100MB of database space
