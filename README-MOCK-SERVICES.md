# Mock Services Documentation

This document describes the local, offline mock implementations of external services.

## 🎯 Overview

All external services have **mock implementations** for local development:

- **Claude LLM** - Service request classification
- **Twilio SMS** - Text message notifications
- **SendGrid Email** - Email notifications
- **Google Calendar** - Availability and booking management

**No API keys required!** All services run locally and log to files.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Tests

```bash
# Run all mock service tests
npm run test:mock

# Run Jest tests
npm test

# Run with coverage
npm run test:coverage
```

### 3. Environment Variables

Set these to force mock mode (or leave unset):

```bash
# .env
ANTHROPIC_API_KEY=mock
TWILIO_MOCK=true
SENDGRID_MOCK=true
GOOGLE_CALENDAR_MOCK=true
```

## 📦 Mock Services

### 1. Mock Claude LLM (`src/lib/llm`)

**Purpose:** Classify service requests without calling Anthropic API

**Files:**
- `client.ts` - Main LLM client
- `models.ts` - Model configurations
- `__mocks__/mock-claude.ts` - 15+ pre-defined classifications

**Usage:**

```typescript
import { createMessage, classifyServiceRequest } from './src/lib/llm';

// Method 1: Full message interface
const response = await createMessage({ 
  prompt: 'My sink is leaking' 
});
const data = JSON.parse(response.content);
console.log(data.service_type); // 'plumbing'
console.log(data.urgency); // 'high'

// Method 2: Direct classification
const classification = classifyServiceRequest('Light switch broken');
console.log(classification.service_type); // 'electrical'
console.log(classification.urgency); // 'medium'
```

**Pre-defined Classifications:**
- Plumbing (sink leak, toilet clog, drain backup)
- Electrical (light switch, sparking, circuit breaker)
- HVAC (heater, AC, furnace)
- Locksmith (locked out, broken lock)
- Painting, Roofing, Cleaning, Pest Control, etc.

**Logs:** Console output with token counts

### 2. Mock SMS Service (`src/lib/sms`)

**Purpose:** Log SMS messages instead of sending via Twilio

**Files:**
- `send.ts` - Main SMS interface
- `templates.ts` - Pre-built message templates
- `__mocks__/twilio-client.ts` - Mock Twilio implementation

**Usage:**

```typescript
import { sendSMS, confirmationSMS, reminderSMS_24h } from './src/lib/sms';

// Send confirmation SMS
const message = confirmationSMS('BK12345', '2026-02-10', '10:00 AM', 'SME Services');
const result = await sendSMS('+14155551234', message);
console.log(result.id); // sms_1707312000000_abc123
console.log(result.status); // 'sent'

// Send reminder SMS
const reminder = reminderSMS_24h('2026-02-10', '10:00 AM');
await sendSMS('+14155551234', reminder);

// Get SMS statistics
import { getSMSStats } from './src/lib/sms';
const stats = getSMSStats();
console.log(stats.total); // 2
console.log(stats.sent); // 2
```

**Templates:**
- `confirmationSMS(bookingCode, date, time, businessName)`
- `reminderSMS_24h(date, time, businessName, businessPhone?)`
- `reminderSMS_2h(time, address?, businessName)`
- `cancellationSMS(bookingCode, businessName, businessPhone?)`
- `rescheduleSMS(bookingCode, oldDate, oldTime, newDate, newTime, businessName)`
- `technicianEnRouteSMS(technicianName, estimatedArrival, technicianPhone?)`
- `serviceCompletedSMS(bookingCode, businessName, feedbackLink?)`

**Logs:**
- Console: `[SMS] To: +14155551234 | Message: Your booking is confirmed...`
- File: `data/sms-log.json`

```json
[
  {
    "id": "sms_1707312000000_abc123",
    "to": "+14155551234",
    "message": "Your booking is confirmed...",
    "timestamp": "2026-02-07T12:00:00.000Z",
    "status": "sent"
  }
]
```

### 3. Mock Email Service (`src/lib/email`)

