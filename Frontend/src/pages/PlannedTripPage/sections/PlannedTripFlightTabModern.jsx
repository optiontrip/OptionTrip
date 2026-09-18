import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import FlightSearchForm from '../../../components/FlightSearchForm/FlightSearchForm';
import FlightCardGF from '../../../components/FlightCard/FlightCardGF';
import FlightCardTP from '../../../components/FlightCard/FlightCardTP';
import FlightCard from '../../../components/FlightCard/FlightCard';
import FlightCardDuffel from '../../../components/FlightCard/FlightCardDuffel';
import FlightFilters, { DEFAULT_FILTERS, applyFilters } from '../../../components/FlightFilters/FlightFilters';
import {
  searchAirports,
  searchFlightsDuffel,
  searchFlightsGoogle,
  searchFlightsTP,
  searchFlights as searchFlightsAmadeus,
} from '../../../services/flightService';
import { updateTripSelection } from '../../../services/tripsService';
import { getAccessToken } from '../../../services/authService';
import './FlightTab.css';

const buildFlightPayload = (flight, provider) => {
  if (provider === 'amadeus') {
    const outbound = flight.itineraries?.[0];
    const firstSeg = outbound?.segments?.[0];
    const lastSeg = outbound?.segments?.[outbound.segments.length - 1];
    return {
      provider,
      bookingUrl: flight.bookingUrl || '',
      price: flight.price || 0,
      currency: flight.currency || 'USD',
      departure: firstSeg?.departure?.iataCode || '',
      arrival: lastSeg?.arrival?.iataCode || '',
      airline: flight.validatingCarrier || firstSeg?.carrierCode || '',
      flightNumber: firstSeg ? `${firstSeg.carrierCode}${firstSeg.flightNumber}` : '',
    };
  }

  return {
    provider,
    bookingUrl: flight.bookingUrl || '',
    price: flight.price || 0,
    currency: flight.currency || 'USD',
    departure: flight.origin || '',
    arrival: flight.destination || '',
    airline: flight.airline || '',
    flightNumber: flight.flightNumber || '',
  };
};

const pickBestAirport = (locations = [], searchTerm = '') => {
  if (!locations.length) return null;
  const term = String(searchTerm).toLowerCase().split(',')[0].trim();
  return locations.find(item => item.cityName?.toLowerCase() === term)
    || locations.find(item => item.cityName?.toLowerCase().startsWith(term))
    || locations.find(item => item.name?.toLowerCase().startsWith(term))
    || locations.find(item => item.cityName?.toLowerCase().includes(term))
    || locations[0];
};

