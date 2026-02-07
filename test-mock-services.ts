/**
 * Test Script for Mock Services
 * Tests all mock implementations locally
 */

// Set environment variables to force mock mode
process.env.ANTHROPIC_API_KEY = 'mock';
process.env.TWILIO_MOCK = 'true';
process.env.SENDGRID_MOCK = 'true';
process.env.GOOGLE_CALENDAR_MOCK = 'true';

import { createMessage, classifyServiceRequest } from './src/lib/llm';
import { sendSMS, confirmationSMS, reminderSMS_24h, getSMSStats } from './src/lib/sms';
import {
  sendEmail,
  confirmationEmail,
  reminderEmail_24h,
  getEmailStats,
  getEmailPreviewPath,
} from './src/lib/email';
import {
  getAvailability,
  createEvent,
  deleteEvent,
  updateEvent,
  getCalendarStats,
} from './src/lib/google';

async function testLLMService() {
  console.log('\n=== Testing Mock LLM Service ===\n');

  // Test 1: Sink leak classification
  console.log('Test 1: Classify "My sink is leaking"');
  const response1 = await createMessage({ prompt: 'My sink is leaking' });
  const classification1 = JSON.parse(response1.content);
  console.log('✓ Service Type:', classification1.service_type);
  console.log('✓ Urgency:', classification1.urgency);
  console.log('✓ Confidence:', classification1.confidence);
  console.log('✓ Tokens:', response1.tokens);

  // Test 2: Light switch classification
  console.log('\nTest 2: Classify "Light switch is broken"');
  const classification2 = classifyServiceRequest('Light switch is broken');
  console.log('✓ Service Type:', classification2.service_type);
  console.log('✓ Urgency:', classification2.urgency);

  // Test 3: Painting request
  console.log('\nTest 3: Classify "I want to paint my room"');
  const classification3 = classifyServiceRequest('I want to paint my room');
  console.log('✓ Service Type:', classification3.service_type);
  console.log('✓ Urgency:', classification3.urgency);

  console.log('\n✅ LLM Service Tests Passed!');
}

async function testSMSService() {
  console.log('\n=== Testing Mock SMS Service ===\n');

  // Test 1: Send confirmation SMS
  console.log('Test 1: Send confirmation SMS');
  const message1 = confirmationSMS('BK12345', '2026-02-10', '10:00 AM', 'SME Services');
  const result1 = await sendSMS('+14155551234', message1);
  console.log('✓ SMS ID:', result1.id);
  console.log('✓ Status:', result1.status);

  // Test 2: Send reminder SMS
  console.log('\nTest 2: Send reminder SMS');
  const message2 = reminderSMS_24h('2026-02-10', '10:00 AM', 'SME Services', '+18005551234');
  const result2 = await sendSMS('+14155555678', message2);
  console.log('✓ SMS ID:', result2.id);

  // Test 3: Check stats
  console.log('\nTest 3: SMS Statistics');
  const stats = getSMSStats();
  console.log('✓ Total SMS:', stats.total);
  console.log('✓ Sent:', stats.sent);

  console.log('\n✅ SMS Service Tests Passed!');
}

async function testEmailService() {
  console.log('\n=== Testing Mock Email Service ===\n');

  // Test 1: Send confirmation email
  console.log('Test 1: Send confirmation email');
  const htmlBody1 = confirmationEmail(
    'John Doe',
    'BK12345',
    'February 10, 2026',
    '10:00 AM',
    '+18005551234',
    'Plumbing'
  );
  const result1 = await sendEmail(
    'john.doe@example.com',
    'Booking Confirmation - BK12345',
    htmlBody1,
    'Your booking is confirmed for February 10, 2026 at 10:00 AM'
  );
  console.log('✓ Email ID:', result1.id);
  console.log('✓ Status:', result1.status);

  const previewPath1 = getEmailPreviewPath(result1.id);
  if (previewPath1) {
    console.log('✓ Preview saved:', previewPath1);
  }

  // Test 2: Send reminder email
  console.log('\nTest 2: Send reminder email');
  const htmlBody2 = reminderEmail_24h(
    'Jane Smith',
    'February 11, 2026',
    '2:00 PM',
    'BK67890',
    '+18005551234'
  );
  const result2 = await sendEmail(
    'jane.smith@example.com',
    'Reminder: Appointment Tomorrow',
    htmlBody2
  );
  console.log('✓ Email ID:', result2.id);

  // Test 3: Check stats
  console.log('\nTest 3: Email Statistics');
  const stats = getEmailStats();
  console.log('✓ Total Emails:', stats.total);
  console.log('✓ Sent:', stats.sent);

  console.log('\n✅ Email Service Tests Passed!');
}

async function testCalendarService() {
  console.log('\n=== Testing Mock Calendar Service ===\n');

  // Test 1: Get availability
  console.log('Test 1: Get availability for 2026-02-10');
  const availability = await getAvailability('business_1', 'plumbing', '2026-02-10');
  console.log('✓ Date:', availability.date);
  console.log('✓ Available Slots:', availability.available_slots.length);
  console.log('✓ Total Slots:', availability.total_slots);
  if (availability.available_slots.length > 0) {
    const firstSlot = availability.available_slots[0];
    console.log('✓ First Slot:', firstSlot.start_time);
  }

  // Test 2: Create event
  console.log('\nTest 2: Create calendar event');
  const eventResult = await createEvent({
    title: 'Test Booking - Plumbing',
    start_time: '2026-02-10T10:00:00Z',
    end_time: '2026-02-10T11:00:00Z',
    booking_id: 'BK12345',
    customer_name: 'John Doe',
    service_type: 'plumbing',
    technician_id: 'tech_1',
  });
  console.log('✓ Event ID:', eventResult.eventId);
  console.log('✓ Event Title:', eventResult.event.title);
  console.log('✓ Event Status:', eventResult.event.status);

  // Test 3: Update event
  console.log('\nTest 3: Update event');
  const updatedEvent = await updateEvent(eventResult.eventId, {
    status: 'completed',
  });
  console.log('✓ Updated Status:', updatedEvent?.status);

  // Test 4: Get availability again (should have fewer slots)
  console.log('\nTest 4: Get availability after booking');
  const availability2 = await getAvailability('business_1', 'plumbing', '2026-02-10');
  console.log('✓ Available Slots (after booking):', availability2.available_slots.length);
  console.log(
    '✓ Slots reduced by:',
    availability.available_slots.length - availability2.available_slots.length
  );

  // Test 5: Delete event
  console.log('\nTest 5: Delete event');
  const deleted = await deleteEvent(eventResult.eventId);
  console.log('✓ Deleted:', deleted);

  // Test 6: Check stats
  console.log('\nTest 6: Calendar Statistics');
  const stats = getCalendarStats();
  console.log('✓ Total Events:', stats.totalEvents);
  console.log('✓ Scheduled:', stats.scheduled);
  console.log('✓ Completed:', stats.completed);

  console.log('\n✅ Calendar Service Tests Passed!');
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Mock Services Test Suite                 ║');
  console.log('║   Testing Local, Offline Implementations   ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    await testLLMService();
    await testSMSService();
    await testEmailService();
    await testCalendarService();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   🎉 ALL TESTS PASSED! 🎉                  ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log('📁 Check the following files for logs:');
    console.log('   - data/sms-log.json');
    console.log('   - data/email-log.json');
    console.log('   - data/email-previews/*.html');
    console.log('   - data/calendar-mock.json\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
