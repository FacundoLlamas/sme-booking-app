import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  correlationId: string;
  startTime: number;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function setRequestContext(ctx: RequestContext) {
  requestContext.run(ctx, () => {});
}

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}

export function getCorrelationId(): string {
  return getRequestContext()?.correlationId || 'unknown';
}
