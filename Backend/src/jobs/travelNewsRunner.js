import { runTravelNewsAutomation } from './travelNewsAutomation.js';

const DEFAULT_DAILY_LIMIT = 5;
const DEFAULT_WP_API = 'https://blog.optiontrip.com/wp-json/wp/v2';
const DAY_MS = 24 * 60 * 60 * 1000;

let activeRun = null;
let lastRun = {
  trigger: null,
  startedAt: null,
  completedAt: null,
  status: 'idle',
  recentPublishedCount: null,
  remainingBudget: null,
  result: null,
  error: null,
};

const wpBase = () => String(process.env.WORDPRESS_API_BASE || DEFAULT_WP_API).replace(/\/$/, '');

const REQUIRED_AUTOPUBLISH_VARS = [
  'WORDPRESS_USERNAME',
  'WORDPRESS_APP_PASSWORD',
  'OPENAI_API_KEY',
];

export const normalizeNewsDailyLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_DAILY_LIMIT;
  return Math.max(1, Math.min(5, Math.floor(parsed)));
};

export const calculateRemainingNewsBudget = (recentPublishedCount, dailyLimit = DEFAULT_DAILY_LIMIT) => {
  const count = Math.max(0, Number(recentPublishedCount) || 0);
  const limit = normalizeNewsDailyLimit(dailyLimit);
  return Math.max(0, limit - count);
};

export const getTravelNewsAutopublishReadiness = () => {
  const missing = REQUIRED_AUTOPUBLISH_VARS.filter(name => !String(process.env[name] || '').trim());
  const explicitFlag = String(process.env.NEWS_AUTOPUBLISH_ENABLED || '').trim().toLowerCase();
  const explicitlyDisabled = explicitFlag === 'false' || explicitFlag === '0' || explicitFlag === 'off';
  const configured = missing.length === 0;

  // Owner policy: automatic news should run whenever the production prerequisites
  // are present. NEWS_AUTOPUBLISH_ENABLED=false remains an emergency kill switch.
  const enabled = configured && !explicitlyDisabled;

  return {
    enabled,
    configured,
    explicitlyDisabled,
    mode: explicitFlag === 'true' ? 'explicit' : (explicitlyDisabled ? 'disabled' : 'auto'),
    missing,
    wordpressApiBase: wpBase(),
  };
};

export const countRecentPublishedWordPressPosts = async ({ now = Date.now() } = {}) => {
  const after = new Date(now - DAY_MS).toISOString();
  const params = new URLSearchParams({
    after,
    status: 'publish',
    per_page: '100',
    _fields: 'id,date',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${wpBase()}/posts?${params.toString()}`, {
      headers: { 'user-agent': 'OptionTripNewsBudget/1.0 (+https://optiontrip.com)' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`WordPress recent-post budget check failed: HTTP ${response.status}`);
    }

    const posts = await response.json();
    if (!Array.isArray(posts)) {
      throw new Error('WordPress recent-post budget check returned an invalid payload');
    }

    return posts.length;
  } finally {
    clearTimeout(timeout);
  }
};

export const getTravelNewsRunnerStatus = () => {
  const readiness = getTravelNewsAutopublishReadiness();
  return {
    ...readiness,
    dailyLimit: normalizeNewsDailyLimit(process.env.NEWS_DAILY_LIMIT),
    running: Boolean(activeRun),
    ...lastRun,
  };
};

export const runTravelNewsAutomationWithBudget = async ({ trigger = 'manual' } = {}) => {
  const readiness = getTravelNewsAutopublishReadiness();
  if (!readiness.enabled) {
    const reason = readiness.explicitlyDisabled ? 'disabled' : 'missing-configuration';
    return {
      enabled: false,
      trigger,
      skipped: true,
      reason,
      missing: readiness.missing,
    };
  }

  if (activeRun) {
    console.log(`📰 Travel news ${trigger} run skipped because another run is active`);
    return activeRun;
  }

  activeRun = (async () => {
    const startedAt = new Date().toISOString();
    lastRun = {
      trigger,
      startedAt,
      completedAt: null,
      status: 'checking-budget',
      recentPublishedCount: null,
      remainingBudget: null,
      result: null,
      error: null,
    };

    try {
      const configuredLimit = normalizeNewsDailyLimit(process.env.NEWS_DAILY_LIMIT);
      const recentPublishedCount = await countRecentPublishedWordPressPosts();
      const remainingBudget = calculateRemainingNewsBudget(recentPublishedCount, configuredLimit);

      lastRun = {
        ...lastRun,
        recentPublishedCount,
        remainingBudget,
        status: remainingBudget > 0 ? 'running' : 'daily-limit-reached',
      };

      console.log(
        `📰 Travel news budget (${trigger}): ${recentPublishedCount} posts in last 24h, ` +
        `${remainingBudget}/${configuredLimit} automation slots available`
      );

      if (remainingBudget <= 0) {
        const result = {
          enabled: true,
          trigger,
          skipped: true,
          reason: 'daily-limit-reached',
          recentPublishedCount,
          dailyLimit: configuredLimit,
          remainingBudget: 0,
        };
        lastRun = {
          ...lastRun,
          completedAt: new Date().toISOString(),
          status: 'daily-limit-reached',
          result,
        };
        return result;
      }

      const previousLimit = process.env.NEWS_DAILY_LIMIT;
      const previousEnabled = process.env.NEWS_AUTOPUBLISH_ENABLED;
      process.env.NEWS_DAILY_LIMIT = String(remainingBudget);
      process.env.NEWS_AUTOPUBLISH_ENABLED = 'true';

      let result;
      try {
        result = await runTravelNewsAutomation();
      } finally {
        if (previousLimit === undefined) delete process.env.NEWS_DAILY_LIMIT;
        else process.env.NEWS_DAILY_LIMIT = previousLimit;

        if (previousEnabled === undefined) delete process.env.NEWS_AUTOPUBLISH_ENABLED;
        else process.env.NEWS_AUTOPUBLISH_ENABLED = previousEnabled;
      }

      const normalizedResult = {
        ...result,
        trigger,
        recentPublishedCount,
        configuredDailyLimit: configuredLimit,
        allowedThisRun: remainingBudget,
      };

      lastRun = {
        ...lastRun,
        completedAt: new Date().toISOString(),
        status: 'completed',
        result: normalizedResult,
      };

      return normalizedResult;
    } catch (error) {
      // If the WordPress budget check fails, do not publish blindly. A stale
      // news feed is preferable to accidentally exceeding the daily quota.
      lastRun = {
        ...lastRun,
        completedAt: new Date().toISOString(),
        status: 'failed',
        error: error?.message || String(error),
      };
      console.error(`📰 Travel news ${trigger} runner failed:`, error?.message || error);
      return {
        enabled: true,
        trigger,
        skipped: true,
        reason: 'runner-failed',
        error: error?.message || String(error),
      };
    }
  })();

  try {
    return await activeRun;
  } finally {
    activeRun = null;
  }
};