**Purpose:** Log emails and save HTML previews instead of sending via SendGrid

**Files:**
- `send.ts` - Main email interface
- `templates.ts` - Professional HTML email templates
- `__mocks__/sendgrid-client.ts` - Mock SendGrid implementation

**Usage:**

```typescript
import { sendEmail, confirmationEmail, reminderEmail_24h } from './src/lib/email';

// Send confirmation email
const htmlBody = confirmationEmail(
  'John Doe',
  'BK12345',
  'February 10, 2026',
  '10:00 AM',
  '+18005551234',
  'Plumbing'
);

const result = await sendEmail(
  'john.doe@example.com',
  'Booking Confirmation - BK12345',
  htmlBody,
  'Your booking is confirmed for February 10, 2026 at 10:00 AM' // text version
);

console.log(result.id); // email_1707312000000_xyz789

// Get preview file path
import { getEmailPreviewPath } from './src/lib/email';
const previewPath = getEmailPreviewPath(result.id);
console.log(previewPath); // data/email-previews/email_1707312000000_xyz789.html
```

**Templates:**
- `confirmationEmail(customerName, bookingCode, date, time, businessPhone, serviceType?)`
- `reminderEmail_24h(customerName, date, time, bookingCode?, businessPhone?)`
- `reminderEmail_2h(customerName, time, address?, technicianName?)`
- `cancellationEmail(customerName, bookingCode, reason?, businessPhone?)`
- `rescheduleEmail(customerName, bookingCode, oldDate, oldTime, newDate, newTime)`
- `serviceCompletedEmail(customerName, bookingCode, serviceType, feedbackLink?)`

**Logs:**
- Console: `[EMAIL] To: user@example.com | Subject: Booking Confirmation | Preview: data/email-previews/...`
- File: `data/email-log.json`
- HTML Previews: `data/email-previews/*.html` (open in browser!)

```json
[
  {
    "id": "email_1707312000000_xyz789",
    "to": "john.doe@example.com",
    "subject": "Booking Confirmation - BK12345",
    "body_preview": "Hi John Doe, Great news! Your service appointment...",
    "timestamp": "2026-02-07T12:00:00.000Z",
    "status": "sent",
    "hasHtml": true,
    "hasText": true
  }
]
```

### 4. Mock Google Calendar (`src/lib/google`)

**Purpose:** Manage availability and bookings locally without Google API

**Files:**
- `calendar-client.ts` - Main calendar interface
- `availability.ts` - Slot calculation with buffer times
- `__mocks__/mock-calendar.ts` - File-based calendar storage

**Usage:**

```typescript
import {
  getAvailability,
  createEvent,
  updateEvent,
  deleteEvent,
} from './src/lib/google';

// Get available slots for a date
const availability = await getAvailability('business_1', 'plumbing', '2026-02-10');
console.log(availability.available_slots.length); // 8 slots (9am-5pm)
console.log(availability.available_slots[0]);
// {
//   start_time: '2026-02-10T09:00:00.000Z',
//   end_time: '2026-02-10T10:00:00.000Z',
//   duration_minutes: 60,
//   technician_id: 'tech_1'
// }

// Create a booking
const eventResult = await createEvent({
  title: 'Plumbing Service - John Doe',
  start_time: '2026-02-10T10:00:00Z',
  end_time: '2026-02-10T11:00:00Z',
  booking_id: 'BK12345',
  customer_name: 'John Doe',
  service_type: 'plumbing',
  technician_id: 'tech_1',
});

console.log(eventResult.eventId); // event_1707312000000_abc

// Update event status
await updateEvent(eventResult.eventId, { status: 'completed' });

// Delete event
await deleteEvent(eventResult.eventId);
```

**Default Availability:**
- **Monday-Friday:** 9:00 AM - 5:00 PM (8 one-hour slots)
- **Saturday-Sunday:** No availability
- **Slot Duration:** 1 hour
- **Technicians:** Randomly assigned (tech_1, tech_2, tech_3)

**Buffer Times** (prevents back-to-back bookings):

