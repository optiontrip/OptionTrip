import {
  searchHotelLocations as tpSearchLocations,
} from '../services/travelpayoutsService.js';
import {
  getHotelDetails as bookingGetDetails,
  getRoomList     as bookingGetRooms,
  getHotelPhotos  as bookingGetPhotos,
  getReviewScores as bookingGetReviews,
} from '../services/bookingHotelService.js';
import {
  getHotelbedsDetails,
  getHotelbedsRooms,
  HB_PREFIX,
} from '../services/hotelbedsService.js';
import { searchHotelsWithFallback } from '../services/hotelSearchService.js';

const parseHbId = (hotelId) => {
  const inner = hotelId.slice(HB_PREFIX.length);
  const idx   = inner.indexOf('_');
  if (idx === -1) return { hotelCode: inner, destinationCode: '' };
  return {
    hotelCode:       inner.slice(0, idx),
    destinationCode: inner.slice(idx + 1),
  };
};

export const getHotelLocations = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.trim().length < 2)
      return res.status(400).json({ success: false, message: 'term must be at least 2 characters' });

    const tpLocations = await tpSearchLocations(term.trim());

    const locations = tpLocations.map(loc => ({
      destId:     loc.cityCode,
      name:       loc.name,
      countryName: loc.countryName,
      searchType: 'CITY',
    }));

    console.log(`📍 Returning ${locations.length} location(s) for "${term}"`);
    res.json({ success: true, data: { locations } });
  } catch (err) {
    console.error('❌ Hotel location search error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const searchHotels = async (req, res) => {
  const { destId = '', checkIn, checkOut, adults = 1, rooms = 1, cityName = '' } = req.query;
  const normalizedCityName = String(cityName || '').trim();
  const normalizedDestId = String(destId || '').trim();

  // The home page and Vi can hand off a human-readable city even when the
  // provider-specific destination code has not been resolved yet. The hotel
  // search service already knows how to resolve Booking.com destinations by
  // city name, so do not dead-end the request just because destId is empty.
  if ((!normalizedDestId && !normalizedCityName) || !checkIn || !checkOut)
    return res.status(400).json({ success: false, message: 'destination, checkIn and checkOut are required' });

  const { hotels, source } = await searchHotelsWithFallback({
    destId: normalizedDestId,
    cityName: normalizedCityName,
    checkIn,
    checkOut,
    adults: Number(adults),
    rooms: Number(rooms)
  });

  return res.json({ success: true, data: { hotels, count: hotels.length, source: source || undefined } });
};

export const getHotelDetailsHandler = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId required' });

    let details;
    if (hotelId.startsWith(HB_PREFIX)) {
      const { hotelCode } = parseHbId(hotelId);
      details = await getHotelbedsDetails(hotelCode);
    } else {
      details = await bookingGetDetails(hotelId);
    }

    res.json({ success: true, data: details });
  } catch (err) {
    console.error('❌ Hotel details error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getRoomListHandler = async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, adults = 1, rooms = 1 } = req.query;
    if (!hotelId || !checkIn || !checkOut)
      return res.status(400).json({ success: false, message: 'hotelId, checkIn and checkOut required' });

    let roomList;
    if (hotelId.startsWith(HB_PREFIX)) {
      const { hotelCode, destinationCode } = parseHbId(hotelId);
      roomList = await getHotelbedsRooms({
        hotelCode,
        destinationCode,
        checkIn,
        checkOut,
        adults: Number(adults),
        rooms:  Number(rooms),
      });
    } else {
      roomList = await bookingGetRooms({ hotelId, checkIn, checkOut, adults: Number(adults) });
    }

    res.json({ success: true, data: { rooms: roomList } });
  } catch (err) {
    console.error('❌ Room list error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getHotelPhotosHandler = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId required' });

    let photos;
    if (hotelId.startsWith(HB_PREFIX)) {
      const { hotelCode } = parseHbId(hotelId);
      const details = await getHotelbedsDetails(hotelCode);
      photos = details.photos || [];
    } else {
      photos = await bookingGetPhotos(hotelId);
    }

    res.json({ success: true, data: { photos } });
  } catch (err) {
    console.error('❌ Hotel photos error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};

export const getReviewScoresHandler = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId required' });

    if (hotelId.startsWith(HB_PREFIX)) {
      return res.json({ success: true, data: null });
    }

    const scores = await bookingGetReviews(hotelId);
    res.json({ success: true, data: scores });
  } catch (err) {
    console.error('❌ Review scores error:', err.message);
    res.status(502).json({ success: false, message: err.message });
  }
};
