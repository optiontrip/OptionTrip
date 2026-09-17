import { describe, expect, it } from 'vitest';
import { getProviderPlan, getTravelMarketplaceHealth } from './providerOrchestrator.js';

describe('providerOrchestrator', () => {
  it('puts configured providers before candidates', () => {
    const plan = getProviderPlan('cars');
    expect(plan.length).toBeGreaterThan(0);
    const firstCandidate = plan.findIndex(item => !item.configured);
    if (firstCandidate >= 0) {
      expect(plan.slice(firstCandidate).every(item => !item.configured)).toBe(true);
    }
  });

  it('reports live widget verticals as operational', () => {
    const health = getTravelMarketplaceHealth();
    for (const vertical of ['cars', 'activities', 'esim']) {
      expect(health.find(item => item.vertical === vertical)?.operational).toBe(true);
    }
  });

  it('never exposes credential values in marketplace health', () => {
    const serialized = JSON.stringify(getTravelMarketplaceHealth());
    expect(serialized).not.toMatch(/secret|token_value|api_key_value/i);
  });
});
