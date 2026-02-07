import { describe, it, expect, beforeEach } from 'vitest';
import { mockOrchestrator } from '@/lib/mock-orchestrator';

describe('Mock Orchestrator', () => {
  beforeEach(() => {
    // Reset to defaults
    mockOrchestrator.setState('sms', { failureRate: 0, delay: 0 });
  });

  it('should track mock state', () => {
    const state = mockOrchestrator.getState();
    expect(state.sms).toBeDefined();
    expect(state.email).toBeDefined();
  });

  it('should update mock settings', () => {
    mockOrchestrator.setState('sms', { failureRate: 0.5 });
    expect(mockOrchestrator.getFailureRate('sms')).toBe(0.5);
  });

  it('should simulate failures based on rate', () => {
    mockOrchestrator.setState('sms', { failureRate: 1.0 });
    expect(mockOrchestrator.shouldFail('sms')).toBe(true);

    mockOrchestrator.setState('sms', { failureRate: 0.0 });
    expect(mockOrchestrator.shouldFail('sms')).toBe(false);
  });

  it('should return enabled status', () => {
    expect(mockOrchestrator.isEnabled('sms')).toBe(true);
  });

  it('should simulate delays', async () => {
    mockOrchestrator.setState('sms', { delay: 100 });
    const start = Date.now();
    await mockOrchestrator.simulateDelay('sms');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('should orchestrate mock calls', async () => {
    const result = await mockOrchestrator.withOrchestratedMock('sms', async () => {
      return 'success';
    });
    expect(result).toBe('success');
  });

  it('should fail when failure rate is set', async () => {
    mockOrchestrator.setState('sms', { failureRate: 1.0 });
    
    try {
      await mockOrchestrator.withOrchestratedMock('sms', async () => 'success');
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toContain('Network timeout');
    }
  });
});
