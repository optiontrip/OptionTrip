import { registerProviderAdapter } from '../providerExecution.js';
import { searchHotelsHotelbeds } from '../hotelbedsService.js';

let registered = false;

export const registerHotelProviderAdapters = () => {
  if (registered) return;
  registered = true;

  registerProviderAdapter('hotelbeds', 'hotels', async request => {
    const destinationCode = request.destinationCode || request.destId;
    const checkIn = request.checkIn;
    const checkOut = request.checkOut;
    if (!destinationCode || !checkIn || !checkOut) throw new Error('hotel_search_fields_required');

    const hotels = await searchHotelsHotelbeds({
      destinationCode,
      checkIn,
      checkOut,
      adults: Number(request.adults || 1),
      rooms: Number(request.rooms || 1),
      cityName: request.cityName || '',
    });
    if (!Array.isArray(hotels) || hotels.length === 0) throw new Error('hotelbeds_empty');
    return hotels;
  });
};
