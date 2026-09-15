import { getViWorldGuideContext } from '../config/viWorldGuide.js';

const formatProviderReadiness = (travel) => {
  const gaps = Array.isArray(travel?.inventoryGaps) ? travel.inventoryGaps : [];
  if (!gaps.length) return '';

  const lines = gaps.slice(0, 20).map((gap) => {
    const vertical = gap.vertical || gap.capability || 'travel service';
    const candidates = Array.isArray(gap.candidateProviders)
      ? gap.candidateProviders.join(', ')
      : '';
    return `- ${vertical}: ${candidates || 'no live provider currently exposed'}`;
  });

  return `\n\n# Commercial provider readiness\nThese are readiness signals, not live inventory. Never turn a candidate provider into a claim of price or availability.\n${lines.join('\n')}`;
};

export const buildViWorldGuidePrompt = () => {
  const { prompt, travel } = getViWorldGuideContext();
  return `${prompt}${formatProviderReadiness(travel)}`;
};

export default buildViWorldGuidePrompt;
