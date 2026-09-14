import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  place_name: {
    type: String,
    required: true
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  duration: String,
  cost: Number,
  category: {
    type: String,
    enum: ['sightseeing', 'dining', 'adventure', 'relaxation', 'culture', 'shopping', 'transport', 'nature', 'entertainment', 'nightlife', 'beach', 'museum', 'historical', 'outdoor', 'wellness', 'sports', 'photography', 'other'],
    default: 'sightseeing'
  },
  image: String,
  rating: Number,
  address: String,
  place_id: String
});

const dayItinerarySchema = new mongoose.Schema({
  day_number: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  summary: String,
  activities: [activitySchema],
  total_cost: {
    type: Number,
    default: 0
  }
});

const tripOptionSchema = new mongoose.Schema({
  option_id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pace: {
    type: String,
    enum: ['slow', 'moderate', 'fast'],
    required: true
  },
  style: {
    type: String,
    required: true
  },
  total_days: {
    type: Number,
    required: true
  },
  estimated_total_cost: {
    type: Number,
    required: true
  },
  ideal_for: {
    type: String,
    required: true
  },
  highlights: [{
    icon: String,
    label: String,
    value: String
  }],
  itinerary: [dayItinerarySchema],
  itinerary_generated: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const flightSegmentSchema = new mongoose.Schema({
  id: String,
  origin: String,
  destination: String,
  departureAt: String,
  arrivalAt: String,
  carrier: String,
  flightNumber: String,
  aircraft: String,
  departureTerminal: String,
  arrivalTerminal: String,
  durationMinutes: Number,
  journeyId: String
}, { _id: false });

const tripSchema = new mongoose.Schema({
  trip_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    index: true
  },
  origin: {
    text: String,
    place_id: String,
    name: String,
    geometry: {
      lat: Number,
      lng: Number
    }
  },
  destination: {
    text: {
      type: String,
      required: true
    },
    place_id: String,
    name: {
      type: String,
      required: true
    },
    geometry: {
      lat: Number,
      lng: Number
    }
  },
  dates: {
    start_date: {
      type: String,
      required: true
    },
    end_date: {
      type: String,
      required: true
    },
    duration_days: {
      type: Number,
      required: true
    },
    month_year: String
  },
  trip_type: {
    type: String
  },
  guests: {
    total: {
      type: Number,
      min: 0,
      max: 10
    },
    adults: {
      type: Number,
      default: 0
    },
    children: {
      type: Number,
      default: 0
    },
    infants: {
      type: Number,
      default: 0
    },
    label: String
  },
  budget: {
    type: String,
    enum: ['budget', 'moderate', 'luxury', 'premium', null, ''],
  },
  description: String,
  customTitle: String,
  deleted: { type: Boolean, default: false, index: true },

  options: [tripOptionSchema],
  options_generated: {
    type: Boolean,
    default: false
  },

  selected_option_id: String,

  selectedFlight: {
    provider: String,
    bookingUrl: String,
    price: Number,
    currency: { type: String, default: 'USD' },
    departure: String,
    arrival: String,
    airline: String,
    flightNumber: String,
    segments: [flightSegmentSchema],
    savedAt: { type: Date, default: Date.now }
  },
  selectedHotel: {
    provider: String,
    bookingUrl: String,
    price: Number,
    currency: { type: String, default: 'USD' },
    name: String,
    address: String,
    checkIn: String,
    checkOut: String,
    stars: Number,
    savedAt: { type: Date, default: Date.now }
  },
  selectedCar: {
    provider: String,
    bookingUrl: String,
    price: Number,
    currency: { type: String, default: 'USD' },
    carType: String,
    pickupLocation: String,
    savedAt: { type: Date, default: Date.now }
  },
  totalEstimatedCost: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['draft', 'options_generated', 'option_selected', 'itinerary_generated', 'confirmed', 'booked_externally', 'archived'],
    default: 'draft'
  },

  travel_status: {
    type: String,
    enum: ['planned', 'active', 'completed'],
    default: 'planned'
  },
  notes: [{
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }],

  shareToken: { type: String, index: true, sparse: true },
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: true
});

tripSchema.index({ user_id: 1, createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
