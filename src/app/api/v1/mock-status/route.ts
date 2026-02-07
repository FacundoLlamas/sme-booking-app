import { NextRequest, NextResponse } from 'next/server';
import { mockOrchestrator } from '@/lib/mock-orchestrator';

export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not available in production', { status: 403 });
  }

  const mockState = mockOrchestrator.getState();

  return NextResponse.json(
    {
      success: true,
      data: {
        mocks: mockState,
        message: 'All mock services are configured. Adjust failure rates via environment variables.',
        tips: [
          'Set MOCK_SMS_FAILURE_RATE=0.5 to simulate 50% SMS failures',
          'Set MOCK_SMS_DELAY_MS=1000 to add 1s delay to SMS',
          'Set CALENDAR_PERSIST=true to persist calendar events across restarts',
        ],
      },
    },
    { status: 200 }
  );
}

export async function PATCH(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not available in production', { status: 403 });
  }

  const { service, settings } = await request.json();

  mockOrchestrator.setState(service, settings);

  return NextResponse.json(
    {
      success: true,
      data: mockOrchestrator.getState(),
      message: `${service} mock settings updated`,
    },
    { status: 200 }
  );
}
