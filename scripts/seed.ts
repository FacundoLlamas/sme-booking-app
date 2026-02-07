/**
 * Database Seed Script
 * Populates database with realistic mock data
 * Run with: npm run seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...');
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();
  await prisma.customer.deleteMany();

  // Seed Businesses
  console.log('🏢 Creating businesses...');
  const businesses = await Promise.all([
    prisma.business.create({
      data: {
        name: 'QuickFix Plumbing Co',
        ownerEmail: 'owner@quickfixplumbing.com',
        timezone: 'America/New_York',
        maxConcurrentBookings: 8,
      },
    }),
    prisma.business.create({
      data: {
        name: 'BrightSpark Electrical Services',
        ownerEmail: 'owner@brightsparkelectric.com',
        timezone: 'America/Los_Angeles',
        maxConcurrentBookings: 6,
      },
    }),
    prisma.business.create({
      data: {
        name: 'ColorPro Painting Plus',
        ownerEmail: 'owner@colorpropainting.com',
        timezone: 'America/Chicago',
        maxConcurrentBookings: 5,
      },
    }),
  ]);
  console.log(`✅ Created ${businesses.length} businesses`);

  // Seed Customers
  console.log('👥 Creating customers...');
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'John Miller', phone: '+1-555-0101', email: 'john.miller@example.com', address: '123 Oak Street, Springfield' } }),
    prisma.customer.create({ data: { name: 'Sarah Johnson', phone: '+1-555-0102', email: 'sarah.j@example.com', address: '456 Maple Ave, Riverside' } }),
    prisma.customer.create({ data: { name: 'Michael Chen', phone: '+1-555-0103', email: 'mchen@example.com', address: '789 Pine Road, Lakeside' } }),
    prisma.customer.create({ data: { name: 'Emily Davis', phone: '+1-555-0104', email: 'emily.davis@example.com', address: '321 Elm Street, Hilltown' } }),
    prisma.customer.create({ data: { name: 'Robert Martinez', phone: '+1-555-0105', email: 'r.martinez@example.com', address: '654 Birch Lane, Mountainview' } }),
    prisma.customer.create({ data: { name: 'Jennifer Wilson', phone: '+1-555-0106', email: 'jwilson@example.com', address: '987 Cedar Court, Valleytown' } }),
    prisma.customer.create({ data: { name: 'David Anderson', phone: '+1-555-0107', email: 'danderson@example.com', address: '147 Spruce Drive, Seaside' } }),
    prisma.customer.create({ data: { name: 'Lisa Thompson', phone: '+1-555-0108', email: 'lisa.t@example.com', address: '258 Willow Way, Forestville' } }),
    prisma.customer.create({ data: { name: 'James Garcia', phone: '+1-555-0109', email: 'jgarcia@example.com', address: '369 Ash Boulevard, Parktown' } }),
    prisma.customer.create({ data: { name: 'Patricia Brown', phone: '+1-555-0110', email: 'pbrown@example.com', address: '741 Poplar Place, Brookside' } }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

  // Seed Services
  console.log('🔧 Creating services...');
  const services = await Promise.all([
    // Plumbing services
    prisma.service.create({ data: { name: 'Leak Repair', category: 'plumbing', durationMinutes: 60, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Drain Cleaning', category: 'plumbing', durationMinutes: 90, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Water Heater Installation', category: 'plumbing', durationMinutes: 180, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Emergency Pipe Burst', category: 'plumbing', durationMinutes: 120, isEmergency: true } }),
    prisma.service.create({ data: { name: 'Toilet Repair', category: 'plumbing', durationMinutes: 45, isEmergency: false } }),
    
    // Electrical services
    prisma.service.create({ data: { name: 'Outlet Installation', category: 'electrical', durationMinutes: 45, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Circuit Breaker Replacement', category: 'electrical', durationMinutes: 90, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Lighting Fixture Installation', category: 'electrical', durationMinutes: 60, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Emergency Power Outage', category: 'electrical', durationMinutes: 120, isEmergency: true } }),
    prisma.service.create({ data: { name: 'Electrical Panel Upgrade', category: 'electrical', durationMinutes: 240, isEmergency: false } }),
    
    // Painting services
    prisma.service.create({ data: { name: 'Interior Room Painting', category: 'painting', durationMinutes: 480, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Exterior House Painting', category: 'painting', durationMinutes: 960, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Cabinet Refinishing', category: 'painting', durationMinutes: 360, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Deck Staining', category: 'painting', durationMinutes: 300, isEmergency: false } }),
    prisma.service.create({ data: { name: 'Touch-up Paint Repair', category: 'painting', durationMinutes: 90, isEmergency: false } }),
  ]);
  console.log(`✅ Created ${services.length} services`);

  // Seed Technicians
  console.log('👷 Creating technicians...');
  const technicians = await Promise.all([
    // Plumbing Co technicians
    prisma.technician.create({ data: { businessId: businesses[0].id, name: 'Tom Plumber', skills: 'leak-repair,drain-cleaning,water-heater', availabilityStatus: 'available' } }),
    prisma.technician.create({ data: { businessId: businesses[0].id, name: 'Alice Waters', skills: 'emergency-plumbing,pipe-repair,installations', availabilityStatus: 'available' } }),
    prisma.technician.create({ data: { businessId: businesses[0].id, name: 'Bob Fixture', skills: 'toilet-repair,faucet-repair,general-plumbing', availabilityStatus: 'busy' } }),
    
    // Electrical Services technicians
    prisma.technician.create({ data: { businessId: businesses[1].id, name: 'Spark Johnson', skills: 'wiring,outlets,lighting', availabilityStatus: 'available' } }),
    prisma.technician.create({ data: { businessId: businesses[1].id, name: 'Wanda Voltage', skills: 'panel-upgrades,circuit-breakers,emergency-electrical', availabilityStatus: 'available' } }),
    prisma.technician.create({ data: { businessId: businesses[1].id, name: 'Mike Current', skills: 'residential-electrical,commercial-electrical', availabilityStatus: 'offline' } }),
    
    // Painting Plus technicians
    prisma.technician.create({ data: { businessId: businesses[2].id, name: 'Pablo Brush', skills: 'interior-painting,exterior-painting,color-consultation', availabilityStatus: 'available' } }),
    prisma.technician.create({ data: { businessId: businesses[2].id, name: 'Rosa Canvas', skills: 'cabinet-refinishing,deck-staining,specialty-finishes', availabilityStatus: 'available' } }),
  ]);
  console.log(`✅ Created ${technicians.length} technicians`);

  // Seed Bookings
  console.log('📅 Creating bookings...');
  const now = new Date();
  const bookings = await Promise.all([
    // Past bookings (completed)
    prisma.booking.create({ 
      data: { 
        customerId: customers[0].id, 
        businessId: businesses[0].id, 
        serviceId: services[0].id,  // Leak Repair
        serviceType: 'Leak Repair', 
        bookingTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 
        status: 'completed',
        notes: 'Fixed kitchen sink leak' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[1].id, 
        businessId: businesses[1].id, 
        serviceId: services[5].id,  // Outlet Installation
        serviceType: 'Outlet Installation', 
        bookingTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), 
        status: 'completed',
        notes: 'Installed 3 outlets in garage' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[2].id, 
        businessId: businesses[2].id, 
        serviceId: services[10].id,  // Interior Room Painting
        serviceType: 'Interior Room Painting', 
        bookingTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), 
        status: 'completed',
        notes: 'Painted master bedroom' 
      } 
    }),

    prisma.booking.create({ 
      data: { 
        customerId: customers[3].id, 
        businessId: businesses[0].id, 
        serviceId: services[1].id,  // Drain Cleaning
        serviceType: 'Drain Cleaning', 
        bookingTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), 
        status: 'completed' 
      } 
    }),
    
    // Recent bookings (confirmed)
    prisma.booking.create({ 
      data: { 
        customerId: customers[4].id, 
        businessId: businesses[1].id, 
        serviceId: services[7].id,  // Lighting Fixture Installation
        serviceType: 'Lighting Fixture Installation', 
        bookingTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), 
        status: 'confirmed',
        notes: 'Install chandelier in dining room' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[5].id, 
        businessId: businesses[0].id, 
        serviceId: services[4].id,  // Toilet Repair
        serviceType: 'Toilet Repair', 
        bookingTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), 
        status: 'confirmed' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[6].id, 
        businessId: businesses[2].id, 
        serviceId: services[12].id,  // Cabinet Refinishing
        serviceType: 'Cabinet Refinishing', 
        bookingTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), 
        status: 'confirmed',
        notes: 'Kitchen cabinets - white finish' 
      } 
    }),
    
    // Pending bookings
    prisma.booking.create({ 
      data: { 
        customerId: customers[7].id, 
        businessId: businesses[1].id, 
        serviceId: services[6].id,  // Circuit Breaker Replacement
        serviceType: 'Circuit Breaker Replacement', 
        bookingTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), 
        status: 'pending' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[8].id, 
        businessId: businesses[0].id, 
        serviceId: services[2].id,  // Water Heater Installation
        serviceType: 'Water Heater Installation', 
        bookingTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), 
        status: 'pending',
        notes: '50 gallon tank' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[9].id, 
        businessId: businesses[2].id, 
        serviceId: services[11].id,  // Exterior House Painting
        serviceType: 'Exterior House Painting', 
        bookingTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), 
        status: 'pending',
        notes: 'Full exterior - blue/white trim' 
      } 
    }),
    
    // More varied bookings
    prisma.booking.create({ 
      data: { 
        customerId: customers[0].id, 
        businessId: businesses[1].id, 
        serviceId: services[9].id,  // Electrical Panel Upgrade
        serviceType: 'Electrical Panel Upgrade', 
        bookingTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), 
        status: 'confirmed' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[2].id, 
        businessId: businesses[0].id, 
        serviceId: services[3].id,  // Emergency Pipe Burst
        serviceType: 'Emergency Pipe Burst', 
        bookingTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), 
        status: 'completed',
        notes: 'Emergency call - basement flooding' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[4].id, 
        businessId: businesses[2].id, 
        serviceId: services[13].id,  // Deck Staining
        serviceType: 'Deck Staining', 
        bookingTime: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), 
        status: 'pending',
        notes: 'Backyard deck - mahogany stain' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[6].id, 
        businessId: businesses[1].id, 
        serviceId: services[8].id,  // Emergency Power Outage
        serviceType: 'Emergency Power Outage', 
        bookingTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), 
        status: 'completed',
        notes: 'Resolved electrical fault' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[1].id, 
        businessId: businesses[2].id, 
        serviceId: services[14].id,  // Touch-up Paint Repair
        serviceType: 'Touch-up Paint Repair', 
        bookingTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), 
        status: 'confirmed' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[3].id, 
        businessId: businesses[1].id, 
        serviceId: services[5].id,  // Outlet Installation
        serviceType: 'Outlet Installation', 
        bookingTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), 
        status: 'pending' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[5].id, 
        businessId: businesses[0].id, 
        serviceId: services[0].id,  // Leak Repair
        serviceType: 'Leak Repair', 
        bookingTime: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), 
        status: 'confirmed' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[7].id, 
        businessId: businesses[2].id, 
        serviceId: services[10].id,  // Interior Room Painting
        serviceType: 'Interior Room Painting', 
        bookingTime: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), 
        status: 'pending',
        notes: 'Living room and hallway' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[8].id, 
        businessId: businesses[1].id, 
        serviceId: services[7].id,  // Lighting Fixture Installation
        serviceType: 'Lighting Fixture Installation', 
        bookingTime: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), 
        status: 'pending' 
      } 
    }),
    prisma.booking.create({ 
      data: { 
        customerId: customers[9].id, 
        businessId: businesses[0].id, 
        serviceId: services[1].id,  // Drain Cleaning
        serviceType: 'Drain Cleaning', 
        bookingTime: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000), 
        status: 'confirmed' 
      } 
    }),
  ]);
  console.log(`✅ Created ${bookings.length} bookings`);

  // Seed Settings
  console.log('⚙️  Creating settings...');
  const settings = await Promise.all([
    prisma.setting.create({ data: { businessId: businesses[0].id, key: 'working_hours_start', value: '08:00' } }),
    prisma.setting.create({ data: { businessId: businesses[0].id, key: 'working_hours_end', value: '18:00' } }),
    prisma.setting.create({ data: { businessId: businesses[0].id, key: 'emergency_surcharge', value: '1.5' } }),
    prisma.setting.create({ data: { businessId: businesses[1].id, key: 'working_hours_start', value: '07:00' } }),
    prisma.setting.create({ data: { businessId: businesses[1].id, key: 'working_hours_end', value: '19:00' } }),
    prisma.setting.create({ data: { businessId: businesses[2].id, key: 'working_hours_start', value: '09:00' } }),
    prisma.setting.create({ data: { businessId: businesses[2].id, key: 'working_hours_end', value: '17:00' } }),
  ]);
  console.log(`✅ Created ${settings.length} settings`);

  // Seed Waitlist
  console.log('⏳ Creating waitlist entries...');
  const waitlist = await Promise.all([
    prisma.waitlist.create({ data: { customerId: customers[0].id, businessId: businesses[0].id, serviceType: 'Emergency Pipe Burst' } }),
    prisma.waitlist.create({ data: { customerId: customers[3].id, businessId: businesses[1].id, serviceType: 'Electrical Panel Upgrade' } }),
    prisma.waitlist.create({ data: { customerId: customers[5].id, businessId: businesses[2].id, serviceType: 'Exterior House Painting' } }),
  ]);
  console.log(`✅ Created ${waitlist.length} waitlist entries`);

  console.log('\n✨ Seed completed successfully!');
  console.log(`
  📊 Summary:
    - ${businesses.length} businesses
    - ${customers.length} customers
    - ${services.length} services
    - ${technicians.length} technicians
    - ${bookings.length} bookings
    - ${settings.length} settings
    - ${waitlist.length} waitlist entries
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
