import assert from 'node:assert/strict';
import {
  TRAVELPAYOUTS_LINK_TARGETS,
  buildTravelpayoutsLinkRequest,
  extractSuccessfulPartnerLinks,
  getTravelpayoutsLinkTarget,
} from '../src/services/travelpayoutsPartnerLinks.js';

assert.equal(
  getTravelpayoutsLinkTarget('twelve_go'),
  'https://12go.asia/en',
  '12Go must have a canonical long URL that can be converted by Travelpayouts',
);

assert.equal(
  getTravelpayoutsLinkTarget('go_city'),
  'https://gocity.com/en',
  'Go City must have a canonical long URL that can be converted by Travelpayouts',
);

assert.equal(
  TRAVELPAYOUTS_LINK_TARGETS.kiwi_com,
  undefined,
  'Kiwi.com must not use the Partner Links API because Travelpayouts documents it as unsupported',
);

const entries = [
  { provider: 'twelve_go', url: 'https://12go.asia/en', subId: 'optiontrip_twelve_go' },
  { provider: 'go_city', url: 'https://gocity.com/en', subId: 'optiontrip_go_city' },
];

const request = buildTravelpayoutsLinkRequest(entries, { trs: 176202, marker: 370056 });
assert.equal(request.trs, 176202);
assert.equal(request.marker, 370056);
assert.equal(request.shorten, true);
assert.deepEqual(request.links.map(item => item.sub_id), ['optiontrip_twelve_go', 'optiontrip_go_city']);

const parsed = extractSuccessfulPartnerLinks({
  result: {
    links: [
      {
        url: 'https://12go.asia/en',
        code: 'success',
        partner_url: 'https://12go.tp.st/example12go',
      },
      {
        url: 'https://gocity.com/en',
        code: 'success',
        partner_url: 'https://gocity.tp.st/examplegocity',
      },
    ],
  },
}, entries);

assert.deepEqual(
  parsed.map(item => item.provider),
  ['twelve_go', 'go_city'],
  'Successful API responses must map back to OptionTrip provider keys',
);
assert.ok(parsed.every(item => item.partnerUrl.startsWith('https://')));

const unsafe = extractSuccessfulPartnerLinks({
  result: {
    links: [{
      url: 'https://12go.asia/en',
      code: 'success',
      partner_url: 'http://unsafe.example/affiliate',
    }],
  },
}, entries);
assert.equal(unsafe.length, 0, 'Non-HTTPS partner links must never become live');

console.log('✅ Travelpayouts automatic partner-link regression checks passed');
