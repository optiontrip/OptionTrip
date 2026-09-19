import assert from 'node:assert/strict';
import { registerCarProviderAdapters } from '../src/services/providerAdapters/cars.js';
import { executeTravelSearch, getExecutionReadiness } from '../src/services/providerExecution.js';

registerCarProviderAdapters();

const readiness = getExecutionReadiness('cars');
const widget = readiness.find(item => item.provider === 'travelpayouts_car_rental_widget');
assert.ok(widget, 'Car-rental widget provider must be present in execution readiness');
assert.equal(widget.configured, true, 'Car-rental widget provider must stay live by default');
assert.equal(widget.adapter, true, 'Car-rental widget provider must have an executable adapter');
assert.equal(widget.executable, true, 'Cars must remain executable through the unified travel pipeline');

const execution = await executeTravelSearch({
  vertical: 'cars',
  request: {
    pickupLocation: 'Los Angeles',
    dropoffLocation: 'San Diego',
    pickupDate: '2026-10-10',
    returnDate: '2026-10-14',
    driverAge: 37,
    locale: 'en-US',
  },
});

assert.equal(execution.success, true, 'Unified car-rental handoff must execute successfully');
assert.equal(execution.provider, 'travelpayouts_car_rental_widget', 'Car widget must be the primary executable provider');
assert.equal(execution.result?.mode, 'widget_handoff', 'Car execution must return a widget handoff contract');
assert.equal(execution.result?.search?.pickupLocation, 'Los Angeles');
assert.equal(execution.result?.search?.dropoffLocation, 'San Diego');
assert.equal(execution.result?.search?.pickupDate, '2026-10-10');
assert.equal(execution.result?.search?.returnDate, '2026-10-14');
assert.equal(execution.result?.widget?.promoId, 4480, 'EconomyBookings widget promo ID must remain stable');
assert.equal(execution.result?.widget?.campaignId, 10, 'Car-rental widget campaign ID must remain stable');
assert.ok(Array.isArray(execution.result?.bookingOptions), 'Car handoff must expose normalized partner booking options');

console.log('✅ Car-rental unified routing checks passed');
