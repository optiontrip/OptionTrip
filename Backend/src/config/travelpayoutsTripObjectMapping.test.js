import assert from 'node:assert/strict';
import { TRAVELPAYOUTS_TRIP_OBJECT_MAPPING } from './travelpayoutsTripObjectMapping.js';

assert.equal(TRAVELPAYOUTS_TRIP_OBJECT_MAPPING.flights, 'transport');
assert.equal(TRAVELPAYOUTS_TRIP_OBJECT_MAPPING.hotels, 'stays');
assert.equal(TRAVELPAYOUTS_TRIP_OBJECT_MAPPING.activities, 'experiences');
assert.equal(TRAVELPAYOUTS_TRIP_OBJECT_MAPPING.esim, 'services');
