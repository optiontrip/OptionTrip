import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import FlightSearchForm from '../components/FlightSearchForm/FlightSearchForm';
import FlightCardGF     from '../components/FlightCard/FlightCardGF';
import FlightCardTP     from '../components/FlightCard/FlightCardTP';
import FlightCard       from '../components/FlightCard/FlightCard';
import FlightCardDuffel from '../components/FlightCard/FlightCardDuffel';
import ExploreDestinations from '../components/ExploreDestinations/ExploreDestinations';
import FlightFilters, { DEFAULT_FILTERS, applyFilters } from '../components/FlightFilters/FlightFilters';
import CountryCityPicker from '../components/CountryCityPicker/CountryCityPicker';
import NearbyAirportsBanner from '../components/NearbyAirportsBanner/NearbyAirportsBanner';
import { searchFlightsDuffel, searchFlightsGoogle, searchFlightsTP, searchFlights as searchFlightsAmadeus } from '../services/flightService';
import { logActivity } from '../services/activityService';
import { searchHotels } from '../services/hotelService';
import HotelCard from '../components/HotelCard/HotelCard';
import useCurrency from '../hooks/useCurrency';
import './FlightSearch.css';

const TP_MARKER = '370056';

const buildAviasalesUrl = ({ originCode, destinationCode, departureDate, returnDate, adults }) => {
  const fmt = (d) => { const [, mm, dd] = d.split('-'); return `${dd}${mm}`; };
  const pax = String(adults || 1);
  const returnPart = returnDate ? fmt(returnDate) : '';
  return `https://www.aviasales.com/search/${originCode}${fmt(departureDate)}${destinationCode}${returnPart}${pax}?marker=${TP_MARKER}`;
};

const getProviderCandidates = ({ duffelResult, gfResult, tpResult, amadResult }) => [
  {
    source: 'duffel',
    count: duffelResult?.flights?.length || 0,
    flights: duffelResult?.flights || [],
    nearbyMeta: duffelResult?.nearbyMeta || null,
    priority: 0,
  },
  {
    source: 'gf',
    count: (gfResult?.topFlights?.length || 0) + (gfResult?.otherFlights?.length || 0),
    topFlights: gfResult?.topFlights || [],
    otherFlights: gfResult?.otherFlights || [],
    nearbyMeta: gfResult?.nearbyMeta || null,
    priority: 1,
  },
  {
    source: 'tp',
    count: tpResult?.flights?.length || 0,
    flights: tpResult?.flights || [],
    priority: 2,
  },
  {
    source: 'amadeus',
    count: amadResult?.flights?.length || 0,
    flights: amadResult?.flights || [],
    priority: 3,
  },
].filter(candidate => candidate.count > 0)
  .sort((a, b) => (b.count - a.count) || (a.priority - b.priority));

const pickRichestProvider = results => getProviderCandidates(results)[0] || null;

const SkeletonCard = () => (
  <div className="fcgf-skeleton">
    <div className="fcgf-skeleton__logo pulse" />
    <div className="fcgf-skeleton__body">
      <div className="fcgf-skeleton__line pulse" />
      <div className="fcgf-skeleton__line fcgf-skeleton__line--short pulse" />
    </div>
    <div className="fcgf-skeleton__price pulse" />
  </div>
);

