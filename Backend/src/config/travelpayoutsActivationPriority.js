export const TRAVELPAYOUTS_ACTIVATION_PRIORITY = Object.freeze([
  { priority: 1, need: 'ground_transport', providers: ['twelvego', 'omio'] },
  { priority: 2, need: 'activities', providers: ['tiqets', 'klook', 'wegotrip', 'kkday', 'viator'] },
  { priority: 3, need: 'esim', providers: ['airalo', 'saily', 'drimsim'] },
  { priority: 4, need: 'transfers', providers: ['kiwitaxi', 'welcomepickups', 'intuitravel', 'gettransfer'] },
  { priority: 5, need: 'car_rental', providers: ['qeeq', 'economybookings', 'getrentacar', 'autoeurope'] },
  { priority: 6, need: 'insurance', providers: ['insubuy', 'ekta'] },
  { priority: 7, need: 'trip_utilities', providers: ['radicalstorage', 'airhelp', 'compensair'] },
]);