const PlannedTripFlightTabModern = ({ tripData, onFlightSelected }) => {
  const tripId = tripData?.trip_id || null;
  const token = getAccessToken();
  const [prefillOrigin, setPrefillOrigin] = useState(null);
  const [prefillDest, setPrefillDest] = useState(null);
  const [prefillError, setPrefillError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [source, setSource] = useState(null);
  const [duffelFlights, setDuffelFlights] = useState([]);
  const [topFlights, setTopFlights] = useState([]);
  const [otherFlights, setOtherFlights] = useState([]);
  const [tpFlights, setTpFlights] = useState([]);
  const [amadFlights, setAmadFlights] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedFlightKey, setSelectedFlightKey] = useState(null);
  const [lastSearch, setLastSearch] = useState(null);

  useEffect(() => {
    let active = true;
    const originName = tripData?.origin?.name || '';
    const destinationName = tripData?.destination?.name || '';

    const resolve = async () => {
      try {
        const [originLocations, destinationLocations] = await Promise.all([
          originName ? searchAirports(originName.split(',')[0].trim()) : Promise.resolve([]),
          destinationName ? searchAirports(destinationName.split(',')[0].trim()) : Promise.resolve([]),
        ]);
        if (!active) return;

        const origin = pickBestAirport(originLocations, originName);
        const destination = pickBestAirport(destinationLocations, destinationName);
        if (origin?.iataCode) {
          setPrefillOrigin({ code: origin.iataCode, display: `${origin.cityName || origin.name} (${origin.iataCode})` });
        }
        if (destination?.iataCode) {
          setPrefillDest({ code: destination.iataCode, display: `${destination.cityName || destination.name} (${destination.iataCode})` });
        }
      } catch {
        if (active) setPrefillError('Could not prefill airports. You can still search manually.');
      }
    };

    resolve();
    return () => { active = false; };
  }, [tripData?.origin?.name, tripData?.destination?.name]);

  const resetResults = () => {
    setSource(null);
    setDuffelFlights([]);
    setTopFlights([]);
    setOtherFlights([]);
    setTpFlights([]);
    setAmadFlights([]);
    setFilters(DEFAULT_FILTERS);
    setSearchError('');
    setSearched(false);
  };

  const handleSearch = async (params) => {
    resetResults();
    setIsLoading(true);
    setLastSearch(params);

    const {
      originCode,
      destinationCode,
      departureDate,
      returnDate,
      adults,
      includeNearby,
    } = params;

    try {
      let duffelResult = null;
      try {
        duffelResult = await searchFlightsDuffel({ originCode, destinationCode, departureDate, returnDate: returnDate || null, adults, includeNearby });
      } catch {}

      if (duffelResult?.flights?.length) {
        setSource('duffel');
        setDuffelFlights(duffelResult.flights);
        setSearched(true);
        return;
      }

      let googleResult = null;
      try {
        googleResult = await searchFlightsGoogle({ originCode, destinationCode, departureDate, returnDate: returnDate || null, adults, includeNearby });
      } catch {}

      const googleCount = (googleResult?.topFlights?.length || 0) + (googleResult?.otherFlights?.length || 0);
      if (googleCount >= 5) {
        setSource('gf');
        setTopFlights(googleResult.topFlights || []);
        setOtherFlights(googleResult.otherFlights || []);
        setSearched(true);
        return;
      }

      let tpResult = null;
      try {
        tpResult = await searchFlightsTP({ origin: originCode, destination: destinationCode, departureAt: departureDate, returnAt: returnDate || null, limit: 50 });
      } catch {}

      if (tpResult?.flights?.length) {
        setSource('tp');
        setTpFlights(tpResult.flights);
        setSearched(true);
        return;
      }

      let amadeusResult = null;
      try {
        amadeusResult = await searchFlightsAmadeus({ originCode, destinationCode, departureDate, returnDate: returnDate || null, adults });
      } catch {}

      if (amadeusResult?.flights?.length) {
        setSource('amadeus');
        setAmadFlights(amadeusResult.flights);
        setSearched(true);
        return;
      }

      setSource('gf');
      setTopFlights(googleResult?.topFlights || []);
      setOtherFlights(googleResult?.otherFlights || []);
      setSearched(true);
    } catch (error) {
      setSearchError(error?.message || 'Search failed. Please try again.');
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExploreAnywhere = (params) => {
    if (!/^[A-Z]{3}$/i.test(params.originCode || '')) {
      toast.info('For exact-date Anywhere search choose a city or airport. Use Whole month for country-wide discovery.');
      return;
    }
    const query = new URLSearchParams({
      origin: params.originCode.toUpperCase(),
      originDisplay: params.originDisplay || params.originCode,
      departureDate: params.departureDate,
      adults: String(params.adults || 1),
    });
    if (params.returnDate) query.set('returnDate', params.returnDate);
    if (tripId) query.set('tripId', String(tripId));
    window.location.assign(`/flights/explore?${query.toString()}`);
  };

  const allRaw = useMemo(() => {
    if (source === 'duffel') return duffelFlights;
    if (source === 'gf') return [...topFlights, ...otherFlights];
    if (source === 'tp') return tpFlights;
    if (source === 'amadeus') return amadFlights;
    return [];
  }, [source, duffelFlights, topFlights, otherFlights, tpFlights, amadFlights]);

  const filterable = Boolean(source && source !== 'amadeus');
  const filtered = useMemo(() => (filterable ? applyFilters(allRaw, filters) : allRaw), [allRaw, filterable, filters]);

  const selectFlight = async (flight, provider, key) => {
    if (!tripId) return;
    try {
      const payload = buildFlightPayload(flight, provider);
      await updateTripSelection(tripId, { selectedFlight: payload }, token);
      setSelectedFlightKey(key);
      onFlightSelected?.(payload);
      toast.success('Flight saved to your trip!');
    } catch {
      toast.error('Could not save flight. Please try again.');
    }
  };

  const renderCard = (flight, provider, index) => {
    const key = flight.id || `${provider}-${index}-${flight.origin || ''}-${flight.destination || ''}-${flight.price || ''}`;
    const card = provider === 'duffel'
      ? <FlightCardDuffel flight={flight} />
      : provider === 'gf'
        ? <FlightCardGF flight={flight} />
        : provider === 'tp'
          ? <FlightCardTP flight={flight} />
          : <FlightCard flight={flight} />;

    return (
      <div key={key}>
        {card}
        {tripId && (
          <button type="button" className={`ft-select-btn${selectedFlightKey === key ? ' ft-select-btn--saved' : ''}`} disabled={selectedFlightKey === key} onClick={() => selectFlight(flight, provider, key)}>
            {selectedFlightKey === key ? 'Selected ✓' : 'Select for this trip'}
          </button>
        )}
      </div>
    );
  };

  const sourceLabel = { duffel: 'Real-time fares', gf: 'Best available prices', tp: 'Best available fares', amadeus: 'Real-time fares' }[source] || '';

  return (
    <div className="ft-root ft-root--modern">
      <div className="ft-modern-intro">
        <h3>Find the best flight for this trip</h3>
        <p>Use the same OptionTrip search everywhere: exact dates, Whole month, flexible daily prices, nearby airports and live filters.</p>
      </div>

      {prefillError && <div className="ft-auto-error">{prefillError}</div>}

      <FlightSearchForm onSearch={handleSearch} isLoading={isLoading} prefillOrigin={prefillOrigin} prefillDest={prefillDest} onOriginErrorClear={() => setPrefillError('')} onExploreAnywhere={handleExploreAnywhere} />

      {isLoading && (
        <div className="ft-auto-loading">
          {[1, 2, 3].map(item => <div key={item} className="fcgf-skeleton"><div className="fcgf-skeleton__body pulse" /></div>)}
        </div>
      )}

      {searched && !isLoading && (
        <div className="ft-results">
          {searchError ? (
            <div className="ft-empty"><div className="ft-empty__icon">✈️</div><h3>Search failed</h3><p>{searchError}</p></div>
          ) : allRaw.length === 0 ? (
            <div className="ft-empty"><div className="ft-empty__icon">✈️</div><h3>No flights found</h3><p>Try Whole month, flexible dates or nearby airports to widen the search.</p></div>
          ) : (
            <>
              <div className="ft-results__header">
                <h3>{filtered.length} flight{filtered.length === 1 ? '' : 's'} found</h3>
                <p>{lastSearch?.originDisplay || lastSearch?.originCode} → {lastSearch?.destinationDisplay || lastSearch?.destinationCode}{lastSearch?.departureDate ? ` · ${lastSearch.departureDate}` : ''}{sourceLabel ? ` · ${sourceLabel}` : ''}</p>
              </div>
              <div className="ft-results-layout">
                {filterable && <FlightFilters flights={allRaw} filters={filters} onChange={setFilters} />}
                <div className="ft-results-col">
                  {filtered.length === 0 ? <p className="ft-suggested__empty">No flights match these filters. Reset one or more filters.</p> : filtered.map((flight, index) => renderCard(flight, source, index))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PlannedTripFlightTabModern;
