import assert from 'node:assert/strict';
import { buildMarketplaceSuggestion, detectMarketplaceIntent } from '../src/services/viMarketplaceRouter.js';

const russianBus = buildMarketplaceSuggestion('Мне нужен автобус из Белграда в Сараево');
assert.equal(russianBus?.vertical, 'bus', 'Russian bus request must resolve the bus vertical');
assert.equal(russianBus?.route, '/services?service=bus', 'Bus requests must use the existing service hub route');

const ukrainianInsurance = detectMarketplaceIntent('Потрібне страхування подорожі');
assert.equal(ukrainianInsurance?.vertical, 'insurance', 'Ukrainian insurance request must resolve insurance');

const car = buildMarketplaceSuggestion('I need a rental car in Los Angeles');
assert.equal(car?.vertical, 'cars', 'Car-rental request must resolve cars');
assert.equal(car?.route, '/car-rental', 'Cars must route directly to the live car-rental page');

const tour = buildMarketplaceSuggestion('Хочу экскурсию в Стамбуле');
assert.equal(tour?.vertical, 'activities', 'Russian excursion request must resolve activities');
assert.equal(tour?.route, '/tours', 'Activities must route directly to the live tours page');

const esim = buildMarketplaceSuggestion('Нужен мобильный интернет в Турции');
assert.equal(esim?.vertical, 'esim', 'Russian mobile-data request must resolve eSIM');
assert.equal(esim?.route, '/esim', 'eSIM must route directly to the live eSIM page');

const cityPass = buildMarketplaceSuggestion('Где купить туристическую карту города?');
assert.equal(cityPass?.vertical, 'city_passes', 'Russian city-pass request must resolve city passes');
assert.equal(cityPass?.route, '/services?service=city_passes', 'City passes must use the existing service hub route');

console.log('✅ Vi marketplace routing regression checks passed');
