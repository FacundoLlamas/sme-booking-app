/**
 * Request/Response Validation Schemas
 * Uses Zod for type-safe validation
 */

import { z } from 'zod';

/**
 * Common field validations
 */
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const dateTimeSchema = z.string().datetime('Invalid datetime format');

/**
 * Customer DTOs
 */
export const CreateCustomerDtoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

export const UpdateCustomerDtoSchema = CreateCustomerDtoSchema.partial();

export type CreateCustomerDto = z.infer<typeof CreateCustomerDtoSchema>;
export type UpdateCustomerDto = z.infer<typeof UpdateCustomerDtoSchema>;

/**
 * Booking DTOs
 */
export const CreateBookingDtoSchema = z.object({
  customerId: uuidSchema.optional(), // Optional for guest bookings
  customerName: z.string().min(1).max(255).optional(),
  customerEmail: emailSchema.optional(),
  customerPhone: phoneSchema.optional(),
  serviceType: z.string().min(1, 'Service type is required').max(100),
  bookingTime: dateTimeSchema,
  duration: z.number().int().positive().max(480), // Max 8 hours
  notes: z.string().max(1000).optional(),
  isEmergency: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => data.customerId || (data.customerName && data.customerEmail && data.customerPhone),
  {
    message: 'Either customerId or customer details (name, email, phone) must be provided',
    path: ['customerId'],
  }
);

export const UpdateBookingDtoSchema = z.object({
  bookingTime: dateTimeSchema.optional(),
  duration: z.number().int().positive().max(480).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
});

export type CreateBookingDto = z.infer<typeof CreateBookingDtoSchema>;
export type UpdateBookingDto = z.infer<typeof UpdateBookingDtoSchema>;

/**
 * Chat DTOs
 */
export const ChatMessageDtoSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  message: z.string().min(1, 'Message is required').max(2000),
  customerId: uuidSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export type ChatMessageDto = z.infer<typeof ChatMessageDtoSchema>;

/**
 * Authentication DTOs
 */
export const LoginDtoSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterDtoSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255),
  phone: phoneSchema.optional(),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

/**
 * Service DTOs
 */
export const CreateServiceDtoSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(255),
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().max(1000).optional(),
  durationMinutes: z.number().int().positive().max(480),
  price: z.number().positive().optional(),
  isEmergency: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

export const UpdateServiceDtoSchema = CreateServiceDtoSchema.partial();

export type CreateServiceDto = z.infer<typeof CreateServiceDtoSchema>;
export type UpdateServiceDto = z.infer<typeof UpdateServiceDtoSchema>;

/**
 * Pagination & Filtering
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const BookingFiltersSchema = PaginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  customerId: uuidSchema.optional(),
  serviceType: z.string().optional(),
  startDate: dateTimeSchema.optional(),
  endDate: dateTimeSchema.optional(),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;
export type BookingFilters = z.infer<typeof BookingFiltersSchema>;

/**
 * Validate request body against a schema
 */
export async function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  return schema.parseAsync(body);
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return schema.parse(params);
}
