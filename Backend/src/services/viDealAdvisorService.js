// Deterministic deal-advice helpers for Vi. This layer never fabricates market data.
const pct = (a, b) => b > 0 ? Math.round(((a - b) / b) * 100) : null;

export const compareTravelOptions = (options = []) => {
  const valid = options.filter(o => Number.isFinite(Number(o?.totalPrice)) && Number(o.totalPrice) >= 0);
  if (!valid.length) return { cheapest: null, fastest: null, bestValue: null };

  const cheapest = [...valid].sort((a, b) => Number(a.totalPrice) - Number(b.totalPrice))[0];
  const timed = valid.filter(o => Number.isFinite(Number(o.durationMinutes)));
  const fastest = timed.length ? [...timed].sort((a, b) => Number(a.durationMinutes) - Number(b.durationMinutes))[0] : null;

  // Value score deliberately favors known total price, then penalizes long duration,
  // stops and restrictive cancellation. It is comparative, never presented as fact.
  const priced = valid.map(o => {
    const relativePrice = Number(o.totalPrice) / Math.max(Number(cheapest.totalPrice), 1);
    const durationPenalty = Number.isFinite(Number(o.durationMinutes)) ? Number(o.durationMinutes) / 1440 : 0;
    const stopPenalty = Number.isFinite(Number(o.stops)) ? Number(o.stops) * 0.12 : 0;
    const restrictionPenalty = o.cancellation === 'non_refundable' ? 0.18 : 0;
    return { option: o, score: relativePrice + durationPenalty * 0.15 + stopPenalty + restrictionPenalty };
  });
  const bestValue = priced.sort((a, b) => a.score - b.score)[0]?.option || cheapest;
  return { cheapest, fastest, bestValue };
};

export const buildDealAdvice = ({ current, alternatives = [], historicalTypical = null, currency = 'USD' } = {}) => {
  if (!current || !Number.isFinite(Number(current.totalPrice))) {
    return { verdict: 'insufficient_data', confidence: 'low', message: 'No verified current price is available, so Vi should not give a buy-or-wait verdict.' };
  }

  const all = [current, ...alternatives];
  const comparison = compareTravelOptions(all);
  const currentPrice = Number(current.totalPrice);
  const typical = Number(historicalTypical);
  const vsTypical = Number.isFinite(typical) && typical > 0 ? pct(currentPrice, typical) : null;
  const cheaperAlternative = comparison.cheapest && Number(comparison.cheapest.totalPrice) < currentPrice ? comparison.cheapest : null;

  let verdict = 'compare';
  let confidence = 'medium';
  if (vsTypical !== null && vsTypical <= -12) verdict = 'strong_value';
  else if (vsTypical !== null && vsTypical >= 15) verdict = 'pricey';
  else if (vsTypical === null) confidence = 'low';

  return {
    verdict,
    confidence,
    currency,
    currentPrice,
    vsTypicalPercent: vsTypical,
    cheaperAlternative,
    cheapest: comparison.cheapest,
    fastest: comparison.fastest,
    bestValue: comparison.bestValue,
    disclaimer: 'Advice is comparative, not a guarantee that prices will rise or fall.'
  };
};

export const VI_DEAL_ADVISOR_PROMPT = `
# Deal advisor behavior
Act like a traveler-side price advisor, not a salesperson.
When verified options exist, distinguish cheapest, fastest and best-value choices.
Check whether flexible dates, nearby airports/stations, one-way vs round-trip, cabin changes, baggage and cancellation terms can materially improve value.
Never claim a future price movement is certain. A buy/wait recommendation needs evidence; otherwise explain uncertainty.
Never turn an estimate or historical price into a live fare.
If a more expensive option saves substantial time or includes costs the cheapest excludes, explain that tradeoff clearly.
`;