const FlightSectionHeader = ({ type, count, route }) => {
  const isTop = type === 'top';
  return (
    <div className={`fs-section-header fs-section-header--${isTop ? 'top' : 'other'}`}>
      <div className="fs-section-header__left">
        <div className="fs-section-header__icon">
          {isTop ? (
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div>
          <div className="fs-section-header__title">{isTop ? 'Top Flights' : 'Other Flights'}</div>
          <div className="fs-section-header__sub">
            {isTop ? `Best value & fastest - ${route}` : `More options for ${route}`}
          </div>
        </div>
      </div>
      <span className="fs-section-header__badge">{count} flight{count !== 1 ? 's' : ''}</span>
    </div>
  );
};

const SourceHeader = ({ source, count, route }) => {
  const cfg = {
    duffel: { cls: 'top',   title: 'OptionTrip Flights', sub: `Real-time fares · ${route}` },
    tp:     { cls: 'top',   title: 'OptionTrip Flights', sub: `Best available fares · ${route}` },
    amadeus:{ cls: 'other', title: 'OptionTrip Flights', sub: `Real-time fares · ${route}` },
  }[source] || {};
  return (
    <div className={`fs-section-header fs-section-header--${cfg.cls}`} style={{ marginTop: 0 }}>
      <div className="fs-section-header__left">
        <div className="fs-section-header__icon">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <div className="fs-section-header__title">{cfg.title}</div>
          <div className="fs-section-header__sub">{cfg.sub}</div>
        </div>
      </div>
      <span className="fs-section-header__badge">{count} flight{count !== 1 ? 's' : ''}</span>
    </div>
  );
};

const PAGE_SIZE = 8;

const Pagination = ({ page, total, onChange }) => {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const getVisible = () => {
    if (total <= 7) return pages;
    if (page <= 4) return [...pages.slice(0, 5), '…', total];
    if (page >= total - 3) return [1, '…', ...pages.slice(total - 5)];
    return [1, '…', page - 1, page, page + 1, '…', total];
  };
  return (
    <div className="fs-pagination">
      <button className="fs-page-btn fs-page-btn--nav" onClick={() => onChange(page - 1)} disabled={page === 1}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {getVisible().map((p, i) =>
        p === '…'
          ? <span key={`e-${i}`} className="fs-page-ellipsis">…</span>
          : <button key={p} className={`fs-page-btn${p === page ? ' fs-page-btn--active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="fs-page-btn fs-page-btn--nav" onClick={() => onChange(page + 1)} disabled={page === total}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
};

const SOURCE_NONE = null;
const EXPLORE_MODAL_LIMIT = 8;

const formatModalTime = (value) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const normalizeExploreFlight = (flight, source, fallbackOrigin, fallbackDestination) => {
  if (source === 'amadeus') {
    const outbound = flight.itineraries?.[0];
    const firstSeg = outbound?.segments?.[0];
    const lastSeg = outbound?.segments?.[outbound.segments.length - 1];
    return {
      id: flight.id || `${source}-${firstSeg?.id || Math.random()}`,
      airline: flight.validatingCarrier || firstSeg?.carrierCode || 'Airline',
      origin: firstSeg?.departure?.iataCode || fallbackOrigin,
      destination: lastSeg?.arrival?.iataCode || fallbackDestination,
      departureTime: firstSeg?.departure?.time || null,
      arrivalTime: lastSeg?.arrival?.time || null,
      duration: outbound?.totalDuration || 'N/A',
      stops: Number.isFinite(flight.numberOfStops)
        ? flight.numberOfStops
        : Math.max((outbound?.segments?.length || 1) - 1, 0),
      price: flight.price,
      currency: flight.currency || 'USD',
      bookingUrl: flight.bookingUrl || null,
    };
  }

  return {
    id: flight.id || `${source}-${flight.flightNumber || Math.random()}`,
    airline: flight.airline || 'Airline',
    origin: flight.origin || fallbackOrigin,
    destination: flight.destination || fallbackDestination,
    departureTime: flight.departureTime || flight.departureAt || null,
    arrivalTime: flight.arrivalTime || null,
    duration: flight.duration || 'N/A',
    stops: Number.isFinite(flight.stops) ? flight.stops : 0,
    price: flight.price,
    currency: flight.currency || 'USD',
    bookingUrl: flight.bookingUrl || null,
  };
};

const FlightSearch = () => {
  const { formatPriceFromCurrency } = useCurrency();
  const [source,        setSource]       = useState(SOURCE_NONE);
  const [duffelFlights, setDuffelFlights]= useState([]);
  const [topFlights,    setTopFlights]   = useState([]);
  const [otherFlights,  setOtherFlights] = useState([]);
  const [tpFlights,     setTpFlights]    = useState([]);
  const [amadFlights,   setAmadFlights]  = useState([]);

  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');
  const [searched,     setSearched]     = useState(false);
  const [lastSearch,   setLastSearch]   = useState(null);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [prefillDest,     setPrefillDest]     = useState(null);
  const [prefillOrigin,   setPrefillOrigin]   = useState(null);
  const [originFieldError,setOriginFieldError]= useState('');
  const [detectedOrigin,  setDetectedOrigin]  = useState(null);
  const [filters,             setFilters]            = useState(DEFAULT_FILTERS);
  const [exploreTripType,     setExploreTripType]     = useState('one-way');
  const [exploreReturnDate,   setExploreReturnDate]   = useState('');
  const [exploreModal,        setExploreModal]        = useState({
    isOpen: false,
    isLoading: false,
    error: '',
    destination: null,
    originDisplay: '',
    tickets: [],
    source: '',
  });

  const [countryFlow, setCountryFlow] = useState(null);
  const [nearbyMeta,  setNearbyMeta]  = useState(null);

  const [hotelResults,  setHotelResults]  = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelError,    setHotelError]    = useState(null);
  const [hotelsFor,     setHotelsFor]     = useState(null);

  const navigate = useNavigate();
  const formRef    = useRef(null);
  const exploreRef = useRef(null);

  useEffect(() => {
    if (exploreModal.isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [exploreModal.isOpen]);

  const resetResults = () => {
    setSource(SOURCE_NONE);
    setDuffelFlights([]);
    setTopFlights([]); setOtherFlights([]);
    setTpFlights([]); setAmadFlights([]);
    setError(''); setCurrentPage(1); setFilters(DEFAULT_FILTERS);
    setNearbyMeta(null);
    setHotelResults([]); setHotelsLoading(false); setHotelError(null); setHotelsFor(null);
  };

  const applyProviderSelection = (candidate) => {
    if (!candidate) {
      setSource('gf');
      return;
    }

    setSource(candidate.source);
    if (candidate.source === 'duffel') setDuffelFlights(candidate.flights || []);
    if (candidate.source === 'gf') {
      setTopFlights(candidate.topFlights || []);
      setOtherFlights(candidate.otherFlights || []);
    }
    if (candidate.source === 'tp') setTpFlights(candidate.flights || []);
    if (candidate.source === 'amadeus') setAmadFlights(candidate.flights || []);
    if (candidate.nearbyMeta) setNearbyMeta(candidate.nearbyMeta);
  };

  const handleSearch = async (params) => {
    if (params.originCountryData?.isCountry || params.destCountryData?.isCountry) {
      setSearched(false);
      resetResults();
      setCountryFlow({
        step:             params.destCountryData?.isCountry ? 'dest' : 'origin',
        originCountry:    params.originCountryData || null,
        destCountry:      params.destCountryData   || null,
        originCode:       params.originCode,
        selectedDestCity: null,
        departureDate:    params.departureDate,
        returnDate:       params.returnDate || null,
        adults:           params.adults,
      });
      return;
    }

    setCountryFlow(null);
    setIsLoading(true);
    setSearched(true);
    setLastSearch(params);
    resetResults();

    logActivity({
      type: 'flight',
      action: 'searched',
      title: `Searched flights ${params.originCode || ''} → ${params.destinationCode || ''}`.trim(),
      metadata: {
        origin: params.originDisplay || params.originCode,
        destination: params.destinationDisplay || params.destinationCode,
        dates: { start_date: params.departureDate, end_date: params.returnDate || null },
        partySize: params.adults,
        cabin: params.cabin || null,
        roundTrip: !!params.returnDate
      }
    });

    if (params.includeHotels && params.destinationCode && !/^[A-Z]{2}$/i.test(params.destinationCode)) {
      const cityName = (params.destinationDisplay || '').split(' (')[0].trim();
      const checkIn  = params.departureDate;
      const checkOut = params.returnDate || (() => {
        const d = new Date(params.departureDate + 'T00:00:00');
        d.setDate(d.getDate() + 3);
        return d.toISOString().split('T')[0];
      })();
      setHotelsLoading(true);
      setHotelsFor(cityName || params.destinationCode);
      searchHotels({
        destId: params.destinationCode.toUpperCase(),
        searchType: 'CITY',
        checkIn,
        checkOut,
        adults: params.adults || 1,
        cityName,
      })
        .then(data => { setHotelResults(data.hotels || []); setHotelsLoading(false); })
        .catch(err => { console.warn('Hotel search failed:', err.message); setHotelError(err.message); setHotelsLoading(false); });
    }

    try {
      const [duffelResult, gfResult, tpResult, amadResult] = await Promise.all([
        searchFlightsDuffel({
          originCode: params.originCode,
          destinationCode: params.destinationCode,
          departureDate: params.departureDate,
          returnDate: params.returnDate || null,
          adults: params.adults,
          includeNearby: params.includeNearby || false,
        }).catch(() => null),
        searchFlightsGoogle({
          originCode: params.originCode,
          destinationCode: params.destinationCode,
          departureDate: params.departureDate,
          returnDate: params.returnDate || null,
          adults: params.adults,
          includeNearby: params.includeNearby || false,
        }).catch(() => null),
        searchFlightsTP({
          origin: params.originCode,
          destination: params.destinationCode,
          departureAt: params.departureDate,
          returnAt: params.returnDate || null,
          limit: 50,
        }).catch(() => null),
        searchFlightsAmadeus({
          originCode: params.originCode,
          destinationCode: params.destinationCode,
          departureDate: params.departureDate,
          returnDate: params.returnDate || null,
          adults: params.adults,
        }).catch(() => null),
      ]);

      const best = pickRichestProvider({ duffelResult, gfResult, tpResult, amadResult });
      applyProviderSelection(best);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExploreAnywhereFromForm = (tripContext) => {
    const originCode = tripContext?.originCode || '';
    const originDisplay = tripContext?.originDisplay || originCode;

    if (!originCode || !tripContext?.departureDate) {
      setOriginFieldError('Select a departure airport or allow location access to use Explore Anywhere');
      return;
    }

    const query = new URLSearchParams({
      origin: originCode,
      departureDate: tripContext.departureDate,
      adults: String(tripContext.adults || 1),
    });

    if (tripContext.returnDate) query.set('returnDate', tripContext.returnDate);
    if (originDisplay) query.set('originDisplay', originDisplay);
    navigate(`/flights/explore?${query.toString()}`);
  };

  const handleOriginDetected = (result) => { setDetectedOrigin(result); };

  const closeExploreModal = () => {
    setExploreModal(prev => ({ ...prev, isOpen: false }));
    setExploreTripType('one-way');
    setExploreReturnDate('');
  };

  const fetchExploreTickets = async ({ originCode, destinationCode, departureDate, returnDate = null, adults }) => {
    const [duffelResult, gfResult, tpResult, amadResult] = await Promise.all([
      searchFlightsDuffel({ originCode, destinationCode, departureDate, returnDate, adults }).catch(() => null),
      searchFlightsGoogle({ originCode, destinationCode, departureDate, returnDate, adults }).catch(() => null),
      searchFlightsTP({ origin: originCode, destination: destinationCode, departureAt: departureDate, returnAt: returnDate || null, limit: 30 }).catch(() => null),
      searchFlightsAmadeus({ originCode, destinationCode, departureDate, returnDate, adults }).catch(() => null),
    ]);

    const best = pickRichestProvider({ duffelResult, gfResult, tpResult, amadResult });
    if (!best) return { source: 'none', flights: [] };
    if (best.source === 'gf') return { source: 'gf', flights: [...best.topFlights, ...best.otherFlights] };
    return { source: best.source, flights: best.flights || [] };
  };

  const openExploreTicketsModal = async ({ destination, returnDate = null }) => {
    const originCode = detectedOrigin?.iata || '';
    const originDisplay = detectedOrigin?.display || '';

    setExploreModal({ isOpen: true, isLoading: true, error: '', destination, originDisplay, tickets: [], source: '' });

    if (!originCode) {
      setExploreModal(prev => ({ ...prev, isLoading: false, error: 'Please set your departure city first so we can show available tickets.' }));
      return;
    }

    const departureDate = getFutureDate(30);

    try {
      const result = await fetchExploreTickets({ originCode, destinationCode: destination.iata, departureDate, returnDate, adults: 1 });
      const tickets = (result.flights || [])
        .slice(0, EXPLORE_MODAL_LIMIT)
        .map(f => normalizeExploreFlight(f, result.source, originCode, destination.iata));

      setExploreModal(prev => ({
        ...prev,
        isLoading: false,
        tickets,
        source: result.source,
        error: tickets.length ? '' : 'No tickets found for this destination right now. Try another one or a different date.',
      }));
    } catch (err) {
      setExploreModal(prev => ({ ...prev, isLoading: false, error: err.message || 'Unable to load available tickets right now.' }));
    }
  };

  const handleExploreTripTypeChange = (newType) => {
    setExploreTripType(newType);
    if (newType === 'one-way') {
      setExploreReturnDate('');
      if (exploreModal.destination) openExploreTicketsModal({ destination: exploreModal.destination, returnDate: null });
    }
  };

  const handleExploreReturnDateChange = (date) => {
    setExploreReturnDate(date);
    if (date && exploreModal.destination) openExploreTicketsModal({ destination: exploreModal.destination, returnDate: date });
  };

  const handleModalGoToSearch = () => {
    closeExploreModal();
    setOriginFieldError('Enter your departure city or allow location access to view available tickets');
    setTimeout(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
  };

  const handleExploreSelect = ({ iata, city }) => {
    const dest = { code: iata, display: `${city} (${iata})` };
    setPrefillDest(dest);
    setPrefillOrigin(detectedOrigin ? { code: detectedOrigin.iata, display: detectedOrigin.display } : null);
    setOriginFieldError('');
    openExploreTicketsModal({ destination: { iata, city } });
  };

  const allRaw = source === 'duffel'
    ? duffelFlights
    : source === 'gf'
      ? [...topFlights, ...otherFlights]
      : source === 'tp'
        ? tpFlights
        : amadFlights;

  const filterable = source !== 'amadeus';
  const filtered = filterable ? applyFilters(allRaw, filters) : allRaw;

  const sourceNote = {
    duffel: 'OptionTrip · Real-time fares · Refundable options available',
    gf: 'OptionTrip · Best prices per person',
    tp: 'OptionTrip · Best available fares',
    amadeus: 'OptionTrip · Real-time fares',
  }[source] || '';

  return (
    <>
      <PageMeta title="Search Flights" description="Search and compare flights from multiple trusted sources. Find the best prices for your next trip." path="/flights" />

      <section className="flight-hero">
        <div className="container">
          <div className="flight-hero__content text-center">
            <h1 className="mb-3">Find Your <span className="theme">Perfect Flight</span></h1>
            <p className="flight-hero__subtitle">
              Search, compare, and book flights easily from trusted sources - all in one platform.
            </p>
          </div>
        </div>
      </section>

      <div ref={formRef}>
        <FlightSearchForm
          onSearch={handleSearch}
          isLoading={isLoading}
          prefillDest={prefillDest}
          prefillOrigin={prefillOrigin}
          originError={originFieldError}
          onOriginErrorClear={() => setOriginFieldError('')}
          onExploreAnywhere={handleExploreAnywhereFromForm}
        />
      </div>

      {countryFlow && (
        <section className="flight-results-section">
          <div className="container">
            {countryFlow.step === 'dest' && (
              <CountryCityPicker
                step="dest"
                cities={countryFlow.destCountry?.countryAirports || []}
                countryName={countryFlow.destCountry?.countryName || ''}
                originCode={countryFlow.originCountry ? null : countryFlow.originCode}
                departureDate={countryFlow.departureDate}
                returnDate={countryFlow.returnDate}
                adults={countryFlow.adults}
                onSelect={(city) => {
                  if (countryFlow.originCountry) {
                    setCountryFlow(f => ({ ...f, step: 'origin', selectedDestCity: city }));
                  } else {
                    setCountryFlow(null);
                    handleSearch({ originCode: countryFlow.originCode, destinationCode: city.iataCode, departureDate: countryFlow.departureDate, returnDate: countryFlow.returnDate, adults: countryFlow.adults });
                  }
                }}
                onBack={() => setCountryFlow(null)}
              />
            )}

            {countryFlow.step === 'origin' && (
              <CountryCityPicker
                step="origin"
                cities={countryFlow.originCountry?.countryAirports || []}
                countryName={countryFlow.originCountry?.countryName || ''}
                originCode={null}
                departureDate={countryFlow.departureDate}
                returnDate={countryFlow.returnDate}
                adults={countryFlow.adults}
                onSelect={(city) => {
                  const destCode = countryFlow.selectedDestCity?.iataCode || countryFlow.destCode;
                  setCountryFlow(null);
                  handleSearch({ originCode: city.iataCode, destinationCode: destCode, departureDate: countryFlow.departureDate, returnDate: countryFlow.returnDate, adults: countryFlow.adults });
                }}
                onBack={() => setCountryFlow(f => ({ ...f, step: 'dest' }))}
              />
            )}
          </div>
        </section>
      )}

      {!searched && !countryFlow && (
        <div ref={exploreRef}>
          <ExploreDestinations onSelect={handleExploreSelect} onOriginDetected={handleOriginDetected} />
        </div>
      )}

      {searched && (
        <section className="flight-results-section">
          <div className="container">
            {isLoading && <div>{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>}

            {!isLoading && error && (
              <div className="flight-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
                <h3>Search failed</h3>
                <p style={{ marginBottom: 16 }}>{error}</p>
                <a href={buildAviasalesUrl(lastSearch)} target="_blank" rel="noopener noreferrer" className="fsf-search-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                  Search on Aviasales ↗
                </a>
              </div>
            )}

            {!isLoading && !error && allRaw.length === 0 && (
              !lastSearch?.includeNearby ? (
                <NearbyAirportsBanner lastSearch={lastSearch} onRetry={(enrichedParams) => handleSearch(enrichedParams)} />
              ) : (
                <div className="flight-empty">
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
                  <h3>No flights found</h3>
                  <p>No results for <strong>{lastSearch?.originCode} → {lastSearch?.destinationCode}</strong> on <strong>{lastSearch?.departureDate}</strong>, including nearby airports. Try different dates.</p>
                  <a href={buildAviasalesUrl(lastSearch)} target="_blank" rel="noopener noreferrer" className="fsf-search-btn" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 16 }}>
                    Search on Aviasales ↗
                  </a>
                </div>
              )
            )}

            {!isLoading && !error && allRaw.length > 0 && (() => {
              const route = `${lastSearch?.originCode} → ${lastSearch?.destinationCode}`;
              const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
              const safePage = Math.min(currentPage, Math.max(1, totalPages));

              return (
                <>
                  <div className="flight-results-header">
                    <h2 className="flight-results-title">
                      {filtered.length} flight{filtered.length !== 1 ? 's' : ''} found
                      <span className="flight-results-route"> - {route}</span>
                    </h2>
                    <p className="flight-results-note">{sourceNote}</p>
                    {nearbyMeta && (
                      <p className="flight-results-nearby-note">
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ display:'inline', marginRight:4, verticalAlign:'middle' }}>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" fill="currentColor"/>
                        </svg>
                        Searched:{' '}
                        <strong>
                          {[lastSearch.originCode, ...(nearbyMeta.originAirports?.map(a => a.iata) || [])].join(', ')}
                          {' → '}
                          {[lastSearch.destinationCode, ...(nearbyMeta.destAirports?.map(a => a.iata) || [])].join(', ')}
                        </strong>
                        {nearbyMeta.destAirports?.length > 0 && (
                          <span style={{ marginLeft: 8, color: '#64748b' }}>
                            ({nearbyMeta.destAirports.map(a => `${a.iata} ${a.distanceKm} km`).join(', ')})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="fs-results-layout">
                    {filterable && (
                      <FlightFilters flights={allRaw} filters={filters} onChange={f => { setFilters(f); setCurrentPage(1); }} />
                    )}

                    <div className="fs-results-col">
                      {source === 'duffel' && (() => {
                        const filtDuffel = applyFilters(duffelFlights, filters);
                        const pSlice = filtDuffel.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                        return (
                          <>
                            <SourceHeader source="duffel" count={duffelFlights.length} route={route} />
                            {pSlice.length === 0
                              ? <p style={{ color: '#64748b', padding: '32px 0', textAlign: 'center' }}>No flights match your filters.</p>
                              : pSlice.map(f => <FlightCardDuffel key={f.id} flight={f} />)}
                          </>
                        );
                      })()}

                      {source === 'gf' && (() => {
                        const filtTop = applyFilters(topFlights, filters);
                        const filtOther = applyFilters(otherFlights, filters);
                        const allFilt = [...filtTop, ...filtOther];
                        const pSlice = allFilt.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                        const pTop = pSlice.filter(f => filtTop.includes(f));
                        const pOther = pSlice.filter(f => filtOther.includes(f));
                        return (
                          <>
                            {pTop.length > 0 && <><FlightSectionHeader type="top" count={filtTop.length} route={route} />{pTop.map(f => <FlightCardGF key={f.id} flight={f} />)}</>}
                            {pOther.length > 0 && <><FlightSectionHeader type="other" count={filtOther.length} route={route} />{pOther.map(f => <FlightCardGF key={f.id} flight={f} />)}</>}
                            {allFilt.length === 0 && <p style={{ color: '#64748b', padding: '32px 0', textAlign: 'center' }}>No flights match your filters.</p>}
                          </>
                        );
                      })()}

                      {source === 'tp' && (() => {
                        const filtTP = applyFilters(tpFlights, filters);
                        const pSlice = filtTP.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                        return (
                          <>
                            <SourceHeader source="tp" count={tpFlights.length} route={route} />
                            {pSlice.length === 0
                              ? <p style={{ color: '#64748b', padding: '32px 0', textAlign: 'center' }}>No flights match your filters.</p>
                              : pSlice.map(f => <FlightCardTP key={f.id} flight={f} />)}
                          </>
                        );
                      })()}

                      {source === 'amadeus' && (() => {
                        const pSlice = amadFlights.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                        return <><SourceHeader source="amadeus" count={amadFlights.length} route={route} />{pSlice.map((f, i) => <FlightCard key={f.id || i} flight={f} />)}</>;
                      })()}

                      {totalPages > 1 && filtered.length > 0 && <Pagination page={safePage} total={totalPages} onChange={setCurrentPage} />}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}

      {exploreModal.isOpen && (
        <div className="explore-ticket-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeExploreModal(); }}>
          <div className="explore-ticket-modal" role="dialog" aria-modal="true" aria-label="Available tickets">
            <button className="explore-ticket-modal__close" onClick={closeExploreModal} aria-label="Close ticket modal">×</button>

            <div className="explore-ticket-modal__head">
              <h3>Available Tickets: {exploreModal.destination?.city} ({exploreModal.destination?.iata})</h3>
              <p>{exploreModal.originDisplay ? `From ${exploreModal.originDisplay} · ${EXPLORE_MODAL_LIMIT} best options` : 'Set departure city to load available tickets'}</p>

              <div className="explore-trip-type-row" style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button className={`explore-trip-type-btn${exploreTripType === 'one-way' ? ' explore-trip-type-btn--active' : ''}`} onClick={() => handleExploreTripTypeChange('one-way')}>One Way</button>
                <button className={`explore-trip-type-btn${exploreTripType === 'round-trip' ? ' explore-trip-type-btn--active' : ''}`} onClick={() => handleExploreTripTypeChange('round-trip')}>Round Trip</button>
                {exploreTripType === 'round-trip' && (
                  <div className="explore-return-date-picker" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label htmlFor="fs-explore-return-date" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Return:</label>
                    <input id="fs-explore-return-date" type="date" value={exploreReturnDate} min={getFutureDate(31)} onChange={(e) => handleExploreReturnDateChange(e.target.value)} className="explore-return-date-input" />
                  </div>
                )}
              </div>
            </div>

            {exploreModal.isLoading && <div className="explore-ticket-modal__state">Loading available tickets...</div>}

            {!exploreModal.isLoading && exploreModal.error && (
              <div className="explore-ticket-modal__state explore-ticket-modal__state--error">
                <p>{exploreModal.error}</p>
                {!exploreModal.originDisplay && <button className="explore-ticket-modal__action" onClick={handleModalGoToSearch}>Set departure city</button>}
              </div>
            )}

            {!exploreModal.isLoading && !exploreModal.error && exploreModal.tickets.length > 0 && (
              <>
                <div className="explore-ticket-modal__meta">
                  <span>{exploreModal.tickets.length} ticket{exploreModal.tickets.length !== 1 ? 's' : ''}</span>
                  <span>Source: {exploreModal.source}</span>
                </div>

                <div className="explore-ticket-modal__list">
                  {exploreModal.tickets.map((ticket) => {
                    const price = ticket.price != null ? formatPriceFromCurrency(ticket.price, ticket.currency || 'USD') : null;
                    const stopsText = ticket.stops === 0 ? 'Direct' : `${ticket.stops} stop${ticket.stops > 1 ? 's' : ''}`;
                    return (
                      <div className="explore-ticket-item" key={ticket.id}>
                        <div className="explore-ticket-item__top"><strong>{ticket.airline}</strong><span className="explore-ticket-item__stops">{stopsText}</span></div>
                        <div className="explore-ticket-item__route"><span>{ticket.origin} {formatModalTime(ticket.departureTime)}</span><span>{ticket.duration}</span><span>{ticket.destination} {formatModalTime(ticket.arrivalTime)}</span></div>
                        <div className="explore-ticket-item__bottom">
                          <span className="explore-ticket-item__price">{price || 'Price unavailable'}</span>
                          {ticket.bookingUrl
                            ? <a href={ticket.bookingUrl} target="_blank" rel="noopener noreferrer" className="explore-ticket-item__book">Book now</a>
                            : <span className="explore-ticket-item__book explore-ticket-item__book--disabled">No booking link</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(hotelsLoading || hotelResults.length > 0 || hotelError) && (
        <section className="flt-hotels-section">
          <div className="container">
            <div className="fs-section-header fs-section-header--hotel" style={{ marginTop: 0 }}>
              <div className="fs-section-header__left">
                <div className="fs-section-header__icon">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M2 20h20M2 20V8l10-5 10 5v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="11" y="8" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
                  </svg>
                </div>
                <div>
                  <div className="fs-section-header__title">Stays in {hotelsFor}</div>
                  <div className="fs-section-header__sub">
                    {lastSearch?.departureDate && <>
                      Check-in {lastSearch.departureDate}
                      {lastSearch.returnDate ? ` · Check-out ${lastSearch.returnDate}` : ' (3 nights)'}
                      {` · ${lastSearch.adults} adult${lastSearch.adults !== 1 ? 's' : ''}`}
                    </>}
                  </div>
                </div>
              </div>
              {!hotelsLoading && hotelResults.length > 0 && <span className="fs-section-header__badge">{hotelResults.length} stay{hotelResults.length !== 1 ? 's' : ''}</span>}
              {hotelsLoading && <span className="fs-section-header__badge flt-hotels-badge--loading">Searching…</span>}
            </div>

            {hotelsLoading && (
              <div className="flt-hotels-grid" style={{ marginTop: 16 }}>
                {[1,2,3].map(i => (
                  <div key={i} className="hs-skeleton">
                    <div className="hs-skeleton__img pulse" />
                    <div className="hs-skeleton__body"><div className="hs-skeleton__line pulse" /><div className="hs-skeleton__line hs-skeleton__line--short pulse" /></div>
                    <div className="hs-skeleton__cta pulse" />
                  </div>
                ))}
              </div>
            )}

            {!hotelsLoading && hotelError && <p className="flt-hotels-error">Could not load stays - {hotelError}</p>}

            {!hotelsLoading && !hotelError && hotelResults.length > 0 && (
              <div className="flt-hotels-grid">{hotelResults.slice(0, 6).map(hotel => <HotelCard key={hotel.hotelId} hotel={hotel} />)}</div>
            )}
          </div>
        </section>
      )}
    </>
  );
};

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default FlightSearch;