| Service Type | Before | After |
|-------------|--------|-------|
| Plumbing | 15 min | 30 min |
| Electrical | 15 min | 30 min |
| HVAC | 30 min | 30 min |
| Roofing | 30 min | 45 min |
| Locksmith | 0 min | 15 min |
| Painting | 15 min | 30 min |
| Default | 15 min | 15 min |

**Logs:**
- Console: `[Calendar Mock] Event created: event_123 - Plumbing Service at 2026-02-10T10:00:00Z`
- File: `data/calendar-mock.json` (availability only, events stored in memory)

```json
{
  "availability": [
    {
      "date": "2026-02-10",
      "slots": [
        {
          "start_time": "2026-02-10T09:00:00.000Z",
          "end_time": "2026-02-10T10:00:00.000Z",
          "duration_minutes": 60,
          "technician_id": "tech_1",
          "available": true
        }
      ]
    }
  ],
  "last_updated": "2026-02-07T12:00:00.000Z"
}
```

## 🧪 Testing

### Run Mock Service Tests

```bash
npm run test:mock
```

This runs `test-mock-services.ts` which tests:
- ✅ LLM service request classification
- ✅ SMS sending and logging
- ✅ Email sending and HTML previews
- ✅ Calendar availability and booking
- ✅ Buffer time enforcement
- ✅ Event CRUD operations

### Run Jest Unit Tests

```bash
npm test
```

Runs all `**/__tests__/**/*.test.ts` files, including:
- `src/lib/google/__tests__/mock-calendar.test.ts`

Tests include:
- Availability generation (weekday/weekend)
- Event creation/update/deletion
- Buffer time calculations
- Slot conflict detection
- Overlap prevention

## 📂 Data Files

All mock data is stored in `data/`:

```
data/
├── sms-log.json          # All SMS messages sent
├── email-log.json        # All emails sent (metadata)
├── email-previews/       # HTML previews of emails
│   ├── email_123.html
│   └── email_456.html
└── calendar-mock.json    # Calendar availability (events in memory)
```

**Note:** Events are stored in **memory** and reset when the process restarts. This is intentional for local development.

## 🔄 Switching to Real Services

When ready to use real APIs, set environment variables:

```bash
# Real Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Real Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_MOCK=false

# Real SendGrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_MOCK=false

# Real Google Calendar
GOOGLE_CALENDAR_CREDENTIALS=path/to/credentials.json
GOOGLE_CALENDAR_MOCK=false
```

The code will automatically switch from mock to real implementations.

## 💡 Tips

1. **Email Previews:** Open `data/email-previews/*.html` in a browser to see how emails look
2. **Clear Logs:** Use helper functions to clear logs during testing:
   ```typescript
   import { clearSMSLog } from './src/lib/sms';
   import { clearEmailLog } from './src/lib/email';
   import { clearAllEvents, resetAvailability } from './src/lib/google';
   
   clearSMSLog();
   clearEmailLog();
   clearAllEvents();
   resetAvailability();
   ```
3. **Statistics:** Get quick stats on mock service usage:
   ```typescript
   import { getSMSStats } from './src/lib/sms';
   import { getEmailStats } from './src/lib/email';
   import { getCalendarStats } from './src/lib/google';
   ```

## 🎉 Success Criteria

All mock services are working when:

- ✅ `npm run test:mock` completes successfully
- ✅ `npm test` passes all Jest tests
- ✅ `data/sms-log.json` has SMS entries
- ✅ `data/email-log.json` has email entries
- ✅ `data/email-previews/` contains HTML files
- ✅ `data/calendar-mock.json` has availability data
- ✅ Console shows `[SMS]`, `[EMAIL]`, `[MOCK LLM]`, `[Calendar Mock]` logs

## 📚 Next Steps

1. **Database Integration:** Connect mock services to Prisma/database
2. **API Routes:** Create REST/GraphQL endpoints that use these services
3. **Frontend:** Build UI that triggers bookings and notifications
4. **Real APIs:** Switch to production services with environment variables
