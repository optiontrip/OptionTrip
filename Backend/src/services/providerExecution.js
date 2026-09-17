import { getProviderPlan } from './providerOrchestrator.js';

const adapters = new Map();

export const registerProviderAdapter = (provider, vertical, handler) => {
  if (!provider || !vertical || typeof handler !== 'function') {
    throw new TypeError('provider, vertical and handler are required');
  }
  adapters.set(`${vertical}:${provider}`, handler);
};

export const hasProviderAdapter = (provider, vertical) => adapters.has(`${vertical}:${provider}`);

const withTimeout = async (promise, timeoutMs) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('provider_timeout')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

export const executeTravelSearch = async ({ vertical, request, timeoutMs = 8000 }) => {
  const plan = getProviderPlan(vertical).filter(item => item.configured && hasProviderAdapter(item.provider, vertical));
  const attempts = [];

  for (const candidate of plan) {
    const startedAt = Date.now();
    try {
      const handler = adapters.get(`${vertical}:${candidate.provider}`);
      const result = await withTimeout(Promise.resolve(handler(request)), timeoutMs);
      attempts.push({ provider: candidate.provider, ok: true, durationMs: Date.now() - startedAt });
      return { success: true, provider: candidate.provider, result, attempts };
    } catch (error) {
      attempts.push({
        provider: candidate.provider,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error?.message || 'provider_error',
      });
    }
  }

  return {
    success: false,
    provider: null,
    result: null,
    attempts,
    reason: plan.length ? 'all_providers_failed' : 'no_live_adapter',
  };
};

export const getExecutionReadiness = vertical => getProviderPlan(vertical).map(item => ({
  provider: item.provider,
  configured: item.configured,
  adapter: hasProviderAdapter(item.provider, vertical),
  executable: item.configured && hasProviderAdapter(item.provider, vertical),
  access: item.access,
  integration: item.integration,
}));
