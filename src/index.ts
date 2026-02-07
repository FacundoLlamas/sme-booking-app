/**
 * SME Booking App - Entry Point
 * Example usage of database utilities
 */

import { getDatabase } from '../db/init.js';
import {
  getDatabaseStats,
  getBookings,
  getCustomer,
  createCustomer,
} from './lib/db/queries.js';

async function main() {
  console.log('🚀 SME Booking App - Database Demo\n');

  // Initialize database
  const db = getDatabase();
  console.log('✅ Database initialized\n');

  // Get statistics
  console.log('📊 Database Statistics:');
  const stats = await getDatabaseStats();
  console.log(stats);
  console.log('');

  // Example: Get recent bookings
  console.log('📅 Recent Bookings (Pending):');
  const pendingBookings = await getBookings({ status: 'pending' });
  console.log(`Found ${pendingBookings.length} pending bookings`);
  
  if (pendingBookings.length > 0) {
    pendingBookings.slice(0, 3).forEach((booking) => {
      console.log(`  - ${booking.serviceType} on ${booking.bookingTime.toLocaleDateString()}`);
      console.log(`    Customer: ${booking.customer.name}`);
      console.log(`    Business: ${booking.business.name}`);
      console.log('');
    });
  }

  // Example: Get confirmed bookings
  console.log('✅ Confirmed Bookings:');
  const confirmedBookings = await getBookings({ status: 'confirmed' });
  console.log(`Found ${confirmedBookings.length} confirmed bookings\n`);

  // Example: Create a new customer (if none exist)
  if (stats.customers === 0) {
    console.log('👤 Creating sample customer...');
    const newCustomer = await createCustomer({
      name: 'Demo User',
      phone: '+1-555-DEMO',
      email: 'demo@example.com',
      address: '123 Demo Street',
    });
    console.log(`Created customer: ${newCustomer.name} (ID: ${newCustomer.id})\n`);
  } else {
    console.log('👤 Sample Customer:');
    const customer = await getCustomer(1);
    if (customer) {
      console.log(`  Name: ${customer.name}`);
      console.log(`  Phone: ${customer.phone}`);
      console.log(`  Email: ${customer.email || 'N/A'}\n`);
    }
  }

  console.log('✨ Demo complete!');
  console.log('\n💡 Tip: Run "npm run prisma:studio" to explore the database visually');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;
