import React, { useState, useMemo } from 'react';
import useCurrency from '../../../hooks/useCurrency';
import './ActivitiesSection.css';
import ActivityCard from '../../../components/ActivityCard/ActivityCard';
import AuthModal from '../../../components/AuthModal/AuthModal';
import { useAuth } from '../../../contexts/AuthContext';
import { getAccessToken } from '../../../services/authService';
import { saveTrip } from '../../../services/tripsService';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SimCardIcon from '@mui/icons-material/SimCard';
import MapIcon from '@mui/icons-material/Map';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExploreIcon from '@mui/icons-material/Explore';
import TourIcon from '@mui/icons-material/Tour';
import FlightTab from './FlightTab';
import HotelTab from './HotelTab';
import CarRentalTab from './CarRentalTab';
import EsimTab from './EsimTab';
import ToursTab from './ToursTab';
import TripMapTab from './TripMapTab';
import CalendarTab from './CalendarTab';

const ActivityCardSkeleton = () => (
  <div className="act-sk-card"><div className="act-sk-main"><div className="act-sk-image act-sk-shimmer" /><div className="act-sk-content"><div className="act-sk-header-row"><div className="act-sk-shimmer" style={{ width: 20, height: 20, borderRadius: 4 }} /><div className="act-sk-shimmer" style={{ width: 80, height: 16 }} /><div className="act-sk-vdivider" /><div className="act-sk-shimmer" style={{ width: 160, height: 16 }} /><div className="act-sk-shimmer act-sk-badge" /></div><div className="act-sk-shimmer" style={{ width: '65%', height: 22 }} /><div className="act-sk-rating-row"><div className="act-sk-shimmer" style={{ width: 90, height: 14 }} /><div className="act-sk-shimmer" style={{ width: 70, height: 14 }} /></div><div className="act-sk-desc"><div className="act-sk-shimmer" style={{ width: '100%', height: 13 }} /><div className="act-sk-shimmer" style={{ width: '82%', height: 13 }} /><div className="act-sk-shimmer" style={{ width: '55%', height: 13 }} /></div><div className="act-sk-tags"><div className="act-sk-shimmer act-sk-pill" /><div className="act-sk-shimmer act-sk-pill" style={{ width: 80 }} /><div className="act-sk-shimmer act-sk-pill" style={{ width: 60 }} /></div><div className="act-sk-location"><div className="act-sk-shimmer" style={{ width: 16, height: 16, borderRadius: '50%' }} /><div className="act-sk-shimmer" style={{ width: 200, height: 13 }} /></div></div><div className="act-sk-actions"><div className="act-sk-shimmer act-sk-btn" /><div className="act-sk-shimmer act-sk-btn act-sk-btn--sm" /></div></div></div>
);

const ItinerarySkeletonSection = () => <div className="act-sk-section"><div className="act-sk-day-header"><div className="act-sk-shimmer" style={{ width: 120, height: 28 }} /><div className="act-sk-shimmer" style={{ width: 200, height: 16 }} /></div><ActivityCardSkeleton /><ActivityCardSkeleton /><ActivityCardSkeleton /></div>;

