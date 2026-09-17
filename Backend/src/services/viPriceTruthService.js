// Price provenance and confidence rules shared by future Vi search surfaces.
// A displayed number must explain what it is instead of looking like invented inventory.
export const PRICE_KINDS = Object.freeze({
  live: 'live',
  cached: 'cached',
  historical: 'historical',
  estimate: 'estimate',
  unavailable: 'unavailable'
});

export const normalizePriceTruth = ({ amount, currency = 'USD', kind = 'unavailable', provider, checkedAt, note } = {}) => {
  const numeric = Number(amount);
  const hasPrice = Number.isFinite(numeric) && numeric >= 0;
  const safeKind = Object.values(PRICE_KINDS).includes(kind) ? kind : PRICE_KINDS.unavailable;
  return {
    amount: hasPrice ? numeric : null,
    currency: String(currency || 'USD').toUpperCase(),
    kind: hasPrice ? safeKind : PRICE_KINDS.unavailable,
    provider: provider || null,
    checkedAt: checkedAt || null,
    note: note || null,
    bookableNow: hasPrice && safeKind === PRICE_KINDS.live
  };
};

export const priceTruthInstruction = `
# Price truth
- Never invent a fare, room rate, availability, discount, crossed-out price or savings percentage.
- LIVE means returned by a provider/search integration for the user's current query.
- CACHED/HISTORICAL means useful context but not guaranteed bookable now.
- ESTIMATE means an explicitly labeled planning range, never a booking quote.
- If live data is unavailable, say so plainly and give useful strategy instead of fake precision.
- Compare total trip cost when possible: fare/rate + baggage + fees + transfers + cancellation constraints + traveler time.
- A cheaper option is not automatically better. Explain material tradeoffs.
- When evidence is insufficient for "buy now" versus "wait", say what would change the decision rather than pretending certainty.
`;
