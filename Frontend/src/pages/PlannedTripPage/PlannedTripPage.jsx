import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import HeroSection from './sections/HeroSection';
import LiveTripPanel from './sections/LiveTripPanel';
import ActivitiesSection from './sections/ActivitiesSection';
import ViOpportunityPanel from './sections/ViOpportunityPanel';
import ViAssistant from '../../components/ViAssistant/ViAssistant';
import PageMeta from '../../hooks/usePageMeta';
import Loader from '../../components/Loader/Loader';
import {
  getTripById,
  generateAllDaysProgressively,
  getCachedItinerary,
  setCachedItinerary,
  saveTrip,
  confirmTrip,
  shareTrip,
  startTrip,
} from '../../services/tripsService';
import { getAccessToken } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './PlannedTripPage.css';

const PlannedTripHeader = ({ tripId }) => {
  return (
    <header className="planned-trip-header">
      <div className="planned-trip-header__container">
        <Link to="/" className="planned-trip-header__logo">
          <img src="/images/newLogo.png" alt="OptionTrip" />
        </Link>

        <nav className="planned-trip-header__nav">
          <Link to="/" className="planned-trip-header__link">
            Home
          </Link>
          {tripId && (
            <Link to={`/trips/${tripId}`} className="planned-trip-header__link">
              Trip Options
            </Link>
          )}
          <Link to="/blog" className="planned-trip-header__link">
            Blogs
          </Link>
        </nav>
      </div>
    </header>
  );
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

  const [isSaved, setIsSaved]   = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedFlight, setSelectedFlight] = useState(tripData?.selectedFlight || null);
  const [selectedHotel,  setSelectedHotel]  = useState(tripData?.selectedHotel  || null);
  const [tripStatus,     setTripStatus]     = useState(tripData?.status || null);
  const [markingBooked,  setMarkingBooked]  = useState(false);
  const [shareUrl,       setShareUrl]       = useState(null);
  const [isSharing,      setIsSharing]      = useState(false);
  const [travelStatus,   setTravelStatus]   = useState(null);
  const [startingTrip,   setStartingTrip]   = useState(false);

  const handleSaveTrip = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/planned-trip/${tripId}` } });
      return;
    }
    try {
      setIsSaving(true);
      const token = getAccessToken();
      await saveTrip(tripId, token);
      setIsSaved(true);
    } catch (err) {
      console.error('Error saving trip:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (tripId) {
      loadTripData();
    } else {
      setError('No trip ID provided');
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripData) {
      if (tripData.selectedFlight) setSelectedFlight(tripData.selectedFlight);
      if (tripData.selectedHotel)  setSelectedHotel(tripData.selectedHotel);
      if (tripData.status)         setTripStatus(tripData.status);
      setTravelStatus(tripData.travel_status || 'planned');
    }
  }, [tripData]);

  useEffect(() => {
    if (tripData && tripDaysData.length === 0 && !generationStarted.current && !isGenerating) {
      const selectedOption = tripData.options?.find(opt => opt.option_id === tripData.selected_option_id);
      if (selectedOption && tripData.selected_option_id) {
        startProgressiveGeneration(tripData.selected_option_id, selectedOption);
      }
    }
  }, [tripData, tripDaysData]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getTripById(tripId);

      if (response.success && response.data) {
        setTripData(response.data);
        const selectedOption = response.data.options?.find(opt => opt.option_id === response.data.selected_option_id);
        const existingItinerary = selectedOption?.itinerary || [];

        if (existingItinerary.length === 0 && response.data.selected_option_id) {
          const cachedData = getCachedItinerary(tripId, response.data.selected_option_id);
          if (cachedData && cachedData.length > 0) {
            console.log('✅ Using cached itinerary from localStorage');
            setTripDaysData(cachedData);
            setLoading(false);
            return;
          }
        }

        setTripDaysData(existingItinerary);
      } else {
        setError('Failed to load trip data');
      }
    } catch (err) {
      console.error('Error loading trip:', err);
      setError(err.message || 'Failed to load trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startProgressiveGeneration = async (optionId, selectedOption) => {
    if (generationStarted.current) return;
    generationStarted.current = true;

    const totalDays = tripData?.dates?.duration_days || 3;
    console.log(`🚀 Starting progressive generation for ${totalDays} days...`);

    setIsGenerating(true);
    setGenerationProgress({ completed: 0, total: totalDays });

    try {
      await generateAllDaysProgressively(
        tripId,
        optionId,
        totalDays,
        (dayNumber, dayData, fromCache) => {
          console.log(`✅ Day ${dayNumber} loaded${fromCache ? ' (cached)' : ''}`);

          setTripDaysData(prev => {
            const newDays = [...prev.filter(d => d.day_number !== dayNumber), dayData]
              .sort((a, b) => a.day_number - b.day_number);
            return newDays;
          });

          setGenerationProgress(prev => ({
            ...prev,
            completed: prev.completed + 1
          }));
        },
        (completedDays, results) => {
          console.log('✅ All days generated!', completedDays.length);
          setCachedItinerary(tripId, optionId, completedDays);
          setIsGenerating(false);
        },
        (dayNumber, error) => {
          console.error(`❌ Day ${dayNumber} failed:`, error);
        }
      );
    } catch (err) {
      console.error('Error in progressive generation:', err);
      setError('Failed to generate itinerary. Please try again.');
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="planned-trip-page">
        <PlannedTripHeader tripId={tripId} />
        <div className="planned-trip-page__loading">
          <Loader size="large" text="Loading..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="planned-trip-page">
        <PlannedTripHeader tripId={tripId} />
        <div className="planned-trip-page__error">
          <div className="planned-trip-page__error-icon">⚠️</div>
          <h2 className="planned-trip-page__error-title">Oops! Something went wrong</h2>
          <p className="planned-trip-page__error-message">{error}</p>
          <button
            className="planned-trip-page__error-button"
            onClick={loadTripData}
          >
            Try Again
          </button>
          <button
            className="planned-trip-page__error-button planned-trip-page__error-button--secondary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="planned-trip-page">
        <PlannedTripHeader tripId={tripId} />
        <div className="planned-trip-page__empty">
          <div className="planned-trip-page__empty-icon">🗺️</div>
          <h2 className="planned-trip-page__empty-title">No Trip Data Available</h2>
          <p className="planned-trip-page__empty-text">
            This trip may not exist or has been deleted.
          </p>
          <button
            className="planned-trip-page__error-button"
            onClick={() => navigate('/')}
          >
            Create New Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="planned-trip-page">
      <PageMeta title="Your Planned Trip" description="Your personalized trip itinerary." noIndex />
      <PlannedTripHeader tripId={tripId} />

      <HeroSection
        tripData={tripData}
        destination={tripData.destination}
        dates={tripData.dates}
        guests={tripData.guests}
        budget={tripData.budget}
        onSave={handleSaveTrip}
        isSaved={isSaved}
        isSaving={isSaving}
      />

      <LiveTripPanel tripData={{ ...tripData, travel_status: travelStatus }} daysData={tripDaysData} />

      <ViOpportunityPanel
        tripId={tripId}
        selectedFlight={selectedFlight}
        isAuthenticated={isAuthenticated}
      />

      {isAuthenticated && travelStatus === 'planned' && (
        <div className="planned-trip-start-bar">
          <button
            className="planned-trip-share-bar__btn"
            disabled={startingTrip}
            onClick={async () => {
              setStartingTrip(true);
              try {
                const token = getAccessToken();
                const res = await startTrip(tripId, token);
                if (res.success) setTravelStatus(res.data.travel_status);
              } catch {} finally { setStartingTrip(false); }
            }}
          >
            {startingTrip ? 'Starting…' : '🧳 Start this trip'}
          </button>
        </div>
      )}

      <ActivitiesSection
        tripId={tripId}
        tripData={tripData}
        daysData={tripDaysData}
        selectedOptionId={tripData.selected_option_id}
        onRefreshData={loadTripData}
        isGenerating={isGenerating}
        totalDays={generationProgress.total}
        onFlightSelected={f => setSelectedFlight(f)}
        onHotelSelected={h => setSelectedHotel(h)}
      />
      <ViAssistant />

      {isAuthenticated && (
        <div className="planned-trip-share-bar">
          {shareUrl ? (
            <button
              className="planned-trip-share-bar__copy"
              onClick={() => { navigator.clipboard?.writeText(shareUrl); }}
              title={shareUrl}
            >
              Link copied! {shareUrl.split('/').pop().slice(0, 8)}…
            </button>
          ) : (
            <button
              className="planned-trip-share-bar__btn"
              disabled={isSharing}
              onClick={async () => {
                setIsSharing(true);
                try {
                  const token = getAccessToken();
                  const res = await shareTrip(tripId, token);
                  if (res.success) {
                    const url = `${window.location.origin}/shared/${res.data.shareToken}`;
                    setShareUrl(url);
                    navigator.clipboard?.writeText(url);
                  }
                } catch {} finally { setIsSharing(false); }
              }}
            >
              {isSharing ? 'Generating…' : '🔗 Share trip'}
            </button>
          )}
        </div>
      )}

      {(selectedFlight || selectedHotel) && (
        <div className="planned-trip-summary-bar">
          <div className="planned-trip-summary-bar__inner">
            <span className="planned-trip-summary-bar__label">Trip Summary:</span>
            {selectedFlight && (
              <span className="planned-trip-summary-bar__item planned-trip-summary-bar__item--flight">
                ✈ {selectedFlight.departure} → {selectedFlight.arrival}
                {selectedFlight.price ? ` · $${selectedFlight.price}` : ''}
              </span>
            )}
            {selectedHotel && (
              <span className="planned-trip-summary-bar__item planned-trip-summary-bar__item--hotel">
                🏨 {selectedHotel.name}
                {selectedHotel.price ? ` · $${selectedHotel.price}/night` : ''}
              </span>
            )}
            {(selectedFlight?.price || selectedHotel?.price) && (
              <span className="planned-trip-summary-bar__total">
                Est. total: ${((selectedFlight?.price || 0) + (selectedHotel?.price || 0)).toLocaleString()}
              </span>
            )}
            {tripStatus === 'confirmed' ? (
              <span className="planned-trip-summary-bar__confirmed">✓ Booked</span>
            ) : (
              <button
                className="planned-trip-summary-bar__confirm-btn"
                disabled={markingBooked}
                onClick={async () => {
                  setMarkingBooked(true);
                  try {
                    const token = getAccessToken();
                    await confirmTrip(tripId, token);
                    setTripStatus('confirmed');
                  } catch {} finally { setMarkingBooked(false); }
                }}
              >
                {markingBooked ? 'Saving…' : 'Mark as booked'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannedTripPage;
