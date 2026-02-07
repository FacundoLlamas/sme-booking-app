/**
 * ICS Calendar Event Generator
 * Generates .ics files compatible with Google Calendar, Outlook, Apple Calendar
 * 
 * Reference: https://tools.ietf.org/html/rfc5545
 */

import { ConfirmationPageData } from '@/types/booking';
import { SERVICE_DURATIONS } from '@/lib/bookings/validators';

/**
 * Escape special characters in ICS text values
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

/**
 * Format date for ICS format (YYYYMMDDTHHmmssZ)
 */
function formatIcsDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate unique UID for ICS event
 */
function generateEventUid(bookingId: number, confirmationCode: string): string {
  return `booking-${bookingId}-${confirmationCode}@sme-booking-app`;
}

/**
 * Generate ICS content for a booking confirmation
 * 
 * @param bookingData - Booking confirmation data
 * @returns ICS file content as string
 */
export function generateIcsContent(bookingData: ConfirmationPageData): string {
  const {
    bookingId,
    confirmationCode,
    customerName,
    email,
    phone,
    address,
    serviceType,
    bookingTime,
    notes
  } = bookingData;

  // Get service duration (in minutes)
  const durationMinutes = SERVICE_DURATIONS[serviceType as keyof typeof SERVICE_DURATIONS] || SERVICE_DURATIONS.default;
  
  // Calculate end time
  const endTime = new Date(bookingTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);

  // Generate event details
  const eventUid = generateEventUid(bookingId, confirmationCode);
  const createdAt = formatIcsDate(new Date());
  const startTime = formatIcsDate(bookingTime);
  const endTimeFormatted = formatIcsDate(endTime);
  
  // Escape special characters
  const escapedCustomerName = escapeIcsText(customerName);
  const escapedServiceType = escapeIcsText(serviceType);
  const escapedAddress = escapeIcsText(address);
  const escapedEmail = escapeIcsText(email);
  const escapedPhone = escapeIcsText(phone);
  const escapedNotes = notes ? escapeIcsText(notes) : '';
  
  // Service type display name
  const serviceTypeDisplay = serviceType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Create ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SME Booking App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SME Service Booking',
    'X-WR-TIMEZONE:UTC',
    'X-WR-CALDESC:Service booking confirmation',
    '',
    'BEGIN:VEVENT',
    `UID:${eventUid}`,
    `DTSTAMP:${createdAt}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTimeFormatted}`,
    `SUMMARY:${serviceTypeDisplay} - Confirmation: ${confirmationCode}`,
    `LOCATION:${escapedAddress}`,
    `DESCRIPTION:Service Type: ${escapedServiceType}\\n\\nCustomer: ${escapedCustomerName}\\nPhone: ${escapedPhone}\\nEmail: ${escapedEmail}\\n\\nConfirmation Code: ${confirmationCode}\\n${escapedNotes ? `\\nNotes: ${escapedNotes}` : ''}\\n\\nThis is a service booking confirmation. Please arrive 5-10 minutes early.`,
    `ORGANIZER;CN="${escapedCustomerName}":mailto:${escapedEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'CREATE-AD:1440', // 24 hour alarm
    '',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${serviceTypeDisplay} service booking today at ${bookingTime.toLocaleTimeString()}`,
    'END:VALARM',
    '',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Your service appointment is in 2 hours',
    'END:VALARM',
    '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

/**
 * Generate ICS file and trigger download
 * 
 * @param bookingData - Booking confirmation data
 * @param filename - Output filename (without .ics extension)
 */
export function downloadIcsFile(
  bookingData: ConfirmationPageData,
  filename: string = `booking-${bookingData.bookingId}-${bookingData.confirmationCode}`
): void {
  const icsContent = generateIcsContent(bookingData);
  
  // Create blob
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.download = `${filename}.ics`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Get ICS content as data URL for alternative download methods
 */
export function getIcsDataUrl(bookingData: ConfirmationPageData): string {
  const icsContent = generateIcsContent(bookingData);
  const encodedContent = encodeURIComponent(icsContent);
  return `data:text/calendar;charset=utf-8,${encodedContent}`;
}

/**
 * Copy ICS content to clipboard
 * Useful for fallback copy/paste workflows
 */
export async function copyIcsToClipboard(bookingData: ConfirmationPageData): Promise<boolean> {
  try {
    const icsContent = generateIcsContent(bookingData);
    await navigator.clipboard.writeText(icsContent);
    return true;
  } catch (error) {
    console.error('Failed to copy ICS to clipboard:', error);
    return false;
  }
}