const ActivitiesSection = ({ tripId, tripData, daysData: propDaysData, isGenerating, totalDays, onFlightSelected, onHotelSelected }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [localDaysData, setLocalDaysData] = useState([]);
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();

  React.useEffect(() => { if (propDaysData?.length > 0) setLocalDaysData(propDaysData); }, [propDaysData]);

  React.useEffect(() => {
    const routeToService = event => {
      const service = event?.detail?.service;
      const tabByService = { itinerary: 0, stays: 1, hotels: 1, cars: 2, flights: 3, map: 4, calendar: 5, esim: 6, tours: 7, activities: 7 };
      if (service && Object.prototype.hasOwnProperty.call(tabByService, service)) {
        setActiveTab(tabByService[service]);
        window.setTimeout(() => document.getElementById('trip-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    };
    window.addEventListener('optiontrip:open-service', routeToService);
    return () => window.removeEventListener('optiontrip:open-service', routeToService);
  }, []);

  const daysData = useMemo(() => localDaysData.length > 0 ? localDaysData : (propDaysData || []), [localDaysData, propDaysData]);
  const tabs = useMemo(() => [
    { id: 'tab1', title: 'Your Trip', icon: ExploreIcon, value: 0 },
    { id: 'tab2', title: 'Stays', icon: HotelIcon, value: 1 },
    { id: 'tab3', title: 'Rental Cars', icon: DirectionsCarIcon, value: 2 },
    { id: 'tab4', title: 'Flights', icon: FlightIcon, value: 3 },
    { id: 'tab5', title: 'Map Your Trip', icon: MapIcon, value: 4 },
    { id: 'tab6', title: 'Calendar', icon: CalendarMonthIcon, value: 5 },
    { id: 'tab7', title: 'eSIM', icon: SimCardIcon, value: 6 },
    { id: 'tab8', title: 'Tours', icon: TourIcon, value: 7 },
  ], []);

  const dayTabs = useMemo(() => {
    const loadedTabs = daysData.map((day, index) => ({ value: day.day_number || index + 1, label: `Day ${day.day_number || index + 1}`, isLoading: false }));
    if (isGenerating && totalDays) { const nextDayNumber = daysData.length + 1; if (nextDayNumber <= totalDays) loadedTabs.push({ value: nextDayNumber, label: `Day ${nextDayNumber}`, isLoading: true }); }
    return loadedTabs;
  }, [daysData, isGenerating, totalDays]);

  const currentDayData = useMemo(() => (!daysData?.length ? null : daysData[activeDayTab - 1]), [daysData, activeDayTab]);
  const formatDate = dateString => !dateString ? '' : new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const handleSaveTrip = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    setIsSaving(true);
    try { await saveTrip(tripId, getAccessToken()); setIsSaved(true); } catch (err) { console.error('Error saving trip:', err); alert('Failed to save trip. Please try again.'); } finally { setIsSaving(false); }
  };
  const handleAuthSuccess = () => handleSaveTrip();
  const handleRemoveActivity = activityToRemove => {
    if (!window.confirm(`Are you sure you want to remove "${activityToRemove.title || activityToRemove.name || 'this activity'}" from your itinerary?`)) return;
    setLocalDaysData(prevDays => prevDays.map(day => {
      if (day.day_number !== activeDayTab) return day;
      const updatedActivities = day.activities.filter(activity => (activity.place_id || activity.title || activity.name) !== (activityToRemove.place_id || activityToRemove.title || activityToRemove.name));
      return { ...day, activities: updatedActivities, total_cost: updatedActivities.reduce((sum, act) => sum + (typeof act.cost === 'number' ? act.cost : (parseInt(act.cost) || 0)), 0) };
    }));
  };
  const handleAddActivity = () => window.dispatchEvent(new CustomEvent('vi:open', { detail: { message: `Suggest an activity I can add to day ${activeDayTab} of this trip.` } }));

  return (
    <section className="activities-section" id="trip-services">
      <div className="activities-section__container">
        <div className="activities-section__tabs" role="tablist" aria-label="Trip services">
          {tabs.map(tab => { const IconComponent = tab.icon; return <button key={tab.id} className={`activities-section__tab ${activeTab === tab.value ? 'activities-section__tab--active' : ''}`} onClick={() => setActiveTab(tab.value)} role="tab" aria-selected={activeTab === tab.value}><IconComponent className="activities-section__tab-icon" /><span>{tab.title}</span></button>; })}
        </div>
        <div className="activities-section__content">
          {activeTab === 0 && <>
            <div className="activities-section__header"><div><h2 className="activities-section__title">Your Itinerary</h2><p className="activities-section__subtitle">Your personalized day-by-day travel plan</p></div><button className={`activities-section__save-btn ${isSaved ? 'activities-section__save-btn--saved' : ''}`} onClick={handleSaveTrip} disabled={isSaving || isSaved}>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Trip'}</button></div>
            {dayTabs.length > 0 && <div className="activities-section__day-tabs">{dayTabs.map(day => <button key={day.value} className={`activities-section__day-tab ${activeDayTab === day.value ? 'activities-section__day-tab--active' : ''} ${day.isLoading ? 'activities-section__day-tab--loading' : ''}`} onClick={() => !day.isLoading && setActiveDayTab(day.value)} disabled={day.isLoading}>{day.label}{day.isLoading && <span className="activities-section__day-tab-spinner" />}</button>)}</div>}
            {currentDayData ? <div className="activities-section__day-content"><div className="activities-section__day-header"><div><h3 className="activities-section__day-title">Day {currentDayData.day_number}</h3><p className="activities-section__day-date">{formatDate(currentDayData.date)}</p></div>{currentDayData.total_cost !== undefined && <div className="activities-section__day-cost"><span>Day Total</span><strong>{formatPrice(currentDayData.total_cost)}</strong></div>}</div><div className="activities-section__activities-list">{currentDayData.activities?.map((activity, index) => <ActivityCard key={activity.place_id || index} activity={activity} onRemove={() => handleRemoveActivity(activity)} />)}<button type="button" className="activities-section__add-activity" onClick={handleAddActivity}>+ Ask Vi to add an activity</button></div></div> : isGenerating ? <ItinerarySkeletonSection /> : <div className="activities-section__empty"><p>Your itinerary is being prepared.</p></div>}
          </>}
          {activeTab === 1 && <HotelTab tripData={tripData} onHotelSelected={onHotelSelected} />}
          {activeTab === 2 && <CarRentalTab tripData={tripData} />}
          {activeTab === 3 && <FlightTab tripData={tripData} onFlightSelected={onFlightSelected} />}
          {activeTab === 4 && <TripMapTab tripData={tripData} daysData={daysData} />}
          {activeTab === 5 && <CalendarTab tripData={tripData} daysData={daysData} />}
          {activeTab === 6 && <EsimTab tripData={tripData} />}
          {activeTab === 7 && <ToursTab tripData={tripData} />}
        </div>
      </div>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />}
    </section>
  );
};

export default ActivitiesSection;
