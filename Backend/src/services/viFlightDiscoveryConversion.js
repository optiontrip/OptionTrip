import { resolveCountryCode } from './nearbyAirportsService.js';

const MONTH_ALIASES = Object.freeze([
  [1, ['january', 'jan', 'январь', 'января', 'январе', 'січень', 'січня', 'januar', 'јануар']],
  [2, ['february', 'feb', 'февраль', 'февраля', 'феврале', 'лютий', 'лютого', 'februar', 'фебруар']],
  [3, ['march', 'mar', 'март', 'марта', 'марте', 'березень', 'березня', 'mart', 'март']],
  [4, ['april', 'apr', 'апрель', 'апреля', 'апреле', 'квітень', 'квітня', 'april', 'април']],
  [5, ['may', 'май', 'мая', 'травень', 'травня', 'maj', 'мај']],
  [6, ['june', 'jun', 'июнь', 'июня', 'июне', 'червень', 'червня', 'jun', 'јун']],
  [7, ['july', 'jul', 'июль', 'июля', 'июле', 'липень', 'липня', 'jul', 'јул']],
  [8, ['august', 'aug', 'август', 'августа', 'августе', 'серпень', 'серпня', 'avgust', 'август']],
  [9, ['september', 'sep', 'sept', 'сентябрь', 'сентября', 'сентябре', 'вересень', 'вересня', 'septembar', 'септембар']],
  [10, ['october', 'oct', 'октябрь', 'октября', 'октябре', 'жовтень', 'жовтня', 'oktobar', 'октобар']],
  [11, ['november', 'nov', 'ноябрь', 'ноября', 'ноябре', 'листопад', 'листопада', 'novembar', 'новембар']],
  [12, ['december', 'dec', 'декабрь', 'декабря', 'декабре', 'грудень', 'грудня', 'decembar', 'децембар']],
]);

const DISCOVERY_TERMS = [
  'cheap', 'cheapest', 'lowest fare', 'best price', 'whole month', 'flexible month',
  'дешев', 'дешёв', 'самые дешевые', 'самые дешёвые', 'весь месяц', 'на месяц',
  'найдешев', 'дешеві', 'ціни за місяць', 'весь місяць',
  'najjeftin', 'najpovoljn', 'ceo mesec', 'cijeli mjesec', 'цео месец',
];

const FLIGHT_TERMS = [
  'flight', 'flights', 'airfare', 'air ticket', 'plane ticket',
  'авиабилет', 'авиабілет', 'билет', 'билеты', 'рейс', 'перелет', 'перелёт',
  'квиток', 'квитки', 'авіаквит', 'літак',
  'let', 'letovi', 'avionsk', 'авион', 'летови',
];

const normalize = value => String(value || '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[’'`]/g, '')
  .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const countryPhraseVariants = rawValue => {
  const raw = String(rawValue || '').trim();
  const normalized = normalize(raw);
  const variants = new Set([raw, normalized]);

  const replacements = [
    [/ии$/u, 'ия'],
    [/ию$/u, 'ия'],
    [/ії$/u, 'ія'],
    [/ію$/u, 'ія'],
    [/е$/u, 'а'],
    [/у$/u, 'а'],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(normalized)) variants.add(normalized.replace(pattern, replacement));
  }
  return [...variants].filter(Boolean);
};

const resolveCountryPhrase = rawValue => {
  for (const variant of countryPhraseVariants(rawValue)) {
    const code = resolveCountryCode(variant);
    if (code) return code;
  }
  return null;
};

const countryMentions = message => {
  const rawTokens = String(message || '').match(/[\p{L}\p{N}-]+/gu) || [];
  const mentions = [];

  for (let start = 0; start < rawTokens.length; start += 1) {
    for (let width = Math.min(4, rawTokens.length - start); width >= 1; width -= 1) {
      const parts = rawTokens.slice(start, start + width);
      const phrase = parts.join(' ');
      const compactLength = phrase.replace(/\s+/g, '').length;
      const exactShortCode = width === 1 && /^[A-Z]{2}$/.test(parts[0]);
      if (compactLength < 3 && !exactShortCode) continue;

      const code = resolveCountryPhrase(phrase);
      if (!code) continue;
      if (!mentions.some(item => item.start === start && item.code === code)) {
        mentions.push({ start, width, code, label: phrase });
      }
      break;
    }
  }

  const ordered = [];
  for (const mention of mentions.sort((a, b) => a.start - b.start || b.width - a.width)) {
    if (ordered.some(item => item.code === mention.code)) continue;
    ordered.push(mention);
  }
  return ordered;
};

const detectMonthNumber = text => {
  const normalizedText = ` ${normalize(text)} `;
  for (const [number, aliases] of MONTH_ALIASES) {
    if (aliases.some(alias => normalizedText.includes(` ${normalize(alias)} `))) return number;
  }
  return null;
};

const resolveMonth = (message, fallbackDate, now = new Date()) => {
  const monthNumber = detectMonthNumber(message);
  const explicitYear = String(message || '').match(/\b(20\d{2})\b/)?.[1];

  if (monthNumber) {
    let year = explicitYear ? Number(explicitYear) : now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (!explicitYear && monthNumber < currentMonth) year += 1;
    const candidate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const max = new Date(now);
    max.setDate(max.getDate() + 365);
    if (candidate.getTime() < new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime()) return null;
    if (candidate.getTime() > max.getTime()) return null;
    return `${year}-${String(monthNumber).padStart(2, '0')}`;
  }

  const fallback = String(fallbackDate || '').match(/^(20\d{2})-(0[1-9]|1[0-2])/);
  if (!fallback) return null;
  const candidate = new Date(`${fallback[1]}-${fallback[2]}-01T00:00:00Z`);
  const max = new Date(now);
  max.setDate(max.getDate() + 365);
  return candidate <= max ? `${fallback[1]}-${fallback[2]}` : null;
};

const isFlightDiscoveryRequest = message => {
  const text = normalize(message);
  return FLIGHT_TERMS.some(term => text.includes(normalize(term)))
    && DISCOVERY_TERMS.some(term => text.includes(normalize(term)));
};

export const buildViCountryMonthFlightConversion = ({ message, context, now = new Date() }) => {
  if (!isFlightDiscoveryRequest(message)) return null;

  const countries = countryMentions(message);
  if (countries.length < 2) return null;
  const origin = countries[0];
  const destination = countries.find(item => item.code !== origin.code);
  if (!destination) return null;

  const fallbackDate = context?.currentTrip?.dates?.start_date
    || context?.currentTrip?.start_date
    || context?.currentTrip?.startDate
    || null;
  const month = resolveMonth(message, fallbackDate, now);
  if (!month) return null;

  const query = new URLSearchParams({
    originCountry: origin.code,
    destinationCountry: destination.code,
    month,
    originLabel: origin.label,
    destinationLabel: destination.label,
  });

  return {
    type: 'flight_whole_month',
    vertical: 'flights',
    label: 'Cheapest flights by month',
    mode: 'search',
    live: true,
    actionable: true,
    href: `/flights/cheap?${query.toString()}`,
    context: {
      origin: origin.label,
      originCountry: origin.code,
      destination: destination.label,
      destinationCountry: destination.code,
      month,
    },
    cta: 'Compare cheapest monthly flights',
    primaryProvider: 'travelpayouts',
  };
};
