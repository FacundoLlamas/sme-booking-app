import { v4 as uuidv4 } from 'uuid';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const TRACE_ID_HEADER = 'x-trace-id';

export function generateCorrelationId(): string {
  return uuidv4();
}

export function getOrGenerateCorrelationId(headers: Headers | string | undefined): string {
  if (typeof headers === 'string') {
    return headers;
  }
  
  if (headers instanceof Headers) {
    const existing = headers.get(CORRELATION_ID_HEADER);
    if (existing) return existing;
  }
  
  return generateCorrelationId();
}

export function injectCorrelationIdHeader(headers: Headers, correlationId: string): void {
  headers.set(CORRELATION_ID_HEADER, correlationId);
  headers.set(TRACE_ID_HEADER, correlationId); // Alias for compatibility
}
