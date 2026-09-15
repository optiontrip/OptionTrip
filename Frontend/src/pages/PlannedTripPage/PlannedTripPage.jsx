import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import HeroSection from './sections/HeroSection';
import LiveTripPanel from './sections/LiveTripPanel';
import ActivitiesSection from './sections/ActivitiesSection';
import ViOpportunityPanel from './sections/ViOpportunityPanel';
import ViAssistant from '../../components/ViAssistant/ViAssistant';
import PageMeta from '../../hooks/usePageMeta';
import Loader from '../../components/Loader/Loader';
import { getTripById, generateAllDaysProgressively, getCachedItinerary, setCachedItinerary, saveTrip, confirmTrip, shareTrip, startTrip } from '../../services/tripsService';
import { getAccessToken } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './PlannedTripPage.css';

const PlannedTripHeader = ({ tripId }) => <header className="planned-trip-header"><div className="planned-trip-header__container"><Link to="/" className="planned-trip-header__logo"><img src="/images/newLogo.png" alt="OptionTrip" /></Link><nav className="planned-trip-header__nav" aria-label="Trip navigation"><Link to="/" className="planned-trip-header__link">Home</Link>{tripId && <Link to={`/trips/${tripId}`} className="planned-trip-header__link">Trip Options</Link>}<Link to="/blog" className="planned-trip-header__link">Blogs</Link></nav></div></header>;

const formatMoney = (value, currency = 'USD') => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: String(currency || 'USD').toUpperCase(), maximumFractionDigits: 0 }).format(amount); }
  catch { return `${String(currency || 'USD').toUpperCase()} ${amount.toLocaleString()}`; }
};

const getPriceStatus = item => {
  const meta = item?.priceMeta;
  if (!meta) return null;
  if (meta.isEstimate) return 'Estimate';
  const age = Number(meta.freshnessSeconds || 0);
  if (meta.isCached) {
    if (age < 60) return 'Checked just now';
    if (age < 3600) return `Checked ${Math.max(1, Math.floor(age / 60))} min ago`;
    return `Checked ${Math.max(1, Math.floor(age / 3600))} hr ago`;
  }
  return 'Provider price';
};

const PlannedTripPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const generationStarted = useRef(false);
  const [tripData, setTripData] = useState(null);
  const [tripDaysData, setTripDaysData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [tripStatus, setTripStatus] = useState(null);
  const [markingBooked, setMarkingBooked] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [travelStatus, setTravelStatus] = useState(null);
  const [startingTrip, setStartingTrip] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });

  const requireAuth = () => {
    if (isAuthenticated) return true;
    navigate('/login', { state: { from: `/planned-trip/${tripId}` } });
    return false;
  };

  const handleSaveTrip = async () => {
    if (!requireAuth()) return;
    try { setActionError(null); setIsSaving(true); await saveTrip(tripId, getAccessToken()); setIsSaved(true); }
    catch (err) { console.error('Error saving trip:', err); setActionError('We could not save this trip. Your itinerary is still here, so you can try again.'); }
    finally { setIsSaving(false); }
  };

  useEffect(() => { if (tripId) loadTripData(); else { setError('No trip ID provided'); setLoading(false); } }, [tripId]);
  useEffect(() => { if (tripData) { setSelectedFlight(tripData.selectedFlight || null); setSelectedHotel(tripData.selectedHotel || null); setTripStatus(tripData.status || null); setTravelStatus(tripData.travel_status || 'planned'); } }, [tripData]);
  useEffect(() => { if (tripData && tripDaysData.length === 0 && !generationStarted.current && !isGenerating) { const selectedOption = tripData.options?.find(opt => opt.option_id === tripData.selected_option_id); if (selectedOption && tripData.selected_option_id) startProgressiveGeneration(tripData.selected_option_id, selectedOption); } }, [tripData, tripDaysData]);

  const loadTripData = async () => {
    try {
      setLoading(true); setError(null);
      const response = await getTripById(tripId);
      if (response.success && response.data) {
        setTripData(response.data);
        const selectedOption = response.data.options?.find(opt => opt.option_id === response.data.selected_option_id);
        const existingItinerary = selectedOption?.itinerary || [];
        if (existingItinerary.length === 0 && response.data.selected_option_id) {
          const cachedData = getCachedItinerary(tripId, response.data.selected_option_id);
          if (cachedData?.length > 0) { setTripDaysData(cachedData); setLoading(false); return; }
        }
        setTripDaysData(existingItinerary);
      } else setError('Failed to load trip data');
    } catch (err) { console.error('Error loading trip:', err); setError(err.message || 'Failed to load trip. Please try again.'); }
    finally { setLoading(false); }
  };

  const startProgressiveGeneration = async (optionId, selectedOption) => {
    if (generationStarted.current) return;
    generationStarted.current = true;
    const totalDays = tripData?.dates?.duration_days || 3;
    setIsGenerating(true); setGenerationProgress({ completed: 0, total: totalDays });
    try {
      await generateAllDaysProgressively(tripId, optionId, totalDays,
        (dayNumber, dayData) => { setTripDaysData(prev => [...prev.filter(d => d.day_number !== dayNumber), dayData].sort((a, b) => a.day_number - b.day_number)); setGenerationProgress(prev => ({ ...prev, completed: prev.completed + 1 })); },
        completedDays => { setCachedItinerary(tripId, optionId, completedDays); setIsGenerating(false); },
        (dayNumber, generationError) => { console.error(`Day ${dayNumber} failed:`, generationError); }
      );
    } catch (err) { console.error('Error in progressive generation:', err); setError('Failed to generate itinerary. Please try again.'); setIsGenerating(false); }
  };

  if (loading) return <div className="planned-trip-page"><PageMeta title="Loading Trip" description="Loading your private OptionTrip itinerary." noIndex /><PlannedTripHeader tripId={tripId} /><div className="planned-trip-page__loading"><Loader size="large" text="Loading..." /></div></div>;
  if (error) return <div className="planned-trip-page"><PageMeta title="Trip Unavailable" description="This private OptionTrip itinerary is unavailable." noIndex /><PlannedTripHeader tripId={tripId} /><div className="planned-trip-page__error" role="alert"><div className="planned-trip-page__error-icon">⚠️</div><h2 className="planned-trip-page__error-title">Oops! Something went wrong</h2><p className="planned-trip-page__error-message">{error}</p><button className="planned-trip-page__error-button" onClick={loadTripData}>Try Again</button><button className="planned-trip-page__error-button planned-trip-page__error-button--secondary" onClick={() => navigate('/')}>Back to Home</button></div></div>;
  if (!tripData) return <div className="planned-trip-page"><PageMeta title="Trip Not Found" description="This private OptionTrip itinerary could not be found." noIndex /><PlannedTripHeader tripId={tripId} /><div className="planned-trip-page__empty"><div className="planned-trip-page__empty-icon">🗺️</div><h2 className="planned-trip-page__empty-title">No Trip Data Available</h2><p className="planned-trip-page__empty-text">This trip may not exist or has been deleted.</p><button className="planned-trip-page__error-button" onClick={() => navigate('/')}>Create New Trip</button></div></div>;

  const destination = typeof tripData.destination === 'string' ? tripData.destination : (tripData.destination?.name || tripData.destination?.city || 'your destination');
  const tripTitle = `Trip to ${destination}`;
  const flightPrice = formatMoney(selectedFlight?.price, selectedFlight?.currency || 'USD');
  const hotelPrice = formatMoney(selectedHotel?.price, selectedHotel?.currency || 'USD');
  const flightPriceStatus = getPriceStatus(selectedFlight);
  const sameCurrency = !selectedFlight?.price || !selectedHotel?.price || String(selectedFlight?.currency || 'USD').toUpperCase() === String(selectedHotel?.currency || 'USD').toUpperCase();
  const estimatedTotal = sameCurrency && (selectedFlight?.price || selectedHotel?.price) ? formatMoney((Number(selectedFlight?.price) || 0) + (Number(selectedHotel?.price) || 0), selectedFlight?.currency || selectedHotel?.currency || 'USD') : null;

  return <div className="planned-trip-page">
    <PageMeta title={tripTitle} description={`Your private OptionTrip itinerary for ${destination}, with planning, booking tools and Travel Partner Vi.`} noIndex />
    <PlannedTripHeader tripId={tripId} />
    {actionError && <div className="planned-trip-page__action-error" role="alert"><span>{actionError}</span><button type="button" onClick={() => setActionError(null)} aria-label="Dismiss message">×</button></div>}
    <HeroSection tripData={tripData} destination={tripData.destination} dates={tripData.dates} guests={tripData.guests} budget={tripData.budget} onSave={handleSaveTrip} isSaved={isSaved} isSaving={isSaving} />
    <LiveTripPanel tripData={{ ...tripData, travel_status: travelStatus }} daysData={tripDaysData} />
    <ViOpportunityPanel tripId={tripId} selectedFlight={selectedFlight} isAuthenticated={isAuthenticated} />
    {isAuthenticated && travelStatus === 'planned' && <div className="planned-trip-start-bar"><button className="planned-trip-share-bar__btn" disabled={startingTrip} onClick={async () => { setStartingTrip(true); setActionError(null); try { const res = await startTrip(tripId, getAccessToken()); if (res.success) setTravelStatus(res.data.travel_status); else setActionError('We could not start live trip mode yet. Please try again.'); } catch (err) { console.error(err); setActionError('We could not start live trip mode yet. Please try again.'); } finally { setStartingTrip(false); } }}>{startingTrip ? 'Starting…' : '🧳 Start this trip'}</button></div>}
    <ActivitiesSection tripId={tripId} tripData={tripData} daysData={tripDaysData} selectedOptionId={tripData.selected_option_id} onRefreshData={loadTripData} isGenerating={isGenerating} totalDays={generationProgress.total} onFlightSelected={setSelectedFlight} onHotelSelected={setSelectedHotel} />
    <ViAssistant />
    {isAuthenticated && <div className="planned-trip-share-bar">{shareUrl ? <button className="planned-trip-share-bar__copy" onClick={() => navigator.clipboard?.writeText(shareUrl)} title={shareUrl}>Copy share link · {shareUrl.split('/').pop().slice(0, 8)}…</button> : <button className="planned-trip-share-bar__btn" disabled={isSharing} onClick={async () => { setIsSharing(true); setActionError(null); try { const res = await shareTrip(tripId, getAccessToken()); if (res.success) { const url = `${window.location.origin}/shared/${res.data.shareToken}`; setShareUrl(url); await navigator.clipboard?.writeText(url); } else setActionError('We could not create a share link. Please try again.'); } catch (err) { console.error(err); setActionError('We could not create a share link. Please try again.'); } finally { setIsSharing(false); } }}>{isSharing ? 'Generating…' : '🔗 Share trip'}</button>}</div>}
    {(selectedFlight || selectedHotel) && <div className="planned-trip-summary-bar"><div className="planned-trip-summary-bar__inner"><span className="planned-trip-summary-bar__label">Trip Summary:</span>{selectedFlight && <span className="planned-trip-summary-bar__item planned-trip-summary-bar__item--flight">✈ <span>{selectedFlight.departure}</span> <span aria-hidden="true">→</span> <span>{selectedFlight.arrival}</span>{flightPrice && <span> · {flightPrice}</span>}{flightPriceStatus && <small className="planned-trip-summary-bar__price-status"> · {flightPriceStatus}</small>}</span>}{selectedHotel && <span className="planned-trip-summary-bar__item planned-trip-summary-bar__item--hotel">🏨 <span>{selectedHotel.name}</span>{hotelPrice && <span> · {hotelPrice}/night</span>}</span>}{estimatedTotal && <span className="planned-trip-summary-bar__total">Est. selected items: {estimatedTotal}</span>}{!sameCurrency && <span className="planned-trip-summary-bar__total">Totals shown separately by currency</span>}{tripStatus === 'confirmed' ? <span className="planned-trip-summary-bar__confirmed">✓ Booked</span> : <button className="planned-trip-summary-bar__confirm-btn" disabled={markingBooked} onClick={async () => { if (!requireAuth()) return; setMarkingBooked(true); setActionError(null); try { await confirmTrip(tripId, getAccessToken()); setTripStatus('confirmed'); } catch (err) { console.error(err); setActionError('We could not mark this trip as booked. Please try again.'); } finally { setMarkingBooked(false); } }}>{markingBooked ? 'Saving…' : 'Mark as booked'}</button>}</div></div>}
  </div>;
};

export default PlannedTripPage;