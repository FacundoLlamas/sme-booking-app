type MockService = 'llm' | 'sms' | 'email' | 'calendar';

interface MockState {
  llm: { enabled: boolean; failureRate: number; delay: number };
  sms: { enabled: boolean; failureRate: number; delay: number };
  email: { enabled: boolean; failureRate: number; delay: number };
  calendar: { enabled: boolean; persist: boolean; delay: number };
}

class MockOrchestrator {
  private state: MockState = {
    llm: { enabled: true, failureRate: 0, delay: 0 },
    sms: { enabled: true, failureRate: 0, delay: 0 },
    email: { enabled: true, failureRate: 0, delay: 0 },
    calendar: { enabled: true, persist: false, delay: 0 },
  };

  constructor() {
    this.loadFromEnv();
  }

  private loadFromEnv() {
    this.state.llm.enabled = process.env.ANTHROPIC_MOCK !== 'false';
    this.state.sms.enabled = process.env.TWILIO_MOCK !== 'false';
    this.state.email.enabled = process.env.SENDGRID_MOCK !== 'false';
    this.state.calendar.enabled = process.env.GOOGLE_CALENDAR_MOCK !== 'false';
    
    this.state.sms.failureRate = parseFloat(process.env.MOCK_SMS_FAILURE_RATE || '0');
    this.state.email.failureRate = parseFloat(process.env.MOCK_EMAIL_FAILURE_RATE || '0');
    this.state.sms.delay = parseInt(process.env.MOCK_SMS_DELAY_MS || '0');
    this.state.calendar.persist = process.env.CALENDAR_PERSIST === 'true';
  }

  getState(): MockState {
    return { ...this.state };
  }

  setState(service: MockService, updates: Partial<MockState[MockService]>) {
    this.state[service] = { ...this.state[service], ...updates };
  }

  isEnabled(service: MockService): boolean {
    return this.state[service].enabled;
  }

  getFailureRate(service: MockService): number {
    return this.state[service].failureRate;
  }

  async simulateDelay(service: MockService): Promise<void> {
    const delay = this.state[service].delay;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  shouldFail(service: MockService): boolean {
    const failureRate = this.getFailureRate(service);
    return Math.random() < failureRate;
  }

  async withOrchestratedMock<T>(
    service: MockService,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled(service)) {
      throw new Error(`Mock ${service} is disabled`);
    }

    await this.simulateDelay(service);

    if (this.shouldFail(service)) {
      const errors = {
        sms: 'Network timeout',
        email: 'SMTP timeout',
        calendar: 'Calendar sync failed',
        llm: 'LLM service unavailable',
      };
      throw new Error(errors[service]);
    }

    return fn();
  }
}

export const mockOrchestrator = new MockOrchestrator();
