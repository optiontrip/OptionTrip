const IATA_RE = /^[A-Z]{3}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

const normalizeCode = value => String(value || '').trim().toUpperCase();

export const searchableAirportCodes = (code, locationData) => {
  const groupedAirports = locationData?.isCountry
    ? locationData.countryAirports
    : locationData?.isCity
      ? locationData.cityAirports
      : [];

  const groupedCodes = (Array.isArray(groupedAirports) ? groupedAirports : [])
    .map(airport => normalizeCode(airport?.iataCode))
    .filter(iata => IATA_RE.test(iata));

  if (groupedCodes.length) return [...new Set(groupedCodes)];
  const normalized = normalizeCode(code);
  return IATA_RE.test(normalized) ? [normalized] : [];
};

export const countryCodeForLocation = (code, locationData) => {
  if (!locationData?.isCountry) return null;
  const normalized = normalizeCode(locationData.countryCode || code);
  return COUNTRY_RE.test(normalized) ? normalized : null;
};

export const buildWholeMonthExplorerUrl = ({
  originCode,
  originDisplay,
  originLocationData,
  destinationCode,
  destinationDisplay,
  destinationLocationData,
  month,
  returnMonth = '',
  anywhere = false,
}) => {
  const originCountry = countryCodeForLocation(originCode, originLocationData);
  const destinationCountry = anywhere ? null : countryCodeForLocation(destinationCode, destinationLocationData);

  const query = new URLSearchParams({
    month: String(month || ''),
    originLabel: originDisplay || originCode || '',
    destinationLabel: anywhere ? 'Anywhere' : (destinationDisplay || destinationCode || ''),
  });
  if (returnMonth) query.set('returnMonth', returnMonth);

  if (!anywhere && originCountry && destinationCountry && originCountry !== destinationCountry) {
    query.set('originCountry', originCountry);
    query.set('destinationCountry', destinationCountry);
    return {
      url: `/flights/cheap?${query.toString()}`,
      mode: 'country-to-country',
      origins: searchableAirportCodes(originCode, originLocationData),
      destinations: searchableAirportCodes(destinationCode, destinationLocationData),
    };
  }

  const origins = searchableAirportCodes(originCode, originLocationData);
  const destinations = anywhere ? [] : searchableAirportCodes(destinationCode, destinationLocationData);
  if (!origins.length || (!anywhere && !destinations.length)) {
    return {
      url: null,
      mode: anywhere ? 'anywhere' : 'airport-matrix',
      origins,
      destinations,
    };
  }

  query.set('origins', origins.join(','));
  query.set('destinations', anywhere ? 'ANYWHERE' : destinations.join(','));
  return {
    url: `/flights/cheap?${query.toString()}`,
    mode: anywhere ? 'anywhere' : 'airport-matrix',
    origins,
    destinations,
  };
};
